// Activate current menu in nav
$('#nav_profiles').addClass('active');

// Chart style and options
var chart_height = 550;
var max_alt = 3;
var max_temp = 40;
var lm = 60;
var rm = 30;
var bm = 60;
var tm = 50;

var layouts = {
    temperature: {
        xaxis:{title: 'Temperature (°C)', range:[0,max_temp]},
        yaxis:{title: 'Altitude (km)', range:[0,max_alt]},
        height: chart_height,
        margin: { l: lm, r: rm, b: bm, t: tm },
    },
    humidity: {
        xaxis:{title: 'Relative Humidity (%)', range:[0,100]},
        yaxis:{title: 'Altitude (km)', range:[0,max_alt]},
        height: chart_height,
        margin: { l: lm, r: rm, b: bm, t: tm },
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
    altitude: 0,
    streaming: true,
    socket: null,
}

$(document).ready(() => {
    setupGUI();
});

function setupGUI(){

    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    var f1 = gui.addFolder('Controls');
    
    $.getJSON('box/', (response) => {
            // Parse response
            var min_altitude = Math.ceil(response[1].min);
            var max_altitude = Math.floor(response[1].max);
            var initial_altitude = 1075;

            // Setup GUI
            f1.add(parameters, 'altitude', min_altitude, max_altitude)
                .setValue(initial_altitude)
                .step(1)
                .name('Altitude (m)')
                .onFinishChange(updateData);
    });
    f1.add(parameters, 'trail_length', 10, 2000).step(10).name("Log length (s)").onFinishChange(updateData);
    f1.add(parameters, 'streaming').name("Streaming").onChange((state) => toggleStreaming(state));

    var f2 = gui.addFolder('UAVs');
    var f3 = gui.addFolder('Variables');

    $.getJSON('/discover/', (response) => {

        parameters['uavs'] = {};
        parameters['variables'] = {};

        for (var uav_id of response.uavs){
            parameters['uavs'][uav_id] = true;
            f2.add(parameters['uavs'], uav_id).name('UAV ' + uav_id).onChange(updateData);
        }

        for (var tag of response.sample_tags){
            parameters['variables'][tag] = true;
            f3.add(parameters['variables'], tag).name(tag).onChange((state) => toggleChart(state));
        }

        // Draw charts once GUI is initialized
        updateData();
    });
}

function updateData(){
    var data = {};
    var query = $.param({trail_length: parameters.trail_length, uav_id: getSelectedElements(parameters.uavs), variables: getSelectedElements(parameters.variables)});
    $.getJSON('update/?'+query, function(response){
        var positions = response.data['100']['THT']['positions'];
        var altitudes = [];
        for(var i = 0; i < positions.length ; i++){
            altitudes.push(positions[i][3]);
        }
        var new_data = {
            type: 'line',
            name: '100',
            x: response.data['100']['THT']['values'],
            y: altitudes,
            mode: 'line',
            line: {
                width: 1,
                shape: 'linear',
                color: global_colors['100'%global_colors.length],
            },
            meta: ['100'],
            hovertemplate:
                'Temperature : %{x:.1f}s <br>' +
                'Altitude : %{y:.2f} <br>' +
                '<extra>UAV %{meta[0]}</extra>',
            hoverlabel: {
                bgcolor: 'black',
                bordercolor: 'black',
                font: {family: 'Roboto', si1ze: '15', color: 'white'},
                align: 'left',
            }
        };
        'THT' in data ? data['THT'].push(new_data) : data['THT'] = [new_data];
        updateCharts(data);
	setTimeout(updateData, refresh_rate);
    	removeLoader();
    });
}

function updateCharts(data){
    
    Plotly.react('temperature_chart', data.THT, layouts.temperature, config);
    Plotly.react('humidity_chart', data.humidity, layouts.humidity, config);
}

