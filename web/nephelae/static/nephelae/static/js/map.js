// Activate current menu in nav
document.getElementById('nav_map').className = 'active';

var chart;
var icons = [];
var drones = {};
var flight_map;

$(document).ready(function(){
    initializeMap();
    initializeChart();
    initializeDrones();
    
    //setTimeout(updateDrones, 2000);
    //setTimeout(updateDrones, 2000);
    //setTimeout(updateDrones, 2000);
    //updateDrones();
    setInterval(updateDrones, 1000);
});


function initializeMap(){
    // Map
    flight_map = L.map('map');

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
            iconAnchor:   [10, 10], // marker's location.setView([43.6047, 1.4442], 13);

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
    var index_icon = 0;
    var colors = ["red", "blue", "green"]; // Add colors for more drones

    $.ajax({ url: 'update/', type: 'GET' }).done(function(response){

        // Initialize drone array with drone_id and position marker
        console.debug(response);
        for (var key in response.data){
            var drone_id = key;
            var position = response.data[key].position;
            var altitude = response.data[key].altitude;
            var heading = response.data[key].heading;


            var marker = L.marker(position, {icon: icons[index_icon]});

            drones[drone_id] = ({position : marker, altitude : altitude, heading: heading});
            drones[drone_id].position.addTo(flight_map).setRotationAngle(heading).bindPopup('Drone ' + drone_id);
            addedDrones.push(drone_id);

            chart.data.datasets.push({
                id: drone_id,
                label: "Drone " + drone_id,
                pointRadius: 1,
                pointHoverRadius: 1,
                borderColor: colors[index_icon++],
                fill: 'false',
                data: [altitude],
                
            });
        }
        console.debug('drones', addedDrones, 'added to the map');
        chart.update();

        // Center map on drone last drone added
        flight_map.setView(position, 16);
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
            var past_positions = response.data[key].past_positions;
            var altitude = response.data[key].altitude;
            var heading = response.data[key].heading;
            var time = response.data[key].time;

            //console.log(past_positions);

            // Identify corresponding drone ...
            var drone_to_update = drones[drone_id];
            var altitude_to_update = chart.data.datasets.find(x => x.id == drone_id);

            // ... and update it
            if(drone_to_update && altitude_to_update){

                // Update markers
                drone_to_update.position.setLatLng(position);
                drone_to_update.position.setRotationAngle(heading); // compute heading in the future

                // Add trails and intentions to the map
                //L.polyline(past_positions, {color : 'grey'}).addTo(flight_map);
                //L.polyline(future_positions,{color : 'grey', dashArray: '5,7'}).addTo(flight_map);

                // Add new altitude to the chart
                // console.debug(time + ":" + altitude + "m");     
                chart.data.labels.push(time);
                altitude_to_update.data.push(altitude);

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