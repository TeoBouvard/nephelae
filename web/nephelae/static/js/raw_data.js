// Activate current menu in nav
document.getElementById('nav_raw_data').className = 'active';

// Chart style and options
var chart_height = 250;
var lm = 70;
var rm = 20;
var bm = 20;
var tm = 10;

var layouts = {
    RCT: {
        //xaxis:{title: 'Time', rangemode: 'nonegative'},
        yaxis:{title: 'Liquid Water Content (kg/kg)', rangemode: 'nonegative'},
        height: chart_height,
        margin: { l: lm, r: rm, b: bm, t: tm },
        hovermode: 'closest',
        showlegend: false,
    },
    WT: {
        //xaxis:{title: 'Time', rangemode: 'nonegative'},
        yaxis:{title: 'Vertical wind (m/s)'},
        height: chart_height,
        margin: { l: lm, r: rm, b: bm, t: tm },
        hovermode: 'closest',
        showlegend: false,
    },
};

var config = {
    responsive: true,
    displaylogo: false,
    displayModeBar: false,
};

// Parameters
var parameters = {
    refresh_rate: 1000,   // ms
    trail_length: 60,     // seconds
    auto_update: true,
    update: updateData,
    last_request: 0,
    timeout: null,
}

$(document).ready(function(){
    setupGUI();
});

function setupGUI(){

    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    var f1 = gui.addFolder('Controls');

    f1.add(parameters, 'trail_length', 10, 2000).step(1).name("Log length (s)");
    f1.add(parameters, 'refresh_rate', 500, 5000).step(100).name("Refresh rate (ms)");
    f1.add(parameters, 'auto_update').name("Streaming").onChange(toggleStreaming);
    f1.add(parameters, 'update').name('Update plot');

    var f2 = gui.addFolder('Trails');
    var f3 = gui.addFolder('Variables');

    $.getJSON('discover/', (response) => {

        parameters['uavs'] = {};
        parameters['variables'] = {};

        for (var uav_id of response.uavs){
            parameters['uavs'][uav_id] = true;
            f2.add(parameters['uavs'], uav_id).name('UAV ' + uav_id);
        }

        for (var tag of response.sample_tags){
            parameters['variables'][tag] = true;
            f3.add(parameters['variables'], tag).name(tag);
        }

        // Draw charts once GUI is initialized
        updateData();
    });
}

// to make sure updateData is not called multiple times at once because of redraws, check parameters.last_query timestamp
function updateData(){

    var data = {};
    var query = $.param({uav_id: getSelectedElements(parameters.uavs), trail_length: parameters.trail_length, variables:getSelectedElements(parameters.variables)});

    if (new Date() - parameters.last_request > parameters.refresh_rate){
        parameters.last_request = undefined;

        $.getJSON('update/?' + query, (response) => {
            
            // Parse server response
            for (var uav_id in response.data){

                for (var variable_name in response.data[uav_id]){

                    var positions = response.data[uav_id][variable_name]['positions'];
                    var timestamps = [];

                     // Compute coordinates from path
                    for(var i = 0; i < positions.length ; i++){
                        timestamps.push(positions[i][0]);
                    }

                    var new_data = {
                        type: 'scatter',
                        x: timestamps,
                        y: response.data[uav_id][variable_name]['values'],
                        mode: 'line',
                        line: {
                            width: 1,
                            shape: 'linear',
                            color: global_colors[uav_id%global_colors.length],
                        },
                        meta: [uav_id],
                        hovertemplate:
                            'timestamp : %{x:.1f}s <br>' +
                            'sensor value : %{y:.3f} <br>' +
                            '<extra>UAV %{meta[0]}</extra>',
                        hoverlabel: {
                            bgcolor: 'black',
                            bordercolor: 'black',
                            font: {family: 'Roboto', size: '15', color: 'white'},
                            align: 'left',
                        }
                    };

                    variable_name in data ? data[variable_name].push(new_data) : data[variable_name] = [new_data];

                }
            }

            // Update charts
            updateCharts(data);

            if (parameters.auto_update){
                parameters.timeout = setTimeout(updateData, parameters.refresh_rate);
            }
            removeLoader();
            parameters.last_request = new Date();
        });
    }
    // too early, try again in a short time
    else{
        setTimeout(updateData, 20);
    }
}

function updateCharts(data){
    Plotly.react('lwc_chart', data.RCT, layouts.RCT, config);
    Plotly.react('upwind_chart', data.WT, layouts.WT, config);
}

function toggleStreaming(){
    if (parameters.timeout != null){
        clearTimeout(parameters.timeout);
        parameters.timeout = null;
    } else {
        updateData();
    }
}