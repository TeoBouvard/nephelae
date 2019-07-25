// Activate current menu in nav
$('#nav_commands').addClass('active');

var fleet = {};
var parameters = {};
var chart;

$(document).ready(function(){
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
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });

    dataTable.addRows([
        ['100', 'Idle', new Date(0), new Date(500)],
        ['101', 'Idle', new Date(0), new Date(200)],
        ['102', 'Idle', new Date(0), new Date(300)]]);

    chart.draw(dataTable);

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