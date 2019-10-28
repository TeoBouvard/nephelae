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
    tracked_uav: 'None',
    start_buff : 0,
    end_buff : 100
}

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
    $.getJSON('/discover/', (response) => {

        parameters['uavs'] = {};
        parameters['variables'] = {};

    gui.add(parameters, 'streaming').name("Streaming").onChange(function(state) {
        fieldsBehavior(state, f1, f2);
        toggleStreaming(state);
    });
	gui.add(parameters, 'tracked_uav', response.uavs).setValue(response.uavs[0]).onChange(updateData);
        
	for (var uav_id of response.uavs){
            parameters['uavs'][uav_id] = true;
        }
        
	for (var tag of response.sample_tags){
            parameters['variables'][tag] = (tag == 'THT' || tag == 'RCT');
        }

        // Draw charts once GUI is initialized
        updateData();
    });
}

function updateData(){
    var data = {};
    var query = makeQuery();
    $.getJSON('update/?'+query, function(response){
        for(var variable_name in response.data[parameters.tracked_uav]){
            var positions = response.data[parameters.tracked_uav][variable_name]['positions'];
            var altitudes = [];
            var times = [];
            for(var i = 0; i < positions.length ; i++){
                altitudes.push(positions[i][3]);
                times.push(positions[i][0]);
            }
            var new_data = {
                type: 'line',
                name: parameters.tracked_uav,
                x: response.data[parameters.tracked_uav][variable_name]['values'],
                y: altitudes,
                mode: 'line',
                line: {
                    width: 1,
                    shape: 'linear',
                    color: global_colors[parameters.tracked_uav%global_colors.length],
                },
                meta: [parameters.tracked_uav],
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
        data['ALT'] = [{
            type: 'line',
            name: parameters.tracked_uav,
            x: times,
            y: altitudes,
            mode: 'line',
            line: {
                width: 1,
                shape: 'linear',
                color: global_colors[parameters.tracked_uav%global_colors.length],
            },
            meta: [parameters.tracked_uav],
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
        }];
        updateCharts(data);
        if (parameters.streaming && parameters.socket == null) {
            parameters.socket = new WebSocket('ws://' + window.location.host + '/ws/sensor/');
            parameters.socket.onmessage = (e) => handleMessage(JSON.parse(e.data));
        }
    removeLoader();
    });
}

function handleMessage(data){
  var chart_name = '';
	if ((data['uav_id'] == parameters.tracked_uav)  
		&& (parameters.variables[data.variable_name])){
    var chart_altitude = $('#altitude_chart');
    var first_time = chart_altitude[0].data[0].x[0];
    list_names = ['altitude_chart', 'temperature_chart', 'humidity_chart'];
    while (data.position[0]-first_time > parameters.trail_length){
      list_names.forEach(function(name){
        var document_data = $('#' + name)[0].data;
        document_data[0].x.shift();
        document_data[0].y.shift();
      });
      first_time = chart_altitude[0].data[0].x[0];
    }
		var altitude_trace_index = getTraceIndexByName(chart_altitude, data.uav_id);
		if (data['variable_name'] == 'THT')
			chart_name = 'temperature_chart';
		else if (data['variable_name'] == 'RCT')
			chart_name = 'humidity_chart';
		var chart = $('#' + chart_name);
		var trace_index = getTraceIndexByName(chart, data.uav_id);
		var update = {
			y: [[data.position[3]]],
			x: [[data.data[0]]]
		};
		Plotly.extendTraces(chart_name, update, [trace_index]);
    var chart_altitude = $('#altitude_chart');
		var altitude_trace_index = getTraceIndexByName(chart_altitude, data.uav_id);
    var update_altitude = {
			y: [[data.position[3]]],
			x: [[data.position[0]]]
    };
		Plotly.extendTraces('altitude_chart', update_altitude, [altitude_trace_index]);
	}
}

function toggleStreaming(state){
    if (!state){
        parameters.socket.close();
        parameters.socket = null;
    }  
    updateData();
}

function updateCharts(data){
    Plotly.react('temperature_chart', data.THT, layouts.temperature, config);
    Plotly.react('humidity_chart', data.RCT, layouts.humidity, config);
    Plotly.react('altitude_chart', data.ALT, layouts.altitude, config);
}

function getTraceIndexByName(chart, name){
    return chart[0].data.findIndex(element => element.name == name);
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
