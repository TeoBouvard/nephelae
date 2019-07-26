// Activate current menu in nav
$('#nav_commands').addClass('active');

var gui, gui_commands, chart;

var parameters = {
    fleet: {},
    commands: ['Vertical Profile', 'Horizontal Slice', 'Volumetric Flow Rate'],
    allocation: ['Automatic', 'Manual'],
};


$(document).ready(function(){
	removeLoader();

    discoverFleet();
    setupChart();
});

function setupGUI(){
    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    gui_commands = gui.addFolder("Commands")
    gui_commands.add(parameters, 'commands', parameters.commands)
        .setValue(parameters.commands[0])
        .name('Command')
        .onChange((selectedCommand) => updateGUI(selectedCommand));

    
    updateGUI(parameters.commands);
}

function updateGUI(selectedCommand){

    $('.dg li.title').next().nextAll().remove();

    switch (selectedCommand) {

        case 'Vertical Profile':

            gui_commands.add({fleet:Object.keys(parameters.fleet)}, 'fleet', Object.keys(parameters.fleet))
                .name("UAV")
                .setValue(Object.keys(parameters.fleet)[0]);

            break;
            
        case 'Horizontal Slice':

            gui_commands.add({altitude:500}, 'altitude', 0, 2000).name('Altitude');

        break;
    
        default:
            break;
    }
}

function setupChart(){
    chart = new google.visualization.Timeline($('#chart')[0]);
    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'UAV' });
    dataTable.addColumn({ type: 'string', id: 'Label' });
    dataTable.addColumn({ type: 'number', id: 'Start' });
    dataTable.addColumn({ type: 'number', id: 'End' });

    //fake data
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

    // font options does not work ?
    var options = {
            fontName: 'Roboto',
            //colors: [ 'teal'],
            fontSize: '200px',
    };

    chart.draw(dataTable, options);

}

function discoverFleet(){

    $.getJSON('discover/', (response) => {

        for (uav_id of response.uavs) {
            parameters.fleet[uav_id] = {};
            generateItem(uav_id);
        }

        setupGUI();
        displayFleet();
    });
}

function displayFleet(){

    var socket = new WebSocket('ws://' + window.location.host + '/ws/GPS/');

    socket.onmessage = (e) => {
        var message = JSON.parse(e.data);
        parameters.fleet[message.uav_id] = {
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
            html += '<span class="left">Altitude</span><p id="altitude" class="right"></p><br>';
            html += '<span class="left">Heading</span><p id="heading" class="right"></p><br>';
            html += '<span class="left">Speed</span><p id="speed" class="right"></p><br>';
        html += '</div>';
    html += '</div>';

    $('.free').first().removeClass("free").append(html);
}

function updateItem(id){
    uav = parameters.fleet[id];
    $('#'+id+' #uav_id').text('UAV ' + id);
    $('#'+id+' #battery').text(fakeBattery(uav.time).toFixed(0) + '%');
    $('#'+id+' #altitude').text(uav.altitude.toFixed(1) + 'm');
    $('#'+id+' #heading').text(uav.heading.toFixed(0) + '°');
    $('#'+id+' #speed').text(uav.speed.toFixed(1) + 'm/s');
}

// THIS IS MEANT TO BE DELETED WHEN A REAL BATTERY ESTIMATION EXISTS
function fakeBattery(time){
    return Math.max(100*((1000-time)%1000/1000), 0);
}