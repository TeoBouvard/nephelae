// Activate current menu in nav
document.getElementById('nav_map').className = 'active';

var drones = [];
var flight_map, planeIcon;

$(document).ready(function(){
    initializeMap();
    initializeDrones();
    window.setInterval(updateDrones, 2000);
});


function initializeMap(){
    //map
    flight_map = L.map('map').setView([43.6047, 1.4442], 13);
    //tiles
    L.tileLayer(
        'https://maps.heigit.org/openmapsurfer/tiles/roads/webmercator/{z}/{x}/{y}.png', 
        {
            maxZoom: 18,
        }
        ).addTo(flight_map);

    planeIcon = L.icon({
        iconUrl: '/img/plane_icon.png', // comment accéder à ce putain de fichier ?
        iconSize:     [50, 50], // size of the icon
        iconAnchor:   [25, 25], // marker's location
        popupAnchor:  [0, 25] // relative to the iconAnchor
    });
}

function initializeDrones(){
    $.ajax({ url: 'drones/', type: 'GET' }).done(function(response){

        // Initialize drone array with drone_id and position
        for (var i = 0; i < response.drones.length; i++){
            let drone_id = response.drones[i].drone_id;
            let position = response.drones[i].position;

            drones.push({id : drone_id, position : L.marker(position, { icon: planeIcon})});
            drones[i].position.addTo(flight_map);
            console.debug('drone[', drones[i].id, "] added to the map");
        }

    });

}

function updateDrones(){
    // Request new postitions of drones
    $.ajax({ url: 'update/', type: 'GET' }).done(function(response){

        // Update markers
        for (var i = 0; i < response.positions.length; i++){
            let drone_id = response.positions[i].drone_id;
            let position = response.positions[i].position;
            
            let drone_to_update = drones.find(x => x.id == drone_id);

            if(drone_to_update != undefined){
                drone_to_update.position.setLatLng(position);
                drone_to_update.position.setRotationAngle(90); // compute heading
                console.debug('position of drone[', drones[i].id, "] updated");
            } else {
                console.debug("no drone with id ", drone_id, " found !")
            }    
        }
    });

}

