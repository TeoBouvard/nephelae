// Activate current menu in nav
document.getElementById('nav_cloud_data').className = 'active';

// Chart style and options

var chart_height = 300;
var lm = 60;
var rm = 30;
var bm = 60;
var tm = 50;

var layouts = {
    volume: {
        xaxis:{title: 'Time'},
        yaxis:{title: 'Cloud Volume (m³)'},
        height: chart_height,
        margin: { l: lm, r: rm, b: bm, t: tm },
    },
    height: {
        xaxis:{title: 'Time'},
        yaxis:{title: 'Cloud Height (m)'},
        height: chart_height,
        margin: { l: lm, r: rm, b: bm, t: tm },
    },
    radius: {
        xaxis:{title: 'Time'},
        yaxis:{title: 'Cloud Radius (m)'},
        height: chart_height,
        margin: { l: lm, r: rm, b: bm, t: tm },
    },
    zx: {
        xaxis:{title: 'Time'},
        yaxis:{title: 'Altitude (m)'},
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
    Plotly.react('volume_chart', data.volume, layouts.volume, config);
    Plotly.react('height_chart', data.height, layouts.height, config);
    Plotly.react('radius_chart', data.radius, layouts.radius, config);
    Plotly.react('zx_chart', data.zx, layouts.zx, config);
}

function initializeCharts(data){
    Plotly.newPlot('volume_chart', data.volume, layouts.volume, config);
    Plotly.newPlot('height_chart', data.height, layouts.height, config);
    Plotly.newPlot('radius_chart', data.radius, layouts.radius, config);
    Plotly.newPlot('zx_chart', data.zx, layouts.zx, config);
}

