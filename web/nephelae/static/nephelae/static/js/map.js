// Activate current menu in nav
document.getElementById('nav_map').className = 'active';

var chart;
var icons = [];
var drones = [];
var flight_map;

$(document).ready(function(){
    initializeMap();
    initializeDrones();
    initializeChart();

    setTimeout(updateDrones, 2000);
    //updateDrones();
    //window.setInterval(updateDrones, 2000);
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
            iconSize:     [30, 30], // size of the icon
            iconAnchor:   [15, 15], // marker's location
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
    $.ajax({ url: 'drones/', type: 'GET' }).done(function(response){

        // Initialize drone array with drone_id and position marker
        for (var i = 0; i < response.drones.length; i++){
            let drone_id = response.drones[i].drone_id;
            let position = response.drones[i].position;

            var marker = L.marker(position, {icon: icons[i]});

            drones.push({id : drone_id, position : marker});
            drones[i].position.addTo(flight_map).bindPopup('Drone n°' + drone_id);;
            console.debug('drone[', drones[i].id, "] added to the map");
        }

    });

}

function updateDrones(){
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

            var trail = L.polyline(past_positions, {color : 'blue'}).addTo(flight_map);
            var intentions = L.polyline(future_positions,{color : 'grey', dashArray: '10,10'}).addTo(flight_map);
            
            // Identify corresponding drone
            var drone_to_update = drones.find(x => x.id == drone_id);

            // Update corresponding drone
            if(drone_to_update != undefined){
                drone_to_update.position.setLatLng(position);
                drone_to_update.position.setRotationAngle(90); // compute heading in the future
                console.debug('position of drone[', drones[i].id, "] updated");
            } 
            // Or display error message
            else {
                console.error("no drone with id ", drone_id, " found !")
            }    
        }
    });

}

function initializeChart(){
    var chart_canvas = 'altitude_chart'
    
    chart = new Chart(chart_canvas, {
        type: 'line',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                label: 'Drone n°1',
                borderColor: 'rgb(255, 99, 132)',
                data: [0, 10, 5, 2, 20, 30, 45]
            }]
        },

        // Configuration options
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}