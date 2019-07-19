// Activate current menu in nav
document.getElementById('nav_raw_data').className = 'active';

// Chart style and options
var chart_height = 250;
var lm = 50;
var rm = 50;
var bm = 50;
var tm = 10;

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
    //displayModeBar: false,
};

// Parameters
var parameters = {
    refresh_rate: 1000,   // ms
    trail_length: 60,    // seconds
    auto_update: true,
    update: updateData,
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
    var f3 = gui.addFolder('Variables');

    $.getJSON('discover/', (response) => {
        console.log(response)

        parameters['uavs'] = {};
        parameters['variables'] = {};

        for (var uav_id of response.uavs){
            parameters['uavs'][uav_id] = true;
            f2.add(parameters['uavs'], uav_id).name('Drone ' + uav_id);
        }

        for (var tag of response.sample_tags){
            parameters['variables'][tag] = true;
            f3.add(parameters['variables'], tag).name(tag);
        }

        // Draw charts once GUI is initialized
        updateData();
    });
}

function updateData(){

    var data = {};
    var query = $.param({uav_id: getSelectedUAVs(), trail_length: parameters.trail_length, variables:getSelectedVariables()});

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

    for(uav_id in parameters.uavs){
        if (parameters.uavs[uav_id] == true) selectedUAVs.push(uav_id);
    }

    return selectedUAVs;
}

function getSelectedVariables() {

    var selectedVariables = [];

    for(tag in parameters.variables){
        if (parameters.variables[tag] == true) selectedVariables.push(tag);
    }

    return selectedVariables;
}