// Activate current menu in nav
$("#nav_map").addClass('active');

var flight_map, zoom_home;
var tiles_overlay, path_overlay, markers_overlay, cloud_overlay;

// Data from MESO_NH, will come from mapping later
var max_time;
function tick(){ return Math.floor(new Date() / 1000) % max_time}
/*
    fleet     : { key           :   drone_id,   values : value_dict }
    value_dict : { color         :   global_colors[index_icon], 
                   position      :   marker, 
                   altitude      :   float, 
                   heading       :   float,
                   polyline      :   L.Polyline,
                   past_positions:   [positions]
                   last_position :   LatLng
                 }
*/
var fleet = {};

// Parameters
var parameters = {
    refresh_rate: 1000, // milliseconds
    altitude: 1075,     // meters
    trail_length: 60,    // seconds

    origin: [43.432883, 1.247409] // used to compute layer images
}

$(document).ready(function(){

    // Inititalize parameters with mesonh bounds
    setupGUI();
    
    removeLoader();

    // Update elements every 'refresh_rate' ms
    displayDrones();
});

function setupGUI(){

    // Construct dat.gui
    var gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    // Get sliders range
    $.getJSON('box/', (response) => {
        
        // Parse response
        var min_altitude = Math.ceil(response[1].min);
        var max_altitude = Math.floor(response[1].max);

        max_time = response[0].max;

        gui.add(parameters, 'refresh_rate', 200, 3000).step(100).name('Delay (ms)');
        gui.add(parameters, 'altitude', min_altitude, max_altitude).step(1).name('Altitude (m)');
        gui.add(parameters, 'trail_length', 0, 500).step(1).name('Trail length (s)');

        // Once sliders are initialized, create map and display infos
        setupMap();
    });
}


function setupMap(){

    // Map
    flight_map = L.map('map_container', {zoomControl: false, center: parameters.origin, zoom: 15, maxZoom: 15, minZoom: 12});
    flight_map.on('moveend', updateLayerBounds);

    // Home button
    zoomHome = L.Control.zoomHome();

    // Create layers (add/remove .grayscale() if you want a grey/colored map)
    //tiles_overlay = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {maxZoom: 18});
    tiles_overlay = L.tileLayer.grayscale('tile/{z}/{x}/{y}', {maxZoom : 15});
    path_overlay = L.layerGroup();
    markers_overlay = L.layerGroup();
    cloud_overlay = L.imageOverlay('clouds_img/?' + computeURL(), flight_map.getBounds());
    thermals_overlay = L.imageOverlay('thermals_img/?' + computeURL(), flight_map.getBounds());

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
    L.control.layers(base_layers, overlays, {position: 'bottomleft'}).addTo(flight_map);

    // Display everything on initialization
    for(key in overlays) overlays[key].addTo(flight_map);
}

function displayDrones(){

        $.getJSON('update/', (response) => {

        // Initialize drone array with drone_id and position marker
        for (var key in response.drones){

            // Parse response data
            var drone_id = key;
            var drone_position = response.drones[key].position;
            var drone_altitude = response.drones[key].altitude;
            var drone_heading = response.drones[key].heading;
            var drone_path = response.drones[key].path.slice(-parameters.trail_length-1);

            // Compute color and icon of markers, increment index_icon for next drone 
            var drone_color = global_colors[key%global_colors.length];
            var drone_icon = global_icons[key%global_colors.length];
            
            // Create leaflet marker and polyline at drone position
            var marker = L.marker(drone_position, {icon: drone_icon});
            var polyline = L.polyline([drone_path], {color : drone_color, weight : '2', dashArray : '5,7'});
            
            // Update fleet dictionnary with discovered drone
            fleet[drone_id] = ({
                color : drone_color, 
                position : marker, 
                altitude : drone_altitude, 
                heading: drone_heading,
                path : polyline,
            });

            // Add drone marker to layer group
            fleet[drone_id].position.setRotationAngle(drone_heading).addTo(markers_overlay);
            fleet[drone_id].position.bindPopup(infosToString(drone_id, drone_altitude, drone_heading));
            fleet[drone_id].path.addTo(path_overlay);
        }
        
        // Center map on drone last drone added
        if(Object.keys(fleet).length != 0){
            flight_map.setView(drone_position, 15);
            zoomHome.addTo(flight_map);
            updateDrones();
        } else {
            alert("No drones detected, try launching the simulation and restart the server");
        }
    });
}

function updateDrones(){

    // Request updated data from the server
    $.getJSON('update/', (response) => {

        // Parse response
        for (var key in response.drones){
            var drone_id = key;
            var drone_position = response.drones[key].position;
            var drone_altitude = response.drones[key].altitude;
            var drone_heading = response.drones[key].heading;
            var drone_path = response.drones[key].path.slice(-parameters.trail_length-1);

            // Identify corresponding drone ...
            var drone_to_update = fleet[drone_id];

            // ... and update it
            if(drone_to_update){

                // Update markers
                drone_to_update.position.setLatLng(drone_position).setRotationAngle(drone_heading);
                drone_to_update.position.setPopupContent(infosToString(drone_id, drone_altitude, drone_heading));

                // Update polyline
                drone_to_update.path.setLatLngs(drone_path);
            } 
            // ... or display error message if drone id does not match -> update fleet dictionnary and start tracking it
            else {
                console.error("no drone with id ", drone_id, " found !");
                initializeDrones(); // NOT SURE IF THIS IS WORKING, CAN'T TEST ?
            }
        }
        // Update home button coordinates and layers URL
        zoomHome.setHomeCoordinates(drone_position); // compute center of mass/getBoundsZoom later ?
        updateURL();
        setTimeout(updateDrones, parameters.refresh_rate);
    });

}

function updateURL(){
    cloud_overlay.setUrl('clouds_img/?'+ computeURL());
    thermals_overlay.setUrl('thermals_img/?'+ computeURL());
}

function updateLayerBounds(){
    cloud_overlay.setBounds(flight_map.getBounds());
    thermals_overlay.setBounds(flight_map.getBounds());
}

function computeURL(){

    var bounds = flight_map.getBounds();

    var query = $.param({
        altitude: parameters.altitude,
        time: tick(),
        map_bounds: {
            west: bounds.getWest(), 
            east: bounds.getEast(),
            south: bounds.getSouth(),
            north: bounds.getNorth()
        },
        origin: parameters.origin,
    });

    return query;
}

// Print HTML formatted string so that it can be added to marker popup
function infosToString(id, altitude, heading){
    var infos = '<p style="text-align:center;font-family:Roboto-Light;font-size:15px">';

    infos += 'Drone ';
    infos += id + ' <br> ' ;
    infos += altitude + 'm <br> ';
    infos += heading + '° <br> ';
    infos += '</p>'

    return infos;
}