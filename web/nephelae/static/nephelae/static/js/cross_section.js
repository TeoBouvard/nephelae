var time_slider = document.getElementById('time_slider');
var altitude_slider = document.getElementById('altitude_slider');
var time_display = document.getElementById('time_display');
var altitude_display = document.getElementById('altitude_display');

// Display first image on window load
window.onload = displayImage(0,0);

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
    console.log(this.value)
}
altitude_slider.onchange = function() {
    displayImage(time_slider.value,this.value);
}

function displayImage(time_percentage, altitude_percentage){
    // Request the frame corresponding to selected time
    $.ajax({
        url: '',
        type: 'POST',
        dataType: 'json',
        data: {
            time_percentage: time_percentage,
            altitude_percentage: altitude_percentage,
        },
        success: function(response) {
            console.log(response);
            $('#clouds_div').html('<img src="' + response.clouds + '">');
            $('#thermals_div').html('<img src="' + response.thermals + '">');

            $('#time_display').html(toDateTime(response.date))
            $('#altitude_display').html(response.altitude + "m ASL")
        }
    });
}

// Translate seconds since epoch to formatted date
function toDateTime(secs) {
    var t = new Date(1995, 0, 1); // Epoch of dataset
    t.setSeconds(secs);
    formatted_date = apz(t.getDate()) + "/" 
                   + apz(t.getMonth()+1) + "/" 
                   + apz(t.getFullYear()) + " - "
                   + apz(t.getHours()) + ":"
                   + apz(t.getMinutes()) + ":"
                   + apz(t.getSeconds());
    return formatted_date;
}

// Append leading zeros in date strings
function apz(n){
    if(n <= 9){
      return "0" + n;
    }
    return n
}