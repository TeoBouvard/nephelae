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
    var colors = ["red", "blue", "green"];

    $.ajax({ url: 'drones/', type: 'GET' }).done(function(response){

        // Initialize drone array with drone_id and position marker
        for (var i = 0; i < response.drones.length; i++){
            let drone_id = response.drones[i].drone_id;
            let position = response.drones[i].position;
            let altitude = response.drones[i].altitude;

            var marker = L.marker(position, {icon: icons[i]});

            drones.push({id : drone_id, position : marker, altitude : altitude});
            drones[i].position.addTo(flight_map).bindPopup('Drone n°' + drone_id);
            addedDrones.push(drone_id);

            chart.data.datasets.push({
                label: "Drone " + (i+1),
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
    // Request new postitions of drones
    $.ajax({ url: 'update/', type: 'GET' }).done(function(response){

        // Update markers
        for (var i = 0; i < response.positions.length; i++){
            var drone_id = response.positions[i].drone_id;
            var position = response.positions[i].position;
            
            // THIS WILL BE PART OF THE RESPONSE IN VIEWS.PY !
            var past_positions = [
                [43.6077, 1.4482],
                [43.6080, 1.4482],
                [43.6090, 1.4482],
                [43.6100, 1.4482],
                [43.6110, 1.4482],
            ];
            
            var future_positions = [
                [43.6120, 1.4482],
                [43.6130, 1.4482],
                [43.6140, 1.4482],
                [43.6150, 1.4482],
                [43.6160, 1.4482],
            ]; 

            var trail = L.polyline(past_positions, {color : 'grey'}).addTo(flight_map);
            var intentions = L.polyline(future_positions,{color : 'grey', dashArray: '5,7'}).addTo(flight_map);
            
            // Identify corresponding drone
            var drone_to_update = drones.find(x => x.id == drone_id);

            // Update corresponding drone
            if(drone_to_update != undefined){
                drone_to_update.position.setLatLng(position);
                drone_to_update.position.setRotationAngle(90); // compute heading in the future
                updatedDrones.push(drone_id);
            } 
            // Or display error message
            else {
                console.error("no drone with id ", drone_id, " found !")
            }
        }
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