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
    buffer_size: parseInt(Cookies.get('buffer_size')),
}

$(document).ready(() => {
    setupGUI();
});

function setupGUI(){

    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    var f1 = gui.addFolder('Controls');
    f1.add(parameters, 'trail_length', 10, 2000).step(10).name("Log length (s)").onFinishChange(
	function() {
		Cookies.set('trail_length', parameters.trail_length);	
		updateData();
	});
    f1.add(parameters, 'streaming').name("Streaming").onChange((state) => toggleStreaming(state));
    f1.add(parameters, 'buffer_size', 5, 1000).step(1).name("Buffer size").onFinishChange(
	function() {
		Cookies.set('buffer_size', parameters.buffer_size);	
		updateData();
	});
	$.getJSON('/discover/', (response) => {

        parameters['uavs'] = {};
        parameters['variables'] = {};

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
    var query = $.param({trail_length: parameters.trail_length,
			 variables: getSelectedElements(parameters.variables),
			 uav_id: getSelectedElements(parameters.uavs)});
    $.getJSON('update/?'+query, function(response){
        for(var variable_name in response.data[parameters.tracked_uav]){
            var positions = response.data[parameters.tracked_uav][variable_name]['positions'];
            var altitudes = [];
                
            for(var i = 0; i < positions.length ; i++){
                altitudes.push(positions[i][3]);
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
		if (data['variable_name'] == 'THT')
			chart_name = 'temperature_chart';
		else if (data['variable_name'] == 'RCT')
			chart_name = 'humidity_chart';
		var chart = $('#' + chart_name);
		var trace_index = getTraceIndexByName(chart, data.uav_id)
		var update = {
			y: [[data.position[3]]],
			x: [[data.data[0]]]
		};
		Plotly.extendTraces(chart_name, update, [trace_index]);
	}
}

function toggleStreaming(state){
    if (state){
        updateData();
    } else {
        parameters.socket.close();
        parameters.socket = null;
    }  
}

function updateCharts(data){
    Plotly.react('temperature_chart', data.THT, layouts.temperature, config);
    Plotly.react('humidity_chart', data.RCT, layouts.humidity, config);
}

function getTraceIndexByName(chart, name){
    return chart[0].data.findIndex(element => element.name == name);
}
