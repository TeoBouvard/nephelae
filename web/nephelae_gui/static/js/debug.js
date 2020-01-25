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
    uavs: [],
    nearest_center: true,
    time: undefined,
    deltaX: 1000,
    deltaY: 1000,
};

var controllers = {};

var no_data = {
    x: [2],
    y: [2],
    mode:'text',
    text: ['No data to display'],
    textfont: {size: 30},
};
var layout_no_data = {
    autorange: true
};

$(document).ready(function(){
    setupDebug();
});

function setupDebug(){
    setupGUI();
}

function setupGUI(){
    var gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);
    $.getJSON('/discover/', (response) => {
        x = Object.keys(response.uavs)
        controllers['uav'] = gui.add(parameters, 'uavs', x)
            .setValue(x[0])
            .name("UAV")

        var f1 = gui.addFolder('Monitoring');
        f1.open();
        controllers['nearest_center'] = f1.add(parameters, 'nearest_center')
            .name('Nearest center')

        controllers['uav'].onFinishChange(function(){
                isChoosingNearestCenter(f1);
            });

        controllers['nearest_center'].onFinishChange(function(){
                setNearestCenter();
            });

        controllers['deltaX'] = f1.add(parameters, 'deltaX')
            .name('Delta X')
            .onChange(setNewDeltaX)

        controllers['deltaY'] = f1.add(parameters, 'deltaY')
            .name('Delta Y')
            .onChange(setNewDeltaY)

        isChoosingNearestCenter(f1);

        setChart();
        setDebugSocket();
        removeLoader();
    });
}

function setChart(){
    Plotly.react('chart', [no_data], layout_no_data, config);
    var chart = document.getElementById('chart');
    chart.on('plotly_click', setNewCenter)
}

function setNewCenter(data){
    if (parameters.time !== undefined){
        var query = $.param({
            uav_id: controllers['uav'].getValue(),
            x: data.points[0].x,
            y: data.points[0].y,
            t: parameters.time
        });
        $.getJSON('send_marker_to_uav/?' + query)
    }
}

function setNewDeltaX(){
    var query = $.param({
        uav_id: controllers['uav'].getValue(),
        deltaX: controllers['deltaX'].getValue()
    });
    $.getJSON('set_delta_x/?' + query);
}

function setNewDeltaY(){
    var query = $.param({
        uav_id: controllers['uav'].getValue(),
        deltaY: controllers['deltaY'].getValue()
    });
    $.getJSON('set_delta_y/?' + query);
}

function setNearestCenter(){
    var query = $.param({
        uav_id: controllers['uav'].getValue(),
        nearest_center: controllers['nearest_center'].getValue()
    });
    $.getJSON('set_choose_nearest_center/?' + query);
}

function isChoosingNearestCenter(folder){
    var query = $.param({uav_id: controllers['uav'].getValue()});
    $.getJSON('is_choosing_nearest_center/?' + query, (response) => {
        if (response.choose_nearest === null){
            Plotly.react('chart', [no_data], layout_no_data, config);
            parameters.time = undefined;
            folder.hide();
        } else {
            folder.show();
            controllers['nearest_center'].setValue(response.choose_nearest);
            $.getJSON('get_deltas/?' + query, (response) => {
                controllers['deltaX'].setValue(response.deltaX)
                controllers['deltaY'].setValue(response.deltaY)
            });
        }
    });
}

function displayChart(response){
    if (!response.stop){
        if (response.producer == controllers['uav'].getValue()){
            var lay = createLayout(parameters.variable, response.data);
            var map = {
                    x: response.x_axis,
                    y: response.y_axis,
                    z: response.data,
                    colorscale : lay['cmap'],
                    type: 'heatmap',
            };
            var center = {
                    x: [response.tracked_point[0]],
                    y: [response.tracked_point[1]],
                    mode: 'markers',
                    name: 'Center Tracked',
                    type: 'scatter',
                    marker: {size: 14, symbol:'x', color: '#ff00ff'},
            };
            var old_center = {
                    x: [response.old_tracked_point[0]],
                    y: [response.old_tracked_point[1]],
                    mode: 'markers',
                    name: 'Old Center',
                    type: 'scatter',
                    marker: {size: 14, symbol:'triangle-up', color: '#ffffff',
                        line:{color: '#000000', width:1.5},},
            };
            map_data = [map];
            centers = [center, old_center];

            for (var cloud_center of response.centers){
                centers.push({x: [cloud_center[0]], y: [cloud_center[1]],
                    mode: 'markers', name: 'Cloud Center', type: 'scatter',
                    marker: {size: 14},})
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
            parameters.time = response.time;
            Plotly.react('chart', map_data, layout, config);
            Plotly.addTraces('chart', centers);
        }
    } else {
        Plotly.react('chart', [no_data], layout_no_data, config);
        parameters.time = undefined;
    }
}

function setDebugSocket(){
    parameters.socket_debug = new WebSocket('ws://' + window.location.host +
        '/ws/debug_tracker/');
    parameters.socket_debug.onmessage = (e) => displayChart(JSON.parse(e.data));
}
