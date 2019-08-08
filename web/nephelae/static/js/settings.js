$(document).ready(() => {
    removeLoader();
    displayCookies();
    addListeners();
});

function displayCookies() {
    $('#slider_refresh_rate').val(Cookies.get('refresh_rate'));
    $('#display_refresh_rate').text(Cookies.get('refresh_rate'));
}

function addListeners() {
    $('#slider_refresh_rate').on('change', () => { 
        Cookies.set('refresh_rate', $('#slider_refresh_rate').val());
        $('#display_refresh_rate').html($('#slider_refresh_rate').val());
    });
}