var time_slider = document.getElementById('time_slider');
var time = document.getElementById('time');
time.innerHTML = time_slider.value;

// Update the current slider value
time_slider.oninput = function() {
    time.innerHTML = this.value;
}