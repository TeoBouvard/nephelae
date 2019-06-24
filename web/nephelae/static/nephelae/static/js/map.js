// Activate current menu in nav
document.getElementById('nav_map').className = 'active';

var chart;
var icons = [];
var drones = [];
var flight_map;

$(document).ready(function(){
    initializeMap();
    initializeChart();
    initializeDrones();
    
    setTimeout(updateDrones, 2000);
    setTimeout(updateDrones, 2000);
    setTimeout(updateDrones, 2000);
    //updateDrones();
    //setInterval(updateDrones, 2000);
});


function initializeMap(){
    // Map
    flight_map = L.map('map').setView([43.6047, 1.4442], 13);

    // Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png',
        {
            maxZoom: 18,
        }
        ).addTo(flight_map);
    
    // Icon class
    var planeIcon = L.Icon.extend({
        options: { 
            iconSize:     [20, 20], // size of the icon
            iconAnchor:   [10, 10], // marker's location
            popupAnchor:  [0, 0]    // relative to the iconAnchor
        }
    });

    // Create an icon for each image in the icon folder
    for(var i = 0; i < 8; i++){
        var random_icon = new planeIcon({iconUrl: '/img/plane_icon/' + i})
        icons.push(random_icon);
    }
}

function initializeDrones(){
    var addedDrones = [];
    var colors = ["red", "blue", "green"]; // Add colors for more drones

    $.ajax({ url: 'drones/', type: 'GET' }).done(function(response){

        // Initialize drone array with drone_id and position marker
        for (var i = 0; i < response.drones.length; i++){
            let drone_id = response.drones[i].drone_id;
            let position = response.drones[i].position;
            let altitude = response.drones[i].altitude;

            var marker = L.marker(position, {icon: icons[i]});

            drones.push({id : drone_id, position : marker, altitude : altitude});
            drones[i].position.addTo(flight_map).bindPopup('Drone ' + drone_id);
            addedDrones.push(drone_id);

            chart.data.datasets.push({
                id: i,
                label: "Drone " + i,
                borderColor: colors[i],
                fill: 'false',
                data: [altitude],
            });
        }
        console.debug('drones', addedDrones, 'added to the map');
        chart.update();
    });
}

function updateDrones(){
    var updatedDrones = [];

    // Request updated data from the server
    $.ajax({ url: 'update/', type: 'GET' }).done(function(response){

        // Parse response
        for (var i = 0; i < response.positions.length; i++){
            var drone_id = response.positions[i].drone_id;
            var position = response.positions[i].position;
            var altitude = response.positions[i].altitude;
            var past_positions = response.positions[i].past_positions;
            var future_positions = response.positions[i].future_positions;

            // Identify corresponding drone ...
            var drone_to_update = drones.find(x => x.id == drone_id);
            var altitude_to_update = chart.data.datasets.find(x => x.id == drone_id);

            // ... and update it
            if(drone_to_update && altitude_to_update){

                // Update markers
                drone_to_update.position.setLatLng(position);
                drone_to_update.position.setRotationAngle(0); // compute heading in the future

                // Add trails and intentions to the map
                L.polyline(past_positions, {color : 'grey'}).addTo(flight_map);
                L.polyline(future_positions,{color : 'grey', dashArray: '5,7'}).addTo(flight_map);

                // Add new altitude to the chart
                altitude_to_update.data.push(altitude)

                // Log changes
                updatedDrones.push(drone_id);
            } 
            // ... or display error message if drone id does not match
            else {
                console.error("no drone with id ", drone_id, " found !")
            }
        }
        chart.update();
        console.debug('positions of drones', updatedDrones, ' updated');
    });

}

function initializeChart(){
    var chart_canvas = 'altitude_chart'
    
    chart = new Chart(chart_canvas, {
        type: 'line',

        scales: {
            xAxes: [{
                type: 'time',
                time: {
                    displayFormats: {
                        second: 'h:mm:ss',
                        distribution: 'series',
                    }
                }
            }]
        },

        // Configuration options
        options: {
            responsive: true,
            maintainAspectRatio: false,
        },
    });
}