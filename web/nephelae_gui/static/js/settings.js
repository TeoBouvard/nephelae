$(document).ready(() => {
    removeLoader();
    displayCookies();
    addListeners();
});

function displayCookies() {
    setupDisplay('refresh_rate');
    setupDisplay('trail_length');
    setupDisplay('buffer_size');
}

function addListeners() {
    $('#reset_cookies').click(resetCookies);
    $('#slider_refresh_rate').on('change', () => updateDisplay('refresh_rate'));
    $('#slider_trail_length').on('change', () => updateDisplay('trail_length'));
    $('#slider_buffer_size').on('change', () => updateDisplay('buffer_size'));
}

function setupDisplay(div_name){
    $('#slider_' + div_name).val(Cookies.get(div_name));
    $('#display_' + div_name).text(Cookies.get(div_name));
}

function updateDisplay(div_name){
    Cookies.set(div_name, $('#slider_' + div_name).val());
    $('#display_' + div_name).html($('#slider_' + div_name).val());
}

function resetCookies(){
    Cookies.remove('visits');
    window.location.reload();
}
