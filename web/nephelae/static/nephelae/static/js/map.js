// Activate current menu in nav
document.getElementById('nav_map').className = 'active';

var flight_map, zoom_home;
var tiles_overlay, path_overlay, markers_overlay, cloud_overlay;

/*
    drones     : { key           :   drone_id,   values : value_dict }
    value_dict : { color         :   global_colors[index_icon], 
                   position      :   marker, 
                   altitude      :   float, 
                   heading       :   float,
                   polyline      :   L.Polyline,
                   past_positions:   [positions] -> NOT USED NOW
                   last_position :   LatLng
                 }
*/
var drones = {};

// Parameters 
var refresh_rate = 3000; //milliseconds


$(document).ready(function(){
    // Initialize document elements
    initializeMap();

    // Update elements every 'refresh_rate' ms
    displayDrones();
});

// TO CHANGE WITH GET REQUEST
function logValue(value) {
    cloud_overlay.setUrl('clouds/{z}/{x}/{y}/'+value, noRedraw=false);
    console.log(value);
}

function initializeMap(){
    // Map
    flight_map = L.map('map_container', {zoomControl: false});

    // Home button
    zoomHome = L.Control.zoomHome();


    // Layers (add/remove .grayscale() if you want a colored map)
    //tiles_overlay = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {maxZoom: 18});
    tiles_overlay = L.tileLayer('tile/{z}/{x}/{y}');
    path_overlay = L.layerGroup();
    markers_overlay = L.layerGroup();
    cloud_overlay = L.tileLayer('clouds/{z}/{x}/{y}/{alt}', {alt : 0}).setOpacity(0.8);

    // Sliders
    var options = {
        orientation: 'vertical',
        position: 'bottomright',
        logo: 'A',
        min: 0,
        max: 159, // -> set dynamically with request
        value: 0,
        collapsed: true,
        increment: true,
        height: '300px'
    }

    var altitude_slider = L.control.slider(logValue, options).addTo(flight_map);

    var base_layers = {
    };

    var overlays = {
        "Map": tiles_overlay,
        "Trails": path_overlay,
        "Markers": markers_overlay,
        "Clouds": cloud_overlay,
    };

    // Add layers to the map and display everything
    L.control.layers(base_layers, overlays).addTo(flight_map);
    for(key in overlays) { overlays[key].addTo(flight_map); }
}

function displayDrones(){
    var addedDrones = [];
    var index_icon = 0;

    $.ajax({ url: 'update/', type: 'GET' }).done(function(response){

        // Initialize drone array with drone_id and position marker
        for (var key in response){

            // Get color and icon of markers, increment index_icon for next drone 
            var drone_color = global_colors[index_icon%global_colors.length];
            var drone_icon = global_icons[index_icon++%global_colors.length];

            // Parse response data
            var drone_id = key;
            var drone_position = response[key].position;
            var drone_altitude = response[key].altitude;
            var drone_heading = response[key].heading;
            var drone_path = response[key].path;
            var past_altitudes = response[key].past_altitudes;
            var log_times = response[key].log_times;
            var time = response[key].time;
            
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
            addedDrones.push(drone_id);
        }

        // Log added drones 
        console.debug('drones', addedDrones, 'added to overlays');

        // Center map on drone last drone added
        if(addedDrones.length != 0){
            flight_map.setView(drone_position, 14);
            zoomHome.addTo(flight_map);
            setInterval(updateDrones, refresh_rate);
        } else {
            alert("No drones detected, try launching the simulation and restart the server");
        }
    });
}

function updateDrones(){
    var updatedDrones = [];

    // Request updated data from the server
    $.ajax({ url: 'update/', type: 'GET' }).done(function(response){

        // Parse response
        for (var key in response){
            var drone_id = key;
            var drone_position = response[key].position;
            var drone_altitude = response[key].altitude;
            var drone_heading = response[key].heading;
            var drone_path = response[key].path;
            var past_altitudes = response[key].past_altitudes;
            var log_times = response[key].log_times;
            var time = response[key].time;

            // Identify corresponding drone ...
            var drone_to_update = drones[drone_id];

            // ... and update it
            if(drone_to_update){

                // Update markers
                drone_to_update.position.setLatLng(drone_position).setRotationAngle(drone_heading);
                drone_to_update.position.setPopupContent(infosToString(drone_id, drone_altitude, drone_heading));

                // Update polyline
                drone_to_update.path.setLatLngs(drone_path);

                // Log changes
                updatedDrones.push(drone_id);
            } 
            // ... or display error message if drone id does not match -> update drones dictionnary and start tracking it
            else {
                console.error("no drone with id ", drone_id, " found !");
                initializeDrones(); // NOT SURE IF THIS IS WORKING, CAN'T TEST ?
            }
        }
        // Update home button coordinates 
        zoomHome.setHomeCoordinates(drone_position);
        console.debug('positions of drones', updatedDrones, ' updated');
    });

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


/* USEFUL FOR HEATMAP */

function getVisibleTilesCoords(map){
      
    // get bounds, zoom and tileSize        
    var bounds = map.getPixelBounds();
    var zoom = map.getZoom();
    var tileSize = 256;
    var tileCoordsContainer = [];


    // get NorthWest and SouthEast points
    var nwTilePoint = new L.Point(Math.floor(bounds.min.x / tileSize),
        Math.floor(bounds.min.y / tileSize));

    var seTilePoint = new L.Point(Math.floor(bounds.max.x / tileSize),
        Math.floor(bounds.max.y / tileSize));

    // get max number of tiles in this zoom level
    var max = map.options.crs.scale(zoom) / tileSize; 

    // enumerate visible tiles 
    for (var x = nwTilePoint.x; x <= seTilePoint.x; x++) 
    {
        for (var y = nwTilePoint.y; y <= seTilePoint.y; y++) 
        {

        var xTile = Math.abs(x % max);
        var yTile = Math.abs(y % max);
        
        tileCoordsContainer.push({ 'x':xTile, 'y':yTile });

        console.log('tile ' + xTile + ' ' + yTile);
        }
    }
    
    return tileCoordsContainer;
};

function getTileURL(lat, lon, zoom) {
	    var xtile = parseInt(Math.floor( (lon + 180) / 360 * (1<<zoom) ));
	    var ytile = parseInt(Math.floor( (1 - Math.log(Math.tan(lat.toRad()) + 1 / Math.cos(lat.toRad())) / Math.PI) / 2 * (1<<zoom) ));
	    return "" + zoom + "/" + xtile + "/" + ytile;
}

/*flight_map.on('click', function (e) {
    url = getTileURL(e.latlng.lat, e.latlng.lng, map.getZoom())
    console.log(url);*/