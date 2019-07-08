// Activate current menu in nav
document.getElementById('nav_map').className = 'active';

var flight_map, zoom_home;
var tiles_overlay, path_overlay, markers_overlay, cloud_overlay;

// Data from MESO_NH, will come from mapping later
var imageBounds = [[43.432883, 1.247409], [43.490199, 1.327060]];
var max_time;
function tick(){ return new Date().getSeconds() % max_time}
/*
    drones     : { key           :   drone_id,   values : value_dict }
    value_dict : { color         :   global_colors[index_icon], 
                   position      :   marker, 
                   altitude      :   float, 
                   heading       :   float,
                   polyline      :   L.Polyline,
                   past_positions:   [positions]
                   last_position :   LatLng
                 }
*/
var drones = {};

// Parameters 
var refresh_rate = 1000; //milliseconds

$(document).ready(function(){

    // Inititalize altitude slider and time with mesonh box
    initializeSliders();
    
    removeLoader();

    // Update elements every 'refresh_rate' ms
    displayDrones();
});

function initializeSliders(){
    $.getJSON('box/', function(response){

        altitude_slider.min = Math.ceil(response[1].min);
        altitude_slider.max = Math.floor(response[1].max);
        altitude_slider.value = 1075;

        max_time = response[0].max;

        // Once sliders are initialized, create map and display infos
        initializeMap();
        updateInfo();
    });
}


function initializeMap(){

    // Map
    flight_map = L.map('map_container', {zoomControl: false, maxZoom : 15});

    // Home button
    zoomHome = L.Control.zoomHome();

    // Create layers (add/remove .grayscale() if you want a grey/colored map)
    //tiles_overlay = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {maxZoom: 18});
    tiles_overlay = L.tileLayer('tile/{z}/{x}/{y}', {maxZoom : 15});
    path_overlay = L.layerGroup();
    markers_overlay = L.layerGroup();
    cloud_overlay = L.imageOverlay('clouds_img/' + tick() + '/' + altitude_slider.value, imageBounds);
    thermals_overlay = L.imageOverlay('thermals_img/' + tick() + '/' + altitude_slider.value, imageBounds);

    // Set layer dictionnary
    var base_layers = {
    };

    var overlays = {
        "Map": tiles_overlay,
        "Trails": path_overlay,
        "Markers": markers_overlay,
        "Clouds": cloud_overlay,
        "Thermals": thermals_overlay,
    };

    // Add layers to the map
    L.control.layers(base_layers, overlays).addTo(flight_map);

    // Display everything on initialization
    for(key in overlays) { overlays[key].addTo(flight_map); }
}

function displayDrones(){

        $.getJSON('update/', function(response){

        // Initialize drone array with drone_id and position marker
        for (var key in response.drones){

            // Parse response data
            var drone_id = key;
            var drone_position = response.drones[key].position;
            var drone_altitude = response.drones[key].altitude;
            var drone_heading = response.drones[key].heading;
            var drone_path = response.drones[key].path.slice(-length_slider.value);

            // Compute color and icon of markers, increment index_icon for next drone 
            var drone_color = global_colors[key%global_colors.length];
            var drone_icon = global_icons[key%global_colors.length];
            
            // Create leaflet marker and polyline at drone position
            var marker = L.marker(drone_position, {icon: drone_icon});
            var polyline = L.polyline([drone_path], {color : drone_color, weight : '2', dashArray : '5,7'});
            
            // Update drones dictionnary with discovered drone
            drones[drone_id] = ({
                color : drone_color, 
                position : marker, 
                altitude : drone_altitude, 
                heading: drone_heading,
                path : polyline,
            });

            // Add drone marker to layer group
            drones[drone_id].position.setRotationAngle(drone_heading).addTo(markers_overlay);
            drones[drone_id].position.bindPopup(infosToString(drone_id, drone_altitude, drone_heading));
            drones[drone_id].path.addTo(path_overlay);
        }
        
        // Center map on drone last drone added
        if(Object.keys(drones).length != 0){
            flight_map.setView(drone_position, 15);
            zoomHome.addTo(flight_map);
            setInterval(updateDrones, refresh_rate);
        } else {
            alert("No drones detected, try launching the simulation and restart the server");
        }
    });
}

function updateDrones(){

    // Request updated data from the server
    $.getJSON('update/', function(response){

        // Parse response
        for (var key in response.drones){
            var drone_id = key;
            var drone_position = response.drones[key].position;
            var drone_altitude = response.drones[key].altitude;
            var drone_heading = response.drones[key].heading;
            var drone_path = response.drones[key].path.slice(-length_slider.value);

            // Identify corresponding drone ...
            var drone_to_update = drones[drone_id];

            // ... and update it
            if(drone_to_update){

                // Update markers
                drone_to_update.position.setLatLng(drone_position).setRotationAngle(drone_heading);
                drone_to_update.position.setPopupContent(infosToString(drone_id, drone_altitude, drone_heading));

                // Update polyline
                drone_to_update.path.setLatLngs(drone_path);
            } 
            // ... or display error message if drone id does not match -> update drones dictionnary and start tracking it
            else {
                console.error("no drone with id ", drone_id, " found !");
                initializeDrones(); // NOT SURE IF THIS IS WORKING, CAN'T TEST ?
            }
        }
        // Update home button coordinates and cloud overlay
        zoomHome.setHomeCoordinates(drone_position);
        updateURL();
    });

}

function updateInfo(){

    if(length_slider.value == 1){
        length_display.innerHTML = "no trail";
    } else if (length_slider.value == 2){
        length_display.innerHTML = "trail length : last second";
    } else {
        length_display.innerHTML = "trail length : " + (length_slider.value - 1) + " seconds";
    }

    altitude_display.innerHTML = "clouds altitude : " + altitude_slider.value + " m ASL";

}

function updateURL(){
    cloud_overlay.setUrl('clouds_img/'+ tick() +'/'+ Math.ceil(altitude_slider.value));
    thermals_overlay.setUrl('thermals_img/'+ tick() +'/'+ Math.ceil(altitude_slider.value));
}

// Print HTML formatted string so that it can be added to marker popup
function infosToString(id, altitude, heading){
    var infos = '<p style=text-align:center>';

    infos += 'Drone ';
    infos += id + ' <br> ' ;
    infos += altitude + 'm <br> ';
    infos += heading + '° <br> ';
    infos += '</p>'

    return infos;
}

// Update trail length, display 0 when slider is 1 to not slice(0)
length_slider.oninput = function() {
    trail_length = this.value;
    updateInfo();
}

// Update cross section altitude, display 0 when slider is 1 to not slice(0)
altitude_slider.oninput = function() {
    clouds_altitude = this.value;
    updateInfo();
}