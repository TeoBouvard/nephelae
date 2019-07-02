// Activate current menu in nav
document.getElementById('nav_preview').className = 'active';

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
var refresh_rate = 500; //milliseconds

$(document).ready(function(){
    // Update elements every 'refresh_rate' ms
    displayDrones();
});

function displayDrones(){
    var data = [];

    $.get('update/', function(response){

        // Initialize drone array with drone_id and position marker
        for (var key in response){

            // Parse response data
            var drone_id = key;
            var drone_color = global_colors[key%global_colors.length];
            var drone_position = response[key].position;
            var drone_altitude = response[key].altitude;
            var drone_path = response[key].path;
            var past_altitudes = response[key].past_altitudes;

            // Update chart data with new dataset and line color corresponding to the icon
            var update = {
                type: 'scatter3d',
                x: [drone_position[0]],
                y: [drone_position[1]],
                z: [drone_altitude],
                name: drone_id,
                marker:{
                    color: drone_color,
                }
            };

            data.push(update);
        }

        var layout = {
            scene: {
                xaxis:{title: 'Longitude',}, // range: [1.2, 1.3],},
                yaxis:{title: 'Latitude', }, //range: [43.4, 43.5],},
                zaxis:{title: 'Altitude', }, //range: [0, 200],},
            },
        };

        var config = { 
            responsive : true,
            displaylogo: false,
            modeBarButtonsToRemove: ['toImage'],
        };

        Plotly.newPlot('chart', data, layout, config);

        // Launch livetracking if response contains data
        if(data.length != 0){
            setInterval(updateDrones, refresh_rate);
        } else {
            alert("No drones detected, try launching the simulation and restart the server");
        }
    });
}

function updateDrones(){
    var data = [];

    // Request updated data from the server
    $.get('update/', function(response){

        // Parse response
        for (var key in response){
            var drone_id = key;
            var drone_color = global_colors[key%global_colors.length];
            var drone_position = response[key].position;
            var drone_altitude = response[key].altitude;
            var drone_heading = response[key].heading;
            var drone_path = response[key].path;
            var past_altitudes = response[key].past_altitudes;
            var log_times = response[key].log_times;
            var time = response[key].time;

            // Update chart data with new dataset and line color corresponding to the icon
            var update = {
                type: 'scatter3d',
                x: [drone_position[0]],
                y: [drone_position[1]],
                z: [drone_altitude],
                name: drone_id,
                marker:{
                    color: drone_color,
                }
            };
            data.push(update);
        }

        console.debug('positions of drones', data, ' updated');
        Plotly.react('chart', data)
    });
}