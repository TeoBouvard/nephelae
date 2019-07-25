// Activate current menu in nav
$('#nav_commands').addClass('active');

var fleet = {};
var parameters = {};
var chart;

$(document).ready(function(){
    //google.charts.load('current', {'packages':['timeline']});
    //google.charts.setOnLoadCallback(setupChart);
	removeLoader();

	//setupGUI();
    setupChart();
    discoverFleet();
});

function setupGUI(){
    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);
}

function setupChart(){
    chart = new google.visualization.Timeline($('#chart')[0]);
    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'UAV' });
    dataTable.addColumn({ type: 'string', id: 'Label' });
    dataTable.addColumn({ type: 'number', id: 'Start' });
    dataTable.addColumn({ type: 'number', id: 'End' });

    dataTable.addRows([
        ['100', 'Idle', 0, 10000],
        ['100', 'Takeoff', 10000, 15000],
        ['100', 'Survey', 15000, 40000],
        ['101', 'Idle', 0, 5000],
        ['101', 'Takeoff', 5000, 10000],
        ['101', 'Goto S1', 10000, 20000],
        ['101', 'Idle', 20000, 40000],
        ['102', 'Idle', 0, 5000],
        ['102', 'Takeoff', 5000, 10000],
        ['102', 'Survey', 10000, 40000]]);

    // options does not work
    var options = {
            fontName: 'Roboto',
            //colors: ['#cbb69d', '#603913', '#c69c6e'],
            fontSize: 200,
    };

    chart.draw(dataTable, options);

}

function discoverFleet(){

    $.getJSON('discover/', (response) => {

        for (uav_id of response.uavs) {
            fleet[uav_id] = {};
            generateItem(uav_id);
        }

        displayFleet();
    });
}

function displayFleet(){

    var socket = new WebSocket('ws://' + window.location.host + '/ws/GPS/');

    socket.onmessage = (e) => {
        var message = JSON.parse(e.data);
        fleet[message.uav_id] = {
            altitude : message.position[2], 
            heading: message.heading,
            time : message.time,
            speed : message.speed,
        };
        updateItem(message.uav_id);
    };

}

function generateItem(id){

    var html = '<div id="'+ id +'" class="card blue-grey darken-1">';
        html += '<div class="card-content white-text">';
            html += '<span id="uav_id" class="card-title left"></span>';
            html += '<span id="battery" class="card-title right"></span>';
            html += '<br><br><hr><br>';
            html += '<p id="altitude"></p>';
            html += '<p id="heading"></p>';
            html += '<p id="speed"></p>';
            html += '<p id="time"></p>';
        html += '</div>';
    html += '</div>';

    $('.free').first().removeClass("free").append(html);
}

function updateItem(id){
    uav = fleet[id];
    $('#'+id+' #uav_id').text('UAV ' + id);
    $('#'+id+' #battery').text(fakeBattery(uav.time).toFixed(0) + '%');
    $('#'+id+' #altitude').text('altitude ' + uav.altitude.toFixed(1) + 'm');
    $('#'+id+' #heading').text('heading ' + uav.heading.toFixed(0) + '°');
    $('#'+id+' #speed').text('speed ' + uav.speed.toFixed(1) + 'm/s');
}

// THIS IS MEANT TO BE DELETED WHEN A REAL BATTERY ESTIMATION EXISTS
function fakeBattery(time){
    return Math.max(100*((1000-time)%1000/1000), 0);
}