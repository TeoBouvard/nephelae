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
    trail_length: 600,    // seconds
    auto_update: true,
    update: updateData,
    already_drawn: false,
}

$(document).ready(function(){
    setupGUI();
});

function setupGUI(){

    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    var f1 = gui.addFolder('Controls');

    f1.add(parameters, 'trail_length', 10, 2000).step(1).name("Log length (s)").listen();
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
    var query = $.param({uav_id: getSelectedUAVs(), trail_length: parameters.trail_length});
    console.log(query)

    $.getJSON('update/?' + query, (response) => {
        
        // Parse server response
        for (var variable_name in response){

            data[variable_name] = [];

            for (var uav_id in response[variable_name]){

                var new_data = {
                    type: 'scatter',
                    x: response[variable_name][uav_id]['x'],
                    y: response[variable_name][uav_id]['y'],
                    name: "UAV " + uav_id,
                    mode: 'lines',
                    line: {
                        width: 2,
                        shape: 'spline',
                        color: global_colors[uav_id%global_colors.length],
                    }
                };

                data[variable_name].push(new_data);
            }
        }

        // Update charts
        if (parameters.already_drawn){
            updateCharts(data);
        } else {
            createCharts(data);
        }
        if (parameters.auto_update){
            setTimeout(updateData, parameters.refresh_rate);
        }
        removeLoader();

    });
}

function updateCharts(data){
    //$('lwc_chart').empty();
    //$('upwind_chart').empty();
    Plotly.restyle('lwc_chart', data.RCT, layouts.lwc, config);
    Plotly.restyle('upwind_chart', data.WT, layouts.upwind, config);
}

function createCharts(data){
    //$('lwc_chart').empty();
    //$('upwind_chart').empty();
    Plotly.newPlot('lwc_chart', data.RCT, layouts.lwc, config);
    Plotly.newPlot('upwind_chart', data.WT, layouts.upwind, config);
}

function getSelectedUAVs() {

    var selectedUAVs = [];

    for(key in parameters.uavs){
        if (parameters.uavs[key] == true) selectedUAVs.push(key);
    }

    return selectedUAVs;
}