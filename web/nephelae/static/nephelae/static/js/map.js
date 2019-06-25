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

    setInterval(updateDrones, 2000);
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
            // Parse response data
            var drone_id = key;
            var position = response.data[key].position;
            var altitude = response.data[key].altitude.toFixed(2);
            var heading = response.data[key].heading;
            
            // Create leaflet marker at drone position
            var marker = L.marker(position, {icon: icons[index_icon]});

            // Update drones dictionnary with discovered drone
            drones[drone_id] = ({
                color : colors[index_icon], 
                position : marker, 
                altitude : altitude, 
                heading: heading, 
                past_positions:[position]
            });

            // Add drone marker to the map
            drones[drone_id].position.addTo(flight_map).setRotationAngle(heading);
            drones[drone_id].position.bindPopup(infosToString(drone_id, altitude, heading));
            addedDrones.push(drone_id);

            // Update chart data with new dataset and line color corresponding to the icon
            chart.data.datasets.push({
                id: drone_id,
                label: "Drone " + drone_id,
                data: [altitude],
                pointRadius: 1,
                pointHoverRadius: 1,
                borderColor: colors[index_icon++],
                fill: 'false',
            });
        }
        console.debug('drones', addedDrones, 'added to the map');
        chart.update(0);

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
            var altitude = response.data[key].altitude.toFixed(2);
            var heading = response.data[key].heading.toFixed(0);
            var time = response.data[key].time;

            //console.log(past_positions);

            // Identify corresponding drone ...
            var drone_to_update = drones[drone_id];
            var altitude_to_update = chart.data.datasets.find(x => x.id == drone_id);

            // ... and update it
            if(drone_to_update && altitude_to_update){

                // Update markers
                drone_to_update.position.setLatLng(position).setRotationAngle(heading);
                drone_to_update.position.setPopupContent(infosToString(drone_id, altitude, heading));

                // Update past positions
                drone_to_update.past_positions.push(position);

                // Add trails and intentions to the map
                L.polyline(
                    drone_to_update.past_positions, {
                    color : drone_to_update.color, 
                    weight : '2',
                    dashArray : '5,7',
                    }).addTo(flight_map);
                //L.polyline(future_positions,{color : 'grey', dashArray: '5,7'}).addTo(flight_map);

                // Add new altitude to the chart
                if (time%10 <= 1){
                    chart.data.labels.push(''); // -> display time once in a while ?
                } else {
                    chart.data.labels.push('');
                }
                altitude_to_update.data.push(altitude);

                // Log changes
                updatedDrones.push(drone_id);
            } 
            // ... or display error message if drone id does not match -> update drones dictionnary and start tracking it
            else {
                console.error("no drone with id ", drone_id, " found !");
                initializeDrones(); // NOT SURE IF THIS IS WORKING
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
                    }      
                }],
                yAxes: [{   
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
