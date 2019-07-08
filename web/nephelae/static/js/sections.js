// Activate current menu in nav
document.getElementById('nav_sections').classList.add('active');

var time_slider = document.getElementById('time_slider');
var altitude_slider = document.getElementById('altitude_slider');
var time_display = document.getElementById('time_display');
var altitude_display = document.getElementById('altitude_display');

// Chart style and options
var lm = 30;
var rm = 30;
var bm = 30;
var tm = 30;
var chart_width = 600;
var chart_height = 500;

var layout = {
    margin: { l: lm, r: rm, b: bm, t: tm },
    width: chart_width,
    height: chart_height,
    uirevision: true,
};

var config = {
    responsive : true,
    displaylogo: false,
    displayModeBar: false,
};

// Keep track of chart state
var isAlreadyDrawn = false;


$(document).ready(function(){
    // set sliders range and display initial values
    initializeSliders();
});


function initializeSliders(){
    $.getJSON('box/', function(response){

        time_slider.min = Math.ceil(response[0].min);
        time_slider.max = Math.floor(response[0].max);
        time_slider.value = Math.ceil(response[0].min);

        altitude_slider.min = Math.ceil(response[1].min);
        altitude_slider.max = Math.floor(response[1].max);
        altitude_slider.value = 1075;

        var min_x = Math.ceil(response[2].min);
        var max_x = Math.floor(response[2].max);

        var min_y = min_x;
        var max_y = max_x;

        altitude_slider.oninput = updateInfo;
        time_slider.oninput = updateInfo;

        time_slider.onchange = updateData;
        altitude_slider.onchange = updateData;

        $("#select").on('change', updateData);

        updateInfo();
        updateData();
    });
}

function updateData(){
    var data = {};
    var selected_layer = $('select').formSelect().val();


    $.getJSON('update/' + time_slider.value + '/' + altitude_slider.value, function(response){

        switch (selected_layer) {
            case "clouds":
                data = [{
                    z: response.clouds,
                    colorscale: 'Reds',
                    type: 'heatmap'     
                }];

                layout.title = 'Liquid Water Content in kg/kg';
                break;
            
            case "thermals":
                data = [{
                    z: response.thermals,
                    colorscale : 'RdBu',
                    type: 'heatmap'    
                }];

                layout.title = 'Vertical air speed in m/s';
                break;
        }

        if(isAlreadyDrawn){
            updateInfo();
            updateCharts(data);
        } else {
            if(data.length == 0){
                alert("No data received from the server");
            }
            initializeCharts(data);
            isAlreadyDrawn = true;
            removeLoader();
        }
    });
}

function updateInfo(){
    altitude_display.innerHTML = altitude_slider.value + "m ASL";
    time_display.innerHTML = time_slider.value + "s";
}

function initializeCharts(data, select){
    Plotly.newPlot('chart', data, layout, config);
}

function updateCharts(data){
    Plotly.react('chart', data, layout, config);
}