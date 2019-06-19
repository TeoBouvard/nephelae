var time_slider = document.getElementById('time_slider');
var time_display = document.getElementById('time_display');


// Display first image on document ready
$(document).ready(function() {
    time_display.innerHTML = time_slider.value;
    displayImage(time_slider.value);
});

// Update the current slider value and display image accordingly
time_slider.oninput = function() {
    time_display.innerHTML = this.value;
    displayImage(this.value);
}

function displayImage(time_percentage){
    // Request the frame corresponding to selected time
    $.ajax({
        url: '',
        type: 'POST',
        dataType: 'json',
        data: {
            time_percentage: time_percentage,
        },
        success: function(response) {
            console.log(response);
            $('#plot').html('<img src="' + response.image + '">');
            $('#time_display').html(toDateTime(response.date))
        }
    });
}

function toDateTime(secs) {
    var t = new Date(1995, 0, 1); // Epoch
    t.setSeconds(secs);
    console.log(t);
    return t;
}