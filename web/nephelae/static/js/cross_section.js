// Activate current menu in nav
document.getElementById('nav_cross_section').classList.add('active');

var time_slider = document.getElementById('time_slider');
var altitude_slider = document.getElementById('altitude_slider');
var time_display = document.getElementById('time_display');
var altitude_display = document.getElementById('altitude_display');
var x_slider = document.getElementById('x_slider');
var x_display = document.getElementById('x_display');
var y_slider = document.getElementById('y_slider');
var y_display = document.getElementById('y_display');

$(document).ready(function(){
    // set sliders min and max values to prevent value errors, display first image on ajax call return
    init();

});

function init(){
     $.getJSON('box/', function(response){

        console.log(response);

        time_slider.min = Math.ceil(response[0].min);
        time_slider.max = Math.floor(response[0].max);
        time_slider.value = Math.ceil(response[0].min);

        altitude_slider.min = Math.ceil(response[1].min);
        altitude_slider.max = Math.floor(response[1].max);
        altitude_slider.value = 1075;

        min_x = Math.ceil(response[2].min);
        max_x = Math.floor(response[2].max);

        min_y = min_x;
        max_y = max_x;

        noUiSlider.create(x_slider, {
            range: {
                'min': min_x,
                'max': max_x
            },
            behaviour: 'drag',
            step: 1,
            start: [min_x, max_x],
            connect: true,
            orientation: 'horizontal', // 'horizontal' or 'vertical'
            tooltips: false,
            format: wNumb({
                decimals: 0
            }),
        });

        noUiSlider.create(y_slider, {
            range: {
                'min': min_y,
                'max': max_y
            },
            step: 1,
            behaviour: 'drag',
            start: [min_y, max_y],
            connect: true,
            orientation: 'horizontal', // 'horizontal' or 'vertical'
            tooltips: false,
            format: wNumb({
                decimals: 0
            }),
        });

        x_slider.noUiSlider.on('update', updateInfo);
        y_slider.noUiSlider.on('update', updateInfo);
        altitude_slider.oninput = updateInfo;
        time_slider.oninput = updateInfo;

        x_slider.noUiSlider.on('change', function(){
            displayImage(time_slider.value, altitude_slider.value, x_slider.noUiSlider.get(), y_slider.noUiSlider.get());
        })

        y_slider.noUiSlider.on('change', function(){
            displayImage(time_slider.value, altitude_slider.value, x_slider.noUiSlider.get(), y_slider.noUiSlider.get());
        })

        time_slider.onchange = function() {
            displayImage(this.value, altitude_slider.value, x_slider.noUiSlider.get(), y_slider.noUiSlider.get());
        }

        altitude_slider.onchange = function() {
            displayImage(time_slider.value,this.value, x_slider.noUiSlider.get(), y_slider.noUiSlider.get());
        }

        // Display first image
        updateInfo();
        displayImage(time_slider.value, altitude_slider.value, x_slider.noUiSlider.get(), y_slider.noUiSlider.get());
    });

}

function displayImage(time_value, altitude_value, x_interval, y_interval){
    
    // Request the frame corresponding to selected time and altitude
    var url = time_value + '/' 
            + altitude_value + '/' 
            + Math.round(x_interval[0]) + ',' 
            + Math.round(x_interval[1]) + '/' 
            + Math.round(y_interval[0]) + ',' 
            + Math.round(y_interval[1]);

    $.getJSON(url, function(response){
        $('#clouds_div').html('<img src="' + response.clouds + '">');
        $('#thermals_div').html('<img src="' + response.thermals + '">');
    });

}

function updateInfo(){
    altitude_display.innerHTML = altitude_slider.value + "m ASL";
    time_display.innerHTML = time_slider.value + "s";

    x_display.innerHTML = Math.round(x_slider.noUiSlider.get()[0]) + "m  -  " + Math.round(x_slider.noUiSlider.get()[1]) + "m";
    y_display.innerHTML = Math.round(y_slider.noUiSlider.get()[0]) + "m  -  " + Math.round(y_slider.noUiSlider.get()[1]) + "m";
}