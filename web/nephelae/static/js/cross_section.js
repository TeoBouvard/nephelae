// Activate current menu in nav
document.getElementById('nav_cross_section').className = 'active';

var time_slider = document.getElementById('time_slider');
var altitude_slider = document.getElementById('altitude_slider');
var time_display = document.getElementById('time_display');
var altitude_display = document.getElementById('altitude_display');


$(document).ready(function(){
    // Display first image
    displayImage(altitude_slider.value, time_slider.value);
});

// Update the current slider value and display image accordingly
time_slider.oninput = function() {
    time_display.innerHTML = '...';
}
time_slider.onchange = function() {
    displayImage(this.value, altitude_slider.value);
}

// Update the current slider value and display image accordingly
altitude_slider.oninput = function() {
    altitude_display.innerHTML = '...';
}
altitude_slider.onchange = function() {
    displayImage(time_slider.value,this.value);
}

function displayImage(time_percentage, altitude_percentage){
    
    // Request the frame corresponding to selected time and altitude
    var url = time_percentage + '/' + altitude_percentage;

    $.getJSON(url, function(response){
        $('#clouds_div').html('<img src="' + response.clouds + '">');
        $('#thermals_div').html('<img src="' + response.thermals + '">');
        $('#time_display').html(response.date + "s")
        $('#altitude_display').html(response.altitude + "m ASL")
    });

}