// Activate current menu in nav
$('#nav_commands').addClass('active');

var fleet = {};
var parameters = {};

$(document).ready(function(){
	removeLoader();

	setupGUI();
    discoverFleet();
});

function setupGUI(){
    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

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

    socket.onopen = (e) => {
        console.log("websocket opened", e);
    };

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

    socket.onerror = function(e){
        console.log("error", e)
    };

    socket.onclose = function(e){
        console.log("closed websocket", e)
    };

}

function generateItem(id){

    html = '<div id=' + id + ' class="row"> <div class="col s4"> <div class="card blue-grey darken-1"> <div class="card-content white-text">';
    html += '<span class="card-title"></span>';
    html += '<p id="altitude"></p>';
    html += '<p id="heading"></p>';
    html += '<p id="speed"></p>';
    html += '</div> </div> </div> </div>';

    $('#infolist').append(html);
}

function updateItem(id){
    uav = fleet[id];
    $('#'+id+' .card-title').text('UAV ' + id);
    $('#'+id+' #altitude').text('altitude ' + uav.altitude.toFixed(1) + 'm');
    $('#'+id+' #heading').text('heading ' + uav.heading.toFixed(0) + '°');
    $('#'+id+' #speed').text('speed ' + uav.speed.toFixed(1) + 'm/s');
}