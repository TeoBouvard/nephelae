// Activate current menu in nav
document.getElementById('nav_raw_data').className = 'active';

// Chart style and options
var chart_height = 280;
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
    },
    upwind: {
        xaxis:{title: 'Time', rangemode: 'nonegative'},
        yaxis:{title: 'Upwind (m/s)'},
        height: chart_height,
        margin: { l: lm, r: rm, b: bm, t: tm },
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

    var data = [];
    var query = $.param({uav_id: getSelectedUAVs(), trail_length: parameters.trail_length});
    console.log(query)

    $.getJSON('update/?' + query, function(response){

        for (var key in response){
            console.log(response[key])
            data[key] = response[key]
        }
        

        if(Object.keys(data).length == 0){
            alert("No data received from the server, try refreshing the page");
        } else {
            console.log(data)
            updateCharts(data);
        }

        removeLoader();

    });
}

function updateCharts(data){
    Plotly.react('lwc_chart', data, layouts.lwc, config);
    Plotly.react('upwind_chart', data, layouts.upwind, config);
}

function getSelectedUAVs() {

    var selectedUAVs = [];

    for(key in parameters){
        if (typeof parameters[key] == 'boolean' && parameters[key] == true) selectedUAVs.push(key);
    }

    return selectedUAVs;
}