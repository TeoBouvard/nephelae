// Activate current menu in nav
document.getElementById('nav_commands').className = 'active';

var parameters = {
	text: 'hello'
}


$(document).ready(function(){
	setupGUI();
	removeLoader();
});

function setupGUI(){
    var gui = new dat.GUI();

    gui.add(parameters, 'hello');
    //gui.add(parameters, 'altitude', 0, 4000);
    //gui.add(parameters, 'trail_length', 0, 500);
}