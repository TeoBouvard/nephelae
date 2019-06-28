// Activate current menu in nav
document.getElementById('nav_infos').className = 'active';

var last_time_label;

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
    initializeChart();

    // Update elements every 'refresh_rate' ms
    displayDrones();
});

function displayDrones(){
    var addedDrones = [];
    var index_icon = 0;

    $.ajax({ url: '/map/update/', type: 'GET' }).done(function(response){

        // Initialize drone array with drone_id and position marker
        for (var key in response){

            // Get color and icon of markers, increment index_icon for next drone 
            var drone_color = global_colors[index_icon%global_colors.length];

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

            // Update chart data with new dataset and line color corresponding to the icon
            var update = {
                x: [log_times],
                y: [past_altitudes],
                name: drone_id,
                mode: 'lines',
                line: {
                    color: drone_color,
                    }
            };
            Plotly.addTraces('chart', update);
        }

        //Update chart, keep track of last time label added
        console.debug('drones', addedDrones, 'added to overlays');

        // Center map on drone last drone added
        if(addedDrones.length != 0){
            flight_map.setView(drone_position, 15);
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
            
            // Identify corresponding drone ... AUCUNE PUTAIN DE LOGIQUE
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
                    x: [log_times],
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
        //console.log(log_times);
        console.debug('positions of drones', updatedDrones, ' updated');
    });

}

function initializeChart(){

    var data = [];
    var layout = {
        title: '',
        xaxis: {
            title: 'Heure'
        },
        yaxis: {
            title: 'Altitude (m ASL)?'
        }
    };
    var config = { responsive : true };

    Plotly.newPlot('chart', data, layout, config);
}


