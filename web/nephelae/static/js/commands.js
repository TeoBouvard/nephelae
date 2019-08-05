// Activate current menu in nav
$('#nav_commands').addClass('active');

var gui, gui_commands, chart;
var command_list = ['Vertical Profile', 'Horizontal Slice', 'Volumetric Flow Rate']

var parameters = {
    fleet: {},
    fleet_array: [],
    horizontal_slice_altitude: 500,
    flow_altitude_1: 500,
    flow_altitude_2: 1000,
    commands: command_list,
    allocation: ['Automatic', 'Manual'],
    execute: sendCommand,
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
    gui_commands.add(parameters, 'commands', command_list)
        .setValue(command_list[0])
        .name('Command')
        .onChange((selectedCommand) => updateGUI(selectedCommand));

    
    updateGUI(parameters.commands);
}

function updateGUI(selectedCommand){
    
    // dynamic command options
    $('.dg li.title').next().nextAll().remove();

    switch (selectedCommand) {

        case command_list[0]:

            gui_commands.add(parameters, 'fleet_array', Object.keys(parameters.fleet))
                .name("UAV")
                .setValue(Object.keys(parameters.fleet)[0]);

            break;
            
        case command_list[1]:

            gui_commands.add(parameters, 'horizontal_slice_altitude', 0, 2000).name('Slice altitude');

        break;

        case command_list[2]:

            gui_commands.add(parameters, 'flow_altitude_1', 0, 2000).name('Base altitude').listen();
            gui_commands.add(parameters, 'flow_altitude_2', 0, 2000).name('Top altitude').listen();

        break;
    
        default:
            break;
    }

    gui_commands.add(parameters, 'execute').name('Send command');
}

function sendCommand(){

    /* TODO WHEN ALLOCATION ALGORITHM EXISTS */
    /* implement a server request, or a websocket message to send command to server */

    switch (parameters.commands) {

        case command_list[0]:
            alert('Sending command : UAV' + parameters.fleet_array + ' -> ' + parameters.commands);
            break;
            
        case command_list[1]:
            alert('Sending command : ' + parameters.commands + ' at ' + parameters.horizontal_slice_altitude.toFixed(0) + 'm');
        break;

        case command_list[2]:
            alert('Sending command : ' + parameters.commands + ' between ' + parameters.flow_altitude_1.toFixed(0) + 'm and ' + parameters.flow_altitude_2.toFixed(0) + 'm');
        break;

        default:
            alert('unknown command');
            break;
    }

}

function setupChart(){
    chart = new google.visualization.Timeline($('#chart_div')[0]);
    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'UAV' });
    dataTable.addColumn({ type: 'string', id: 'Label' });
    dataTable.addColumn({ type: 'number', id: 'Start' });
    dataTable.addColumn({ type: 'number', id: 'End' });

    //fake data
    dataTable.addRows([
        [ '\5', 'Now', 0, 0],
        ['100', 'Idle', -5000, 10000],
        ['100', 'Takeoff', 10000, 15000],
        ['100', 'Survey', 15000, 40000],
        ['101', 'Idle', -5000, 5000],
        ['101', 'Takeoff', 5000, 10000],
        ['101', 'Goto S1', 10000, 20000],
        ['101', 'Idle', 20000, 40000],
        ['102', 'Idle', -5000, 5000],
        ['102', 'Takeoff', 5000, 10000],
        ['102', 'Survey', 10000, 40000],
        ['103', 'Idle', -5000, 40000],
        ['104', 'Idle', -5000, 40000],
        ['105', 'Idle', -5000, 40000]]);

    // font options does not work ?
    var options = {
            fontName: 'Roboto',
            //colors: [ 'teal'],
            fontSize: 200,
            height: 400,
    };
    chart.draw(dataTable, options);
   
    // draw refernce line over chart 
    referenceLine('chart_div');
    google.visualization.events.addListener(chart, 'onmouseout', () => {referenceLine('chart_div');});

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
            html += '<span id="battery" class="new badge right" data-badge-caption=""></span>';
            html += '<br><br><hr><br>';
            html += '<span class="left">Flight Time</span><p id="flight_time" class="right"></p><br>';
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
    $('#'+id+' #battery').addClass("green"); // to be replaced with task color
    $('#'+id+' #flight_time').text(uav.time + 's');
    $('#'+id+' #altitude').text(uav.altitude.toFixed(1) + 'm');
    $('#'+id+' #heading').text(uav.heading.toFixed(0) + '°');
    $('#'+id+' #speed').text(uav.speed.toFixed(1) + 'm/s');
}

// THIS IS MEANT TO BE DELETED WHEN A REAL BATTERY ESTIMATION EXISTS
function fakeBattery(time){
    return Math.max(100*((1000-time)%1000/1000), 0);
}

// draw a vertical line at current time
function referenceLine(div){
    //get the height of the timeline div
    var height;
    $('#' + div + ' rect').each(function(index){
        var x = parseFloat($(this).attr('x'));
        var y = parseFloat($(this).attr('y'));
        if(x == 0 && y == 0) height = parseFloat($(this).attr('height'));
    });

	var nowWord = $('#' + div + ' text:contains("Now")');
    nowWord.prev().first().attr('height', height + 'px').attr('width', '1px').attr('y', '0');
}