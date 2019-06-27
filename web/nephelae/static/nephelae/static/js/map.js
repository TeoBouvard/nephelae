// Activate current menu in nav
document.getElementById('nav_map').className = 'active';

// Add CSS colors (corresponding to icons folder) for more drones
var colors = ["red", "blue", "green", "yellow", "orange"];
var icons = [];

var flight_map;
var tiles_overlay, path_overlay, markers_overlay;
var last_time_label;

/*
    drones     : { key           :   drone_id,   values : value_dict }
    value_dict : { color         :   colors[index_icon], 
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
var refresh_rate = 1000; //milliseconds
var close_position = 10; //meters
var close_time = 30; //seconds


$(document).ready(function(){
    // Initialize document elements
    initializeMap();
    initializeChart();
    initializeDrones();

    //updateDrones();
    // Update elements every 'refresh_rate' ms
    setInterval(updateDrones, refresh_rate);
    //setInterval(logMap, 2000);
});

// TO DELETE
function logMap(){
    console.log(flight_map);
}

function initializeMap(){

    // Icon class
    var planeIcon = L.Icon.extend({
        options: { 
            iconSize:     [20, 20], // size of the icon
            iconAnchor:   [10, 10], // marker's location.setView([43.6047, 1.4442], 13);
            popupAnchor:  [0, 0]    // relative to the iconAnchor
        }
    });

    // Create an icon for each image in the icon folder
    for(var i = 0; i < colors.length; i++){
        var random_icon = new planeIcon({iconUrl: '/map/plane_icon/' + i})
        icons.push(random_icon);
    }

    // Layers
    tiles_overlay = L.tileLayer('tile/{z}/{x}/{y}', {maxZoom: 18});
    path_overlay = L.layerGroup();
    markers_overlay = L.layerGroup();

    var base_layers = {     
    };

    var overlays = {
        "Map": tiles_overlay,
        "Trails": path_overlay,
        "Markers": markers_overlay,
    };

    // Map
    flight_map = L.map('map_container');

    // Add layers to the map and display everything
    L.control.layers(base_layers, overlays).addTo(flight_map);
    for(key in overlays) { overlays[key].addTo(flight_map); }
}

function initializeDrones(){
    var addedDrones = [];
    var index_icon = 0;

    $.ajax({ url: 'update/', type: 'GET' }).done(function(response){

        // Initialize drone array with drone_id and position marker
        for (var key in response){

            // Get color and icon of markers, increment index_icon for next drone 
            var drone_color = colors[index_icon%colors.length];
            var drone_icon = icons[index_icon++%colors.length];

            // Parse response data
            var drone_id = key;
            var drone_position = response[key].position;
            var drone_altitude = response[key].altitude;
            var drone_heading = response[key].heading;
            var drone_path = response[key].path;
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

            // Update chart data with new dataset and line color corresponding to the icon
            var update = {
                x: [time],
                y: [drone_altitude],
            };
            Plotly.addTraces('chart', update, [0]);
        }

        //Update chart, keep track of last time label added
        console.debug('drones', addedDrones, 'added to overlays');

        // Center map on drone last drone added
        flight_map.setView(drone_position, 15);
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
            var time = response[key].time; 
            console.log(drone_path);

            // Identify corresponding drone ...;
            var drone_to_update = drones[drone_id];
            //var altitude_to_update = chart.data.datasets.find(x => x.id == drone_id);

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
        console.debug('positions of drones', updatedDrones, ' updated');
    });

}

function initializeChart(){

    var data = [];
    var layout = {};
    var config = { responsive : true };

    Plotly.newPlot('chart', data, layout, config);
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

// Print formatted string from secs
function secToDate(secs){
    var t = new Date(1995, 0, 1); // Epoch of dataset
    t.setSeconds(secs);
    var formatted_date = apz(t.getHours()) + ":"
                   + apz(t.getMinutes()) + ":"
                   + apz(t.getSeconds());
    return formatted_date;
}

// Append leading zeros in date strings
function apz(n){
    if(n <= 9){
      return "0" + n;
    }
    return n
}

