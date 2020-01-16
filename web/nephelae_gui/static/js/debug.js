// Activate current menu in nav
$('#nav_debug').addClass('active');

// Chart style and options
var chart_size = 1000;

var layout = {
    width: chart_size,
    height: chart_size,
};

var config = {
    responsive : true,
    displaylogo: false,
};

var parameters = {
    socket_debug: null,
};

$(document).ready(function(){
    setupDebug();
});

function setupDebug(){
    setDebugSocket();
    Plotly.react('chart', []);
    removeLoader();
}

function displayChart(message){
    console.log(message);
}

function setDebugSocket(){
    parameters.socket_debug = new WebSocket('ws://' + window.location.host +
        '/ws/debug_tracker/');
    parameters.socket_debug.onmessage = (e) => displayChart(JSON.parse(e.data));
}
