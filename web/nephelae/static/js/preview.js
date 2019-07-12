// Activate current menu in nav
$('#nav_preview').addClass('active');

var chart_size = 800;

// Plot settings
var layout = {
    scene: {
        xaxis:{title: 'Longitude'},
        yaxis:{title: 'Latitude'},
        zaxis:{title: 'Altitude'},
        aspectratio: {x:1.3, y:1.3, z:0.9},
        camera: {
            center: { x: 0, y: 0, z: -0.2 }, 
            eye: { x: 1.6, y: 1.6, z: 0.2 }, 
            up: { x: 0, y: 0, z: 1 }
        },
    },
    showlegend: false,
};

var config = { 
    responsive : true,
    displaylogo: false,
    modeBarButtonsToRemove: ['toImage', 'pan3d', 'zoom3d', 'orbitRotation', 'tableRotation', 'resetCameraLastSave3d', 'hoverClosest3d'],
};

// Parameters 
var parameters = {
    trail_length: 50,
    update: displayDrones,
}


$(document).ready(function(){

    // // Inititalize parameters
    setupGUI();

});

function setupGUI(){

    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    $.getJSON('update/', (response) => {

        // And then display the drones in the box
        displayDrones();
    })
}

function displayDrones(){

    var data = [];

    $.getJSON('update/', (response) => {

        // Initialize drone array with drone_id and position marker
        for (var key in response.drones){

            // Parse drones data
            var drone_id = key;
            var drone_color = global_colors[key%global_colors.length];
            var drone_position = response.drones[key].position;
            var drone_altitude = response.drones[key].altitude;
            var past_altitudes = response.drones[key].past_altitudes;
            var drone_path = response.drones[key].path
            var past_latitudes = [];
            var past_longitudes = [];

            // Compute coordinates from path
            for(var i = 0; i < parameters.trail_length; i++){
                past_latitudes.push(drone_path[i][0]);
                past_longitudes.push(drone_path[i][1]);
            }
            

            // Update chart data with new dataset and line color corresponding to the icon
            var updatePath = {
                type: 'scatter3d',
                x: past_longitudes,
                y: past_latitudes,
                z: past_altitudes.slice(-parameters.trail_length-1),
                name: drone_id,
                mode: 'lines',
                line:{
                    color: drone_color,
                    shape: 'spline',
                    dash: 'solid',
                },
                hoverinfo: 'none'
            };

            
            /*var updateMarker = {
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

            data.push(updateMarker);*/

            data.push(updatePath);
        }

        // Create or update plot with new data
        Plotly.react('chart', data, layout, config);
        removeLoader();
    });
}