// Activate current menu in nav
$('#nav_profiles').addClass('active');

// Chart style and options
var chart_height = 550;
var lm = 60;
var rm = 30;
var bm = 60;
var tm = 50;

var layouts = {
    temperature: {
        xaxis:{title: 'Temperature (°C)'},
        yaxis:{title: 'Altitude (km)'},
        height: chart_height,
        margin: { l: lm, r: rm, b: bm, t: tm },
        hovermode: 'closest'
    },
    humidity: {
        xaxis:{title: 'Relative Humidity (%)'},
        yaxis:{title: 'Altitude (km)'},
        height: chart_height,
        margin: { l: lm, r: rm, b: bm, t: tm },
        hovermode: 'closest'
    },
    altitude: {
        xaxis:{title: 'Time (s)'},
        yaxis:{title: 'Altitude (km)'},
        height: chart_height,
        margin: { l: lm, r: rm, b: bm, t: tm },
        hovermode: 'closest'
    },
};
var config = {
    responsive : true,
    displaylogo: false,
    displayModeBar: false,
    modeBarButtonsToRemove: ["zoom2d", "pan2d", "select2d", "lasso2d", "zoomIn2d", "zoomOut2d", "autoScale2d", "resetScale2d"],
};

// Keep track of chart state
var refresh_rate = 2000; // ms
var parameters = {
    trail_length: parseInt(Cookies.get('trail_length')), // seconds
    streaming: true,
    socket: null,
    uav_color: {},
    start_buff : 1,
    end_buff : 100
}
var dict_values = {};
var tracked_values = ['THT', 'RCT']

$(document).ready(() => {
    setupGUI();
});

function setupGUI(){

    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    var f1 = gui.addFolder('Real-Time');
    f1.add(parameters, 'trail_length', 10, 2000).step(10).name("Log length (s)").onFinishChange(updateData);
    var f2 = gui.addFolder('History');
    f2.add(parameters, 'start_buff').name("Start Buffer").onChange(updateData);
    f2.add(parameters, 'end_buff').name("End Buffer").onChange(updateData);
    fieldsBehavior(parameters.streaming, f1, f2);
    var f3 = gui.addFolder('UAVs');
    $.getJSON('/discover/', (response) => {

        parameters['uavs'] = {};
        parameters['variables'] = {};

        gui.add(parameters, 'streaming').name("Streaming").onChange(function(state) {
            fieldsBehavior(state, f1, f2);
            toggleStreaming(state);
        });
        list_of_uavs = [];
        for (x of Object.keys(response.uavs)){
            list_of_uavs.push(x);
        }

        for (var uav_id in response.uavs){
            parameters['uavs'][uav_id] = true;
            parameters['uav_color'][uav_id] = response.uavs[uav_id].gui_color;
            f3.add(parameters['uavs'], uav_id).name('UAV ' + uav_id)
                .onChange(updateData);
        }

        for (var tag of response.sample_tags){
            parameters['variables'][tag] = false;
            for (var i = 0; (i < tracked_values.length && !parameters['variables'][tag]); i++){
                parameters['variables'][tag] = (tag == tracked_values[i]);
            }
        }

        // Draw charts once GUI is initialized
        updateData();
    });
}

