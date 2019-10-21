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
}

$(document).ready(() => {
    setupGUI();
});

function setupGUI(){

    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    var f1 = gui.addFolder('Controls');
    f1.add(parameters, 'trail_length', 10, 2000).step(10).name("Log length (s)").onFinishChange(updateData);
    f1.add(parameters, 'streaming').name("Streaming").onChange((state) => toggleStreaming(state));

    var f2 = gui.addFolder('UAVs');

    $.getJSON('/discover/', (response) => {

        parameters['uavs'] = {};
        parameters['variables'] = {};

        for (var uav_id of response.uavs){
            parameters['uavs'][uav_id] = true;
            f2.add(parameters['uavs'], uav_id).name('UAV ' + uav_id).onChange(updateData);
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
    var query = $.param({trail_length: parameters.trail_length, uav_id: getSelectedElements(parameters.uavs), variables: getSelectedElements(parameters.variables)});
    $.getJSON('update/?'+query, function(response){
        for(var uav_id in response.data){
            for(var variable_name in response.data[uav_id]){
                var positions = response.data[uav_id][variable_name]['positions'];
                var altitudes = [];
                
                for(var i = 0; i < positions.length ; i++){
                    altitudes.push(positions[i][3]);
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
                        color: global_colors[uav_id%global_colors.length],
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
        }
        updateCharts(data);
	setTimeout(updateData, refresh_rate);
    	removeLoader();
    });
}

function updateCharts(data){
    Plotly.react('temperature_chart', data.THT, layouts.temperature, config);
    Plotly.react('humidity_chart', data.RCT, layouts.humidity, config);
}

