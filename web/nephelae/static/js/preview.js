// Activate current menu in nav
document.getElementById('nav_preview').className = 'active';
var length_display = document.getElementById('length_display');
var length_slider = document.getElementById('length_slider');
var init = new Powerange(length_slider, { min: 0, max: 500, start: 60});

// Define graph settings
var layout = {
    scene: {
        xaxis:{title: 'Longitude'},
        yaxis:{title: 'Latitude'},
        zaxis:{title: 'Altitude', showpikes: false},
        aspectratio: {x:1.3, y:1.3, z:0.9},
        camera: {
            center: { x: 0, y: 0, z: -0.2 }, 
            eye: { x: 1.6, y: 1.6, z: 0.2 }, 
            up: { x: 0, y: 0, z: 1 }
        },
    },
    showlegend: false,
    margin: {
        t: 0, //top margin
        l: 0, //left margin
        r: 0, //right margin
        b: 0, //bottom margin
    },
};

var config = { 
    responsive : true,
    displaylogo: false,
    modeBarButtonsToRemove: ['toImage', 'pan3d', 'zoom3d', 'orbitRotation', 'tableRotation', 'resetCameraLastSave3d', 'hoverClosest3d'],
};

// Parameters 
var refresh_rate = 2000; //milliseconds
var isAlreadyDrawn = false;
var trail_length = 60;

// Update trail length, display 0 when slider is 1 to not slice(0)
length_slider.onchange = function() {
    if(this.value == 0){
        length_display.innerHTML = "no trail";
    } else if (this.value == 1){
        length_display.innerHTML = "trail length : last second";
    } else {
        length_display.innerHTML = "trail length : last " + (this.value) + " seconds";
    }
    trail_length = this.value;
}


$(document).ready(function(){
    
    // Display original trail length
    length_display.innerHTML = "trail length : last " + trail_length + " seconds";

    // Start by getting 3d evolution box of the drones
    getBox();
});

function displayDrones(){
    var data = [];
    $.getJSON('update/', function(response){

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

            // Append current position to path
            past_longitudes.push(drone_position[1]);
            past_latitudes.push(drone_position[0]);
            past_altitudes.push(drone_altitude);

            // Update chart data with new dataset and line color corresponding to the icon
            var updatePath = {
                type: 'scatter3d',
                x: past_longitudes.slice(-trail_length-1),
                y: past_latitudes.slice(-trail_length-1),
                z: past_altitudes.slice(-trail_length-1),
                name: drone_id,
                mode: 'lines',
                line:{
                    color: drone_color,
                    shape: 'spline',
                    dash: 'solid',
                },
                hoverinfo: 'none'
            };
            
            var updateMarker = {
                type: 'scatter3d',
                x: [drone_position[1]],
                y: [drone_position[0]],
                z: [drone_altitude],
                name: drone_id,
                mode: 'markers+text',
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
        layout.scene.xaxis.range = response.longitude_range;
        layout.scene.yaxis.range = response.latitude_range;
        layout.scene.zaxis.range = response.altitude_range;

        // And then display the drones in the box
        displayDrones();
    })
}
