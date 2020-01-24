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
    uavs: []
};

var controller_uav = null

$(document).ready(function(){
    setupDebug();
});

function setupDebug(){
    setupGUI();
    setDebugSocket();
    removeLoader();
}

function setupGUI(){
    var gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);
    $.getJSON('/discover/', (response) => {
        x = Object.keys(response.uavs)
        controller_uav = gui.add(parameters, 'uavs', x).setValue(x[0])
            .name("UAV")
    });
}

function displayChart(response){
    if (response.producer == controller_uav.getValue()){
        var lay = createLayout(parameters.variable, response.data);
        var map = {
                x: response.x_axis,
                y: response.y_axis,
                z: response.data,
                colorscale : lay['cmap'],
                type: 'heatmap'
        };
        var center = {
                x: [response.tracked_point[0]],
                y: [response.tracked_point[1]],
                mode: 'markers',
                name: 'Center Tracked',
                type: 'scatter',
        };
        var old_center = {
                x: [response.old_tracked_point[0]],
                y: [response.old_tracked_point[1]],
                mode: 'markers',
                name: 'Old Center',
                type: 'scatter',
        };
        map_data = [map];
        centers = [center, old_center];

        for (var cloud_center of response.centers){
            centers.push({x: [cloud_center[0]], y: [cloud_center[1]], mode: 'markers', 
                name: 'Cloud Center', type: 'scatter'})
        }
        layout.title = lay['title'];
        layout.xaxis = {
            autorange:false,
            range: [Math.min.apply(Math, response.x_axis),
                Math.max.apply(Math, response.x_axis)],
            zeroline:false};
        layout.yaxis = {
                autorange:false,
            range: [Math.min.apply(Math, response.y_axis),
                Math.max.apply(Math, response.y_axis)],
            zeroline: false};
        layout.autosize = false;
        Plotly.react('chart', map_data, layout, config);
        Plotly.addTraces('chart', centers);
    }
}

function setDebugSocket(){
    parameters.socket_debug = new WebSocket('ws://' + window.location.host +
        '/ws/debug_tracker/');
    parameters.socket_debug.onmessage = (e) => displayChart(JSON.parse(e.data));
}