function updateData(){
    var data = {};
    var query = makeQuery();
    $.getJSON('update/?'+query, function(response){
        for(var uav_id in response.data){
            for(var variable_name in response.data[uav_id]){
                var positions = response.data[uav_id][variable_name]['positions'];
                var altitudes = [];
                var times = [];
                for(var i = 0; i < positions.length ; i++){
                    altitudes.push(positions[i][3]);
                    times.push(positions[i][0]);
                }
                var new_data = {
                    type: 'line',
                    name: uav_id,
                    x: response.data[uav_id][variable_name]['values'],
                    y: altitudes,
                    mode: 'line',
                    line: {
                        width: 1,
                        shape: 'linear',
                        color: parameters.uav_color[uav_id],
                    },
                    meta: [uav_id],
                    hovertemplate:
                    'Valeur : %{x:.1f}s <br>' +
                    'Altitude : %{y:.2f} <br>' +
                    '<extra>UAV %{meta[0]}</extra>',
                    hoverlabel: {
                        bgcolor: 'black',
                        bordercolor: 'black',
                        font: {family: 'Roboto', si1ze: '15', color: 'white'},
                        align: 'left',
                    }
                };
                variable_name in data ? data[variable_name].push(new_data) : data[variable_name] = [new_data];
            }
            alt_var = {
                type: 'line',
                name: uav_id,
                x: times,
                y: altitudes,
                mode: 'line',
                line: {
                    width: 1,
                    shape: 'linear',
                    color: parameters.uav_color[uav_id],
                },
                meta: [uav_id],
                hovertemplate:
                'Valeur : %{x:.1f}s <br>' +
                'Altitude : %{y:.2f} <br>' +
                '<extra>UAV %{meta[0]}</extra>',
                hoverlabel: {
                    bgcolor: 'black',
                    bordercolor: 'black',
                    font: {family: 'Roboto', si1ze: '15', color: 'white'},
                    align: 'left',
                }
            };
            'ALT' in data ? data['ALT'].push(alt_var) : data['ALT'] = [alt_var]
        }
        updateCharts(data);
        if (parameters.streaming && parameters.socket == null) {
            parameters.socket = new WebSocket('ws://' + window.location.host + '/ws/sensor/profiles/');
            parameters.socket.onmessage = (e) => handleMessage(JSON.parse(e.data));
        }
        removeLoader();
    });
}

function handleMessage(messages){
    for (var data of messages){
        if (parameters.uavs[data.uav_id] &&
            parameters.variables[data.variable_name]){
            dict_values[data.variable_name] = {
                x: [[data.data[0]]],
                y: [[data.position[3]]],
            };
            if (tracked_values.length == Object.keys(dict_values).length){
                plotMessage(data, dict_values);
                dict_values = {};
            }
        }
    }
}

function plotMessage(data, dict_values){
    var chart_altitude = document.getElementById('altitude_chart');
    var chart_temperature = document.getElementById('temperature_chart');
    var chart_humidity = document.getElementById('humidity_chart');
    for(var i = 0; i < chart_altitude.data.length; i++){
        var first_time = chart_altitude.data[i].x[0];
        list_charts = [chart_altitude, chart_temperature, chart_humidity];
        while (list_charts[0].data[i].x[0] !== 'undefined' &&
            data.position[0]-first_time > parameters.trail_length){
            list_charts.forEach(function(chart){
                chart.data[i].x.shift();
                chart.data[i].y.shift();
            });
            first_time = chart_altitude.data[i].x[0];
        }
    }
    for (var tag of tracked_values){
        if(tag =='THT'){
            var chart_name = 'temperature_chart';
            var trace_index = getTraceIndexByName(chart_temperature, data.uav_id);
        } else {
            var chart_name = 'humidity_chart';
            var trace_index = getTraceIndexByName(chart_humidity, data.uav_id);
        }
        if (trace_index > -1)
            Plotly.extendTraces(chart_name, dict_values[tag], [trace_index]);
    }
    trace_index = getTraceIndexByName(chart_altitude, data.uav_id);
    var update = {
        x: [[data.position[0]]],
        y: [[data.position[3]]],
    };
    if (trace_index > -1)
        Plotly.extendTraces('altitude_chart', update, [trace_index]);
}

function toggleStreaming(state){
    if (!state){
        parameters.socket.close();
        parameters.socket = null;
        dict_values = {};
    }
    updateData();
}

function updateCharts(data){
    Plotly.react('temperature_chart', data.THT, layouts.temperature, config);
    Plotly.react('humidity_chart', data.RCT, layouts.humidity, config);
    Plotly.react('altitude_chart', data.ALT, layouts.altitude, config);
}

function getTraceIndexByName(chart, name){
    return chart.data.findIndex(element => element.name == name);
}

function makeQuery(){
    return (parameters.streaming 
        ? 
        $.param({start: parameters.trail_length,
            variables: getSelectedElements(parameters.variables),
            uav_id: getSelectedElements(parameters.uavs)})
        :
        $.param({start: -parameters.start_buff,
            variables: getSelectedElements(parameters.variables),
            uav_id: getSelectedElements(parameters.uavs),
            step: 1,
            end: parameters.end_buff}));
}

function fieldsBehavior(state, f1, f2){
    if (state){
        f1.show();
        f1.open();
        f2.hide();
    } else {
        f1.hide();
        f2.show();
        f2.open();
    }
}
