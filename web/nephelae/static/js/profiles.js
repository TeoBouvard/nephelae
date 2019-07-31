// Activate current menu in nav
document.getElementById('nav_profiles').className = 'active';

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

$(document).ready( () => {
    updateData();
    removeLoader();
});

function updateData(){
    var data = {};

    $.getJSON('update/', function(response){
        data = response;
        console.log('data received');
    


        if(data.length == 0){
            //alert("No data received from the server, try refreshing the page");
        } else {
            updateCharts(data);
            setTimeout(updateData, refresh_rate);
        }
    });
}

function updateCharts(data){
    Plotly.react('temperature_chart', data.temperature, layouts.temperature, config);
    Plotly.react('humidity_chart', data.humidity, layouts.humidity, config);
}

