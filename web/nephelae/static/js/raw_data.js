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
    responsive : true,
    displaylogo: false,
    displayModeBar: false,
};

// Parameters
var parameters = {
    trail_length: 60,    // seconds
    update: updateData,
}

$(document).ready(function(){
    setupGUI();
});

function setupGUI(){

    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    var f1 = gui.addFolder('Controls');

    f1.add(parameters, 'trail_length', 30, 3000).step(10).name("Log length (s)").onChange(updateData);
    f1.add(parameters, 'update').name('Update plot');

    var f2 = gui.addFolder('Trails');

    $.getJSON('discover/', (response) => {

        for (var key of response.uavs){
            parameters[key] = true;
            f2.add(parameters, key).name('Drone ' + key).onChange(updateData);
        }

        // Draw charts once GUI is initialized
        updateData();
    });
}

function updateData(){

    var data = {};
    var query = $.param({uav_id: getSelectedUAVs(), trail_length: parameters.trail_length});

    $.getJSON('update/?' + query, function(response){

        console.log(response)
        
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
                }

                data[variable_name].push(new_data);
            }
        }

        // Update charts
        if(Object.keys(data).length == 0){
            alert("No data received from the server, try refreshing the page");
        } else {
            updateCharts(data);
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

    for(key in parameters){
        if (typeof parameters[key] == 'boolean' && parameters[key] == true) selectedUAVs.push(key);
    }

    return selectedUAVs;
}