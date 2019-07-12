// Activate current menu in nav
$('#nav_sections').addClass('active');

// Chart style and options
var chart_size = 600;

var layout = {
    width: chart_size,
    height: chart_size,
    uirevision: true,
};

var config = {
    responsive : true,
    displaylogo: false,
};

// Keep track of chart state
var isAlreadyDrawn = false;

var parameters = {
    time: 0,
    altitude: 0,
    selected_layer: 'clouds',
}


$(document).ready(function(){
    // set sliders range and display initial image
    setupGUI();
});

function setupGUI(){

    // Construct dat.gui
    var gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    $.getJSON('box/', function(response){

        // Parse response
        var min_time = Math.ceil(response[0].min);
        var max_time = Math.floor(response[0].max);
        var initial_time = Math.ceil(response[0].min);

        var min_altitude = Math.ceil(response[1].min);
        var max_altitude = Math.floor(response[1].max);
        var initial_altitude = 1075;

        var min_x = Math.ceil(response[2].min);
        var max_x = Math.floor(response[2].max);

        var min_y = Math.ceil(response[3].min);
        var max_y = Math.floor(response[3].max);

        // Setup GUI
        gui.add(parameters, 'time', min_time, max_time)
            .setValue(initial_time)
            .step(1)
            .name('Time (s)')
            .onChange(updateData);

        gui.add(parameters, 'altitude', min_altitude, max_altitude)
            .setValue(initial_altitude)
            .step(1)
            .name('Altitude (m)')
            .onChange(updateData);

        gui.add(parameters, 'selected_layer', ['clouds', 'thermals'])
            .name('Layer')
            .onChange(updateData);

        // Once sliders are initialized, display initial section
        updateData();
    });
}

function updateData(){
    var data;

    $.getJSON('update/' + parameters.time + '/' + parameters.altitude, (response) => {

        switch (parameters.selected_layer) {
            
            case "clouds":

                data = [{
                    x: response.axes,
                    y: response.axes,
                    z: response.clouds.data,
                    colorscale : clouds_colorscale(response.clouds.colormap_zero),
                    type: 'heatmap'     
                }];
                layout.title = 'Liquid Water Content in kg/kg';

                break;
            
            case "thermals":

                data = [{
                    x: response.axes,
                    y: response.axes,
                    z: response.thermals.data,
                    colorscale : thermals_colorscale(response.thermals.colormap_zero),
                    type: 'heatmap'
                }];
                layout.title = 'Vertical air speed in m/s';

                break;
        }

        if(isAlreadyDrawn){
            updateCharts(data);
        } else {
            if(data.length == 0){
                alert("No data received from the server");
            }
            initializeCharts(data);
            isAlreadyDrawn = true;
            removeLoader();
        }
    });
}

function initializeCharts(data, select){
    Plotly.newPlot('chart', data, layout, config);
}

function updateCharts(data){
    Plotly.react('chart', data, layout, config);
}