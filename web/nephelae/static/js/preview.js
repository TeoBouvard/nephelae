// Activate current menu in nav
$('#nav_preview').addClass('active');

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
    displayModeBar: false,
};

// Parameters 
var parameters = {
    trail_length: 50,
    update: drawPlot,
    line_color: 'Altitude',
    color_mapping: {LWC: ['past_altitudes', 'Greys'], Altitude: ['past_altitudes', 'Reds']},
}


$(document).ready(function(){

    // // Inititalize parameters before drawing plot
    setupGUI();

});

function setupGUI(){

    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    var f1 = gui.addFolder('Controls');
    f1.add(parameters, 'trail_length', 2, 500).step(1).name("Trail length (s)").onChange(drawPlot);
    f1.add(parameters, 'line_color', ['Altitude', 'LWC']).name("Trail color").onChange(drawPlot);
    f1.add(parameters, 'update').name('Update plot');

    var f2 = gui.addFolder('Trails');

    $.getJSON('update/', (response) => {

        for (var key in response.drones){
            parameters[key] = true;
            f2.add(parameters, key).name('Drone ' + key).onChange(drawPlot);
        }

        // And then display the drones
        drawPlot();
    })
}

function drawPlot(){

    var data = [];

    $.getJSON('update/', (response) => {

        for (var key in response.drones){

            // Check if trail has to be displayed
            if (parameters[key]){

                // Parse drones data
                var drone_id = key;
                var drone_color = global_colors[key%global_colors.length];
                var drone_path = response.drones[key].path;
                var past_latitudes = [];
                var past_longitudes = [];
                var past_altitudes = [];

                // Compute coordinates from path
                for(var i = 0; i < Math.min(parameters.trail_length, drone_path.length); i++){
                    past_latitudes.push(drone_path[i][0]);
                    past_longitudes.push(drone_path[i][1]);
                    past_altitudes.push(drone_path[i][2]);
                }

                // Update chart data with new dataset and line color corresponding to the icon
                var displayColorBar = onlyOneTrail();
                var updatePath = {
                    type: 'scatter3d',
                    x: past_longitudes,
                    y: past_latitudes,
                    z: past_altitudes,
                    name: drone_id,
                    mode: 'lines',
                    line: {
                        width: 5,
                        shape: 'spline',
                        color: eval(parameters.color_mapping[parameters.line_color][0]),
                        colorscale: parameters.color_mapping[parameters.line_color][1],
                        showscale: displayColorBar,
                        colorbar: {
                            x: -0.2,
                            xpad: 30,
                        }
                    },
                };
                data.push(updatePath);
            }
        }

        // Create or update plot with new data
        Plotly.react('chart', data, layout, config);
        console.log("called")
        removeLoader();
    });
}

function onlyOneTrail() {

    var numberOfTrails = 0;

    for(key in parameters){
        if (typeof parameters[key] == 'boolean' && parameters[key] == true) numberOfTrails++;
    }

    return numberOfTrails == 1;
}