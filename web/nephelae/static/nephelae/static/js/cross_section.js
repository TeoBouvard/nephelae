var time_slider = document.getElementById('time_slider');
var time = document.getElementById('time_display');
time.innerHTML = time_slider.value;

// Update the current slider value
time_slider.oninput = function() {
    time.innerHTML = this.value

    // Request the frame corresponding to selected time
    $.ajax({
        url: '',
        type: 'POST',
        dataType: 'json',
        data: {
            time_percentage: this.value,
        },

        success: function(response) {
            console.log(response);
        }
    });
}