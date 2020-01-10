// Activate current menu in nav
$('#nav_commands').addClass('active');

var gui, gui_commands, gui_mission, chart;
var command_list = ['Vertical Profile', 'Horizontal Slice', 'Volumetric Flow Rate', '...']
var currentParameterNames;

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

var gui_parameters = {
    verbose : false,
    mission_list : ['None'],
    mission_parameters : {},
};

// This is the page init function
$(document).ready( () => {
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
    gui.add(gui_parameters,'verbose').name('Verbose').onChange(generateItems)

    updateGUI(parameters.commands);
}

function updateGuiMission(selectedMission) {

    console.log(gui_commands);
    console.log();
    if (gui_commands.__folders.hasOwnProperty("Parameters")) {
        gui_commands.removeFolder(gui_commands.__folders.Parameters);
    }
    if (selectedMission == "None") return;

    console.log(gui_commands)
    $.getJSON('/missions/mission_parameters/' + selectedMission, (response) => {
        console.log("Fetching mission parameters for " + response.parameters);
        gui_params = gui_commands.addFolder("Parameters");

    });
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
    /* implement a server request to send command to server */

    switch (parameters.commands) {

        case command_list[0]:
            alert('Sending command : UAV' + parameters.fleet_array + ' -> ' + parameters.commands);
            //$.getJSON('enter URL here', (response) => {and callback there} );
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


    var options = {
            colors: ['green','blue','red'],
            timeline: {
                rowLabelStyle: {
                    fontName: 'Roboto', fontSize: 14
                },
                barLabelStyle: { 
                    fontName: 'Roboto', fontSize: 12
                }
            },
            tooltip: {
                trigger: 'none',
            },
            height: 400,
    };

    // draw the chart
    chart.draw(dataTable, options);
   
    // draw a reference line over the chart 
    referenceLine('chart_div');
    google.visualization.events.addListener(chart, 'onmouseout', () => referenceLine('chart_div') );

    // make chart responsive
    $(window).resize(() => {setupChart()});
}

function discoverFleet(){

    $.getJSON('/discover/', (response) => {
        for (uav_id in response.uavs) {
            parameters.fleet[uav_id] = {id : uav_id};
        }
        generateItems();
        setupGUI();
        displayFleet();
    });
}

function displayFleet(){
    statusSocket = new WebSocket('ws://' + window.location.host + '/ws/status/');
    statusSocket.onmessage = (e) => {
        var msg = JSON.parse(e.data);
        parameters.fleet[msg.id] = msg
        updateItem(msg.id);
    };
}

function generateItems(){

    // reseting cards
    $('.filled').removeClass("filled").addClass("free").html("");
    for (aircraftId in parameters.fleet) {
        var html = '<div id="'+ aircraftId +'_card" class="card blue-grey darken-1">';
            html += '<div class="card-content white-text">';

                html += '<span id="uav_id" class="card-title left"></span>';
                html += '<span id="current_block" class="new badge right" data-badge-caption=""></span>';
                html += '<br><br><hr><br>';

                if(!gui_parameters.verbose) {
                    html += '<span class="left">Flight Time</span> <p id="flight_time" class="right"></p><br>';
                    html += '<span class="left">Altitude</span>    <p id="altitude"    class="right"></p><br>';
                    html += '<span class="left">Course</span>      <p id="course"      class="right"></p><br>';
                    html += '<span class="left">Speed</span>       <p id="speed"       class="right"></p><br>';
                    html += '<span class="left">Climb</span>       <p id="climb"       class="right"></p><br>';
                }
                else {
                    html += '<span class="left">Flight Time</span>     <p id="flight_time"     class="right"></p><br>';
                    html += '<span class="left">Altitude</span>        <p id="altitude"        class="right"></p><br>';
                    html += '<span class="left">Ground Altitude</span> <p id="ground_altitude" class="right"></p><br>';
                    html += '<span class="left">Course</span>          <p id="course"          class="right"></p><br>';
                    html += '<span class="left">Target Course</span>   <p id="target_course"   class="right"></p><br>';
                    html += '<span class="left">Heading</span>         <p id="heading"         class="right"></p><br>';
                    html += '<span class="left">Speed</span>           <p id="speed"           class="right"></p><br>';
                    html += '<span class="left">Air Speed</span>       <p id="air_speed"       class="right"></p><br>';
                    html += '<span class="left">Climb</span>           <p id="climb"           class="right"></p><br>';
                    html += '<span class="left">Target Climb</span>    <p id="target_climb"    class="right"></p><br>';
                    html += '<span class="left">ITOW</span>            <p id="itow"            class="right"></p><br>';
                }
                html += '<br>';
                
                html += '<span class="left">';
                html += '<a class="waves-effect waves-light btn-small mission-modal-trigger" aircraft="'+aircraftId+'">New mission</a>';
                html += '</span><br>';
                
            html += '</div>';
        html += '</div>';
        $('.free').first().removeClass("free").addClass("filled").append(html);
    }
    init_mission_modals();
}

function secondsToMMSSstring(seconds) {
    secs = (seconds % 60).toString();
    if (secs.length != 2)
        secs = '0' + secs;
    return Math.floor(seconds / 60).toString() + ':' + secs;
}

function secondsToHHMMSSstring(seconds) {
    hours   = Math.floor(seconds / 3600);
    if (hours < 1)
        return secondsToMMSSstring();

    minutes = (Math.floor(seconds / 60) - 60*hours).toString();
    if (minutes.length != 2) minutes = '0' + minutes;

    secs = (seconds % 60).toString();
    if (secs.length != 2) secs = '0' + secs;

    return hours.toString() + ':' + minutes + ':' + secs;
}

function formatTime(seconds) {
    if (seconds == "NA")
        return seconds;

    if (seconds < 3600)
        return secondsToMMSSstring(seconds);
    else
        return secondsToHHMMSSstring(seconds);
    //return seconds.toString()
}

function updateItem(aircraftId){
    uav = parameters.fleet[aircraftId];
    
    $('#'+aircraftId+'_card #uav_id').text('UAV ' + aircraftId);
    $('#'+aircraftId+'_card #current_block').text(uav.current_block + ' : ' + formatTime(uav.block_time));
    $('#'+aircraftId+'_card #current_block').addClass("green"); // to be replaced with task color

    $('#'+aircraftId+'_card #flight_time').text(formatTime(uav.flight_time));
    $('#'+aircraftId+'_card #altitude').text(uav.alt.toFixed(1)  + 'm');
    $('#'+aircraftId+'_card #course').text(uav.course.toFixed(0) + '°');
    $('#'+aircraftId+'_card #speed').text(uav.speed.toFixed(1)   + 'm/s');
    $('#'+aircraftId+'_card #climb').text(uav.climb.toFixed(1)   + 'm/s');
    
    if(gui_parameters.verbose) {
        $('#'+aircraftId+'_card #ground_altitude').text(uav.agl.toFixed(1)+'m');
        $('#'+aircraftId+'_card #target_course').text(uav.target_course.toFixed(0) + '°');
        $('#'+aircraftId+'_card #heading').text(uav.heading.toFixed(0) + '°');
        $('#'+aircraftId+'_card #air_speed').text(uav.air_speed.toFixed(1) + 'm/s');
        $('#'+aircraftId+'_card #target_climb').text(uav.target_climb.toFixed(1) + 'm/s');
        $('#'+aircraftId+'_card #itow').text(uav.itow);
    }
}

// draw a vertical line at current time in the chart
function referenceLine(div){
    var height;
    $('#' + div + ' rect').each(function(index){
        var x = parseFloat($(this).attr('x'));
        var y = parseFloat($(this).attr('y'));
        if(x == 0 && y == 0) height = parseFloat($(this).attr('height'));
    });

    var nowWord = $('#' + div + ' text:contains("Now")');
    nowWord.prev().first().attr('height', height + 'px').attr('width', '1px').attr('y', '0');
}

function fetchMissionList(){
    $.getJSON('/missions/available_missions/', (response) => {
        console.log(response);
    });
}


