// Activate current menu in nav
document.getElementById('nav_raw_data').className = 'active';

// Chart style and options
var chart_height = 300;
var lm = 60;
var rm = 30;
var bm = 60;
var tm = 50;

var layouts = {
    lwc: {
        xaxis:{title: 'Time', rangemode: 'nonegative'},
        yaxis:{title: 'Liquid Water Content (kg/kg)', rangemode: 'nonegative'},
        height: chart_height,
        margin: { l: lm, r: rm, b: bm, t: tm },
        hovermode: 'closest',
        showlegend: false,
    },
    upwind: {
        xaxis:{title: 'Time', rangemode: 'nonegative'},
        yaxis:{title: 'Upwind (m/s)'},
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
    trail_length: 60,    // seconds
    auto_update: true,
    update: updateData,
    variables: ['WT', 'RCT']
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
    f1.add(parameters, 'auto_update').name("Auto Update").onChange(updateData);
    f1.add(parameters, 'update').name('Update plot');

    var f2 = gui.addFolder('Trails');

    $.getJSON('discover/', (response) => {

        parameters['uavs'] = {};

        for (var key of response.uavs){
            parameters['uavs'][key] = true;
            f2.add(parameters['uavs'], key).name('Drone ' + key);
        }

        // Draw charts once GUI is initialized
        updateData();
    });
}

function updateData(){

    var data = {};
    var query = $.param({uav_id: getSelectedUAVs(), trail_length: parameters.trail_length, variables:parameters.variables});

    $.getJSON('update/?' + query, (response) => {
        
        // Parse server response
        for (var uav_id in response.data){

            for (var variable_name in response.data[uav_id]){

                var new_data = {
                    type: 'scatter',
                    x: response.data[uav_id][variable_name]['t'],
                    y: response.data[uav_id][variable_name]['values'],
                    name: "UAV " + uav_id,
                    mode: 'line',
                    line: {
                        width: 1,
                        shape: 'linear',
                        color: global_colors[uav_id%global_colors.length],
                    }
                };

                if (variable_name in data){
                    data[variable_name].push(new_data);
                } else {
                    data[variable_name] = [new_data];
                }
            }
        }

        // Update charts
        updateCharts(data);
        if (parameters.auto_update){
            //setTimeout(updateData, parameters.refresh_rate);
        }
        removeLoader();

    });
}

function updateCharts(data){
    Plotly.react('lwc_chart', data.RCT, layouts.lwc, config);
    Plotly.react('upwind_chart', data.WT, layouts.upwind, config);
}


function getSelectedUAVs() {

    var selectedUAVs = [];

    for(key in parameters.uavs){
        if (parameters.uavs[key] == true) selectedUAVs.push(key);
    }

    return selectedUAVs;
}