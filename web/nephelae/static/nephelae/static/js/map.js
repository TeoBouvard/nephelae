// Activate current menu in nav
document.getElementById('nav_map').className = 'active';

// Add CSS colors (corresponding to icons folder) for more drones
var colors = ["red", "blue", "green", "yellow", "orange"];
var icons = [];

var chart, flight_map;
var tiles_overlay, trails_overlay, markers_overlay;
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
    trails_overlay = L.layerGroup();
    markers_overlay = L.layerGroup();

    var base_layers = {     
    };

    var overlays = {
        "Map": tiles_overlay,
        "Trails": trails_overlay,
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
        for (var key in response.data){

            // Get color and icon of markers, increment index_icon for next drone 
            var drone_color = colors[index_icon%colors.length];
            var drone_icon = icons[index_icon++%colors.length];

            // Parse response data
            var drone_id = key;
            var drone_position = response.data[key].position;//.toFixed(4);
            var drone_altitude = response.data[key].altitude.toFixed(2);
            var drone_heading = response.data[key].heading;
            var time = response.data[key].time.toFixed(0);

            
            // Create leaflet marker and polyline at drone position
            var drone_marker = L.marker(drone_position, {icon: drone_icon});
            var drone_polyline = L.polyline([drone_position], {color : drone_color, weight : '2', dashArray : '5,7'});
            
            // Update drones dictionnary with discovered drone
            drones[drone_id] = ({
                color : drone_color, 
                position : drone_marker, 
                altitude : drone_altitude, 
                heading: drone_heading,
                past_positions:[drone_position],
                polyline : drone_polyline,
                last_position : L.latLng(drone_position),//{lat: drone_position[0], lng: drone_position[1]},
            });

            // Add drone marker to layer group
            drones[drone_id].position.setRotationAngle(drone_heading).addTo(markers_overlay);
            drones[drone_id].position.bindPopup(infosToString(drone_id, drone_altitude, drone_heading));
            drones[drone_id].polyline.addTo(trails_overlay);
            addedDrones.push(drone_id);

            // Update chart data with new dataset and line color corresponding to the icon
            chart.data.datasets.push({
                id: drone_id,
                label: "Drone " + drone_id,
                data: [drone_altitude],
                pointRadius: 1,
                borderColor: drone_color,
                fill: 'false',
            }); 
        }

        //Update chart, keep track of last time label added
        console.debug('drones', addedDrones, 'added to overlays');
        last_time_label = time;
        chart.data.labels.push(secToDate(time)); 
        chart.update(0);

        // Center map on drone last drone added
        flight_map.setView(drone_position, 15);
    });
}

function updateDrones(){
    var updatedDrones = [];

    // Request updated data from the server
    $.ajax({ url: 'update/', type: 'GET' }).done(function(response){

        // Parse response
        for (var key in response.data){
            var drone_id = key;
            var position = response.data[key].position;
            var altitude = response.data[key].altitude.toFixed(2);
            var heading = response.data[key].heading.toFixed(0);
            var time = response.data[key].time.toFixed(0);
            

            // Identify corresponding drone ...;
            var drone_to_update = drones[drone_id];
            var altitude_to_update = chart.data.datasets.find(x => x.id == drone_id);

            // ... and update it
            if(drone_to_update && altitude_to_update){

                // Update markers
                drone_to_update.position.setLatLng(position).setRotationAngle(heading);
                drone_to_update.position.setPopupContent(infosToString(drone_id, altitude, heading));

                // Add position to past_positions if it is far enough from last position and not on past positions path
                if(L.GeometryUtil.distance(flight_map,drone_to_update.last_position, position) > close_position){
                    drone_to_update.last_position = L.latLng(position);
                    drone_to_update.polyline.addLatLng(position);             
                }
                //L.polyline(future_positions,{color : 'grey', dashArray: '5,7'}).addTo(flight_map);

                // Add new label to the chart if last label is long ago
                if(time - last_time_label >= close_time){
                    last_time_label = time;
                    chart.data.labels.push(secToDate(time));
                } else {
                    chart.data.labels.push('');                    
                }

                // Add new altitude to the chart and remove old ones
                altitude_to_update.data.push(altitude);
                if(time - chart.data)


                // Log changes
                updatedDrones.push(drone_id);
            } 
            // ... or display error message if drone id does not match -> update drones dictionnary and start tracking it
            else {
                console.error("no drone with id ", drone_id, " found !");
                initializeDrones(); // NOT SURE IF THIS IS WORKING, CAN'T TEST ?
            }
        }
        chart.update(0);
        console.debug('positions of drones', updatedDrones, ' updated');
    });

}

function initializeChart(){
    var chart_canvas = 'altitude_chart'
    
    chart = new Chart(chart_canvas, {
        type: 'line',

        // Configuration options
        options: {
            responsive: true,
            maintainAspectRatio: false,
            events: [],
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false,
                    },
                }],
                yAxes: [{
                    ticks: {
                        //suggestedMin: 0,
                        //suggestedMax:500,
                    } 
                }],
            }
        }
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

function isPointOnLine(point, path) {
    for (var i = 0; i < path.length - 1; i++) {
        if (L.GeometryUtil.belongsSegment(point, path[i], path[i + 1], 0.1)) {
            return true;
        }
    }
    return false;
}