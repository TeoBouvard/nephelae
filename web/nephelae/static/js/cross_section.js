// Activate current menu in nav
document.getElementById('nav_cross_section').className = 'active';

var time_slider = document.getElementById('time_slider');
var altitude_slider = document.getElementById('altitude_slider');
var time_display = document.getElementById('time_display');
var altitude_display = document.getElementById('altitude_display');


$(document).ready(function(){
    // set sliders min and max values to prevent value errors, display first image on ajax call return
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

        // Display first image
        updateInfo();
        displayImage(time_slider.value, altitude_slider.value);
    });

}

function displayImage(time_value, altitude_value){
    
    // Request the frame corresponding to selected time and altitude
    var url = time_value + '/' + altitude_value;

    $.getJSON(url, function(response){
        $('#clouds_div').html('<img src="' + response.clouds + '">');
        $('#thermals_div').html('<img src="' + response.thermals + '">');
    });

}

// Update the current slider value and display image accordingly
time_slider.oninput = function() {
    updateInfo();
}
time_slider.onchange = function() {
    displayImage(this.value, altitude_slider.value);
}

// Update the current slider value and display image accordingly
altitude_slider.oninput = function() {
    updateInfo();
}
altitude_slider.onchange = function() {
    displayImage(time_slider.value,this.value);
}


function updateInfo(){
    altitude_display.innerHTML = altitude_slider.value + "m ASL";
    time_display.innerHTML = time_slider.value + "s";
}