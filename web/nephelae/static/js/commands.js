// Activate current menu in nav
$('#nav_commands').addClass('active');

var fleet = {};
var parameters = {};

$(document).ready(function(){
	removeLoader();

	setupGUI();
    discoverFleet();
});

function setupGUI(){
    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

}

function discoverFleet(){

    $.getJSON('discover/', (response) => {

        parameters['origin'] = response.origin;

        for (uav_id of response.uavs) {
            fleet[uav_id] = {};

            generateItem(uav_id);
        }

    });


}

function displayFleet(){

    var query = $.param({uav_id: Object.keys(fleet), trail_length: 1});
    console.log(fleet)

    $.getJSON('update/?' + query, (response) => {

        for (var key in response.positions){

            // Parse response data
            var drone_id = key;
            var drone_path = response.positions[key].path;
            var drone_position = drone_path.slice(-1)[0];
            var drone_altitude = drone_path.slice(-1)[0][2];
            var drone_heading = response.positions[key].heading;
            var drone_speed = response.positions[key].speed;
            var drone_time = response.positions[key].time
            
            // Update fleet object
            fleet[drone_id] = {
                altitude : drone_altitude, 
                heading: drone_heading,
                time : drone_time,
                speed : drone_speed,
            };
        }
        
        // Center map on drone last drone added
        if(Object.keys(fleet).length != 0){
            setTimeout(displayFleet, 2000);
        } else {
            alert("No UAVs detected, try launching the simulation and restart the server");
            discoverFleet();
        }
    });
}

function generateItem(id){

    html = '<div id=' + id + ' class="row"> <div class="col s4"> <div class="card blue-grey darken-1"> <div class="card-content white-text">';
    html += '<span class="card-title"></span>'
    html += '</div> </div> </div> </div>';

    $('#infolist').append(html);
}