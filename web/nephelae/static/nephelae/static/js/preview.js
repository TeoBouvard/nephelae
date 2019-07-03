// Activate current menu in nav
document.getElementById('nav_preview').className = 'active';

// Define graph settings
var layout = {
            scene: {
                xaxis:{title: 'Longitude',showgrid: true}, // range: [1.2, 1.3],},
                yaxis:{title: 'Latitude', showgrid: true}, //range: [43.4, 43.5],},
                zaxis:{title: 'Altitude', range: [0, 300],},
		        aspectratio: {x:1.3, y:1.3, z:0.9},
            },
            showlegend: false,
            margin: {
                t: 0, //top margin
                l: 0, //left margin
                r: 0, //right margin
                b: 100, //bottom margin
            },
            uirevision: 'true',
        };

var config = { 
    responsive : true,
    displaylogo: false,
    modeBarButtonsToRemove: ['toImage'],
};

// Parameters 
var refresh_rate = 3000; //milliseconds
var isAlreadyDrawn = false;

$(document).ready(function(){
    getBox();
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
            var past_altitudes = response[key].past_altitudes;
            var past_longitudes = response[key].past_longitudes;
            var past_latitudes = response[key].past_latitudes;

            // Update chart data with new dataset and line color corresponding to the icon
            var updatePath = {
                type: 'scatter3d',
                x: past_longitudes.slice(-50),
                y: past_latitudes.slice(-50),
                z: past_altitudes,
                name: drone_id,
                mode: 'lines',
                line:{
                    color: drone_color,
                    shape: 'spline',
                    dash: 'solid',
                }
            };
            
            var updateMarker = {
                type: 'scatter3d',
                x: [drone_position[1]],
                y: [drone_position[0]],
                z: [drone_altitude],
                name: drone_id,
                mode: 'markers',
                marker:{
                    color: drone_color,
                    size: 5,
                }
            };

            data.push(updatePath);
            data.push(updateMarker);
        }

        if(isAlreadyDrawn){
            // Update chart if it already exists
            Plotly.react('chart', data, layout, config)
        } else {
            // Launch livetracking if response contains data
            if(data.length == 0){
                alert("No drones detected, try launching the simulation and restart the server");
            } else {
                Plotly.newPlot('chart', data, layout, config);
                isAlreadyDrawn = true;
                setInterval(displayDrones, refresh_rate);
            }
        }
    });
}

function getBox(){
    $.getJSON('box', function(response){
        console.log('OK');
    })
}