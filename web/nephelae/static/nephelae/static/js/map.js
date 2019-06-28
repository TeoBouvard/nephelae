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
var refresh_rate = 1000; //milliseconds


$(document).ready(function(){
    // Initialize document elements
    initializeMap();
    initializeChart();

    // Update elements every 'refresh_rate' ms
    displayDrones();
});

// TO CHANGE WITH GET REQUEST
function logValue(value) {
    console.log(value);
}

function initializeMap(){
    // Map
    flight_map = L.map('map_container', {zoomControl: false});

    // Home button
    zoomHome = L.Control.zoomHome();

    // Sliders
    var options = {
        orientation: 'vertical',
        position: 'bottomright',
        logo: 'A',
        min: 0,
        max: 2000,
        value: 0,
        collapsed: true,
        increment: true,
        width: '300px'

    }
    var altitude_slider = L.control.slider(logValue, options).addTo(flight_map);

    // Layers
    //tiles_overlay = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {maxZoom: 18});
    tiles_overlay = L.tileLayer('tile/{z}/{x}/{y}');
    path_overlay = L.layerGroup();
    markers_overlay = L.layerGroup();
    //cloud_overlay = L.tileLayer('clouds/{z}/{x}/{y}');

    var base_layers = {
    };

    var overlays = {
        "Map": tiles_overlay,
        "Trails": path_overlay,
        "Markers": markers_overlay,
        //"Clouds": cloud_overlay,
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
            var past_longitudes = []; // MOVE THIS ON SERVER

            for(position in drone_path){
                past_longitudes.push(drone_path[position][1]);
            }
            
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
                x: [past_longitudes],
                y: [past_altitudes],
                name: drone_id,
                mode: 'lines',
                line: {
                        color: drone_color,
                        dash: 'dashdot',
                      }
            };
            Plotly.addTraces('chart', update);
        }

        //Update chart, keep track of last time label added
        console.debug('drones', addedDrones, 'added to overlays');

        // Center map on drone last drone added
        if(addedDrones.length != 0){
            flight_map.setView(drone_position, 15);
            zoomHome.addTo(flight_map);
            setInterval(updateDrones, refresh_rate);
        } else {
            alert("No drones detected, try launching the simulation and refresh the page");
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
            var past_longitudes = [];

            for(position in drone_path){
                //console.log(drone_path[position][1]);
                past_longitudes.push(drone_path[position][1]);
            }
            
            // Identify corresponding drone ...
            var drone_to_update = drones[drone_id];
            var trace = document.getElementById('chart').data.find(x => x.name == drone_id);
            var trace_index = document.getElementById('chart').data.indexOf(trace);

            // ... and update it
            if(drone_to_update){

                // Update markers
                drone_to_update.position.setLatLng(drone_position).setRotationAngle(drone_heading);
                drone_to_update.position.setPopupContent(infosToString(drone_id, drone_altitude, drone_heading));

                // Update polyline
                drone_to_update.path.setLatLngs(drone_path);

                // Update chart
                var update = {
                    x: [past_longitudes],
                    y: [past_altitudes],
                    //name: drone_id,
                };
                
                Plotly.restyle('chart', update, [trace_index]);

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

function initializeChart(){

    var data = [];
    var layout = {
        title: '',
        xaxis: {
            title: 'Longitude',
            //range : [0,1]
        },
        yaxis: {
            title: 'Altitude (m ASL)?',
            min: 0,
        }

    };
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