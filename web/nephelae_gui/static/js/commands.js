// Activate current menu in nav
$('#nav_commands').addClass('active');

var gui, gui_commands, gui_mission, chart;
var currentParameterNames;

var parameters = {
    fleet: {},
};

var gui_parameters = {
    verbose : false,
};

// This is the page init function
$(document).ready( () => {
    removeLoader();
    discoverFleet();
    missionUploadSocket = new WebSocket('ws://' + window.location.host + '/ws/mission_upload/');
    missionUploadSocket.onmessage = (e) => { updateChartData(); };
});

function setupGUI(){
    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);
    gui.add(gui_parameters,'verbose').name('Verbose').onChange(generateItems)
}

function discoverFleet(){

    $.getJSON('/discover/', (response) => {
        for (uav_id in response.uavs) {
            parameters.fleet[uav_id] = {id : uav_id};
        }
        generateItems();
        setupGUI();
        displayFleet();
        updateChartData();
        //setupChart();
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
    for (let aircraftId in parameters.fleet) {
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
                html += '<a id="create_mission_btn_' + aircraftId + '" ' +
                           'aircraft="' + aircraftId + '" ' +
                           'class="waves-effect waves-light btn-small mission-modal-trigger">New mission</a>';
                html += '</span><br>';

                html += '<br>';
                html += '<span class="left">';
                html += '<a id="' + aircraftId + '_nextMission" class="waves-effect waves-light btn-small">Next mission</a>';
                html += '</span><br>';
                
                html += '<br>';
                html += '<span class="left">';
                html += '<a id="' + aircraftId + '_endMission" class="waves-effect waves-light btn-small">End mission</a>';
                html += '</span><br>';

            html += '</div>';
        html += '</div>';
        $('.free').first().removeClass("free").addClass("filled").append(html);
        $('#'+aircraftId+'_nextMission').click(function(){
            nextMission(aircraftId);
        });
        $('#'+aircraftId+'_endMission').click(function(){
            endMission(aircraftId);
        });
    }
    init_mission_modals();
}


function nextMission(aircraft_id){
    var obj_id = {'aircraft_id': aircraft_id};
    $.ajax({
        dataType: 'JSON',
        url: '/aircrafts/next_mission/' + aircraft_id,
        success: function(){
            Refresher.sendRefreshSignal(obj_id, refreshTypes.MISSION_UPDATE);
        },
    });
    return false;
}

function endMission(aircraft_id){
    var obj_id = {'aircraft_id': aircraft_id};
    $.ajax({
        dataType: 'JSON',
        url: '/aircrafts/end_mission/' + aircraft_id,
        success: function(){
            Refresher.sendRefreshSignal(obj_id, refreshTypes.MISSION_UPDATE);
        },
    });
    return false;
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

