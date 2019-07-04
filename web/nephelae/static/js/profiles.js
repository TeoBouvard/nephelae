// Activate current menu in nav
document.getElementById('nav_profiles').className = 'active';

var chart_height = 600;
var max_alt = 5;
var max_temp = 40;
var lm = 60;
var rm = 30;
var bm = 60;
var tm = 50;

// Chart style and options
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
    modeBarButtonsToRemove: ['toImage', 'pan2d', 'zoom2d'],
};

// Keep track of chart state
var isAlreadyDrawn = false;
var refresh_rate = 2000; // ms

$(document).ready(function(){
    updateData();
});

function updateData(){
    var data = {};

    $.getJSON('update/', function(response){
        data = response;
        console.log('data received');
    

        if(isAlreadyDrawn){
            updateCharts(data);
        } else {
            if(data.length == 0){
                //alert("No data received from the server, try refreshing the page");
            }
            initializeCharts(data);
            isAlreadyDrawn = true;
            setInterval(updateData, refresh_rate);
        }
    });
}

function updateCharts(data){
    Plotly.react('temperature_chart', data.temperature, layouts.temperature, config);
    Plotly.react('humidity_chart', data.humidity, layouts.humidity, config);
}

function initializeCharts(data){
    Plotly.newPlot('temperature_chart', data.temperature, layouts.temperature, config);
    Plotly.newPlot('humidity_chart', data.humidity, layouts.humidity, config)
}

