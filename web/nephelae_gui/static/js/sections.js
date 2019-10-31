// Activate current menu in nav
$('#nav_sections').addClass('active');

// Chart style and options
var chart_size = 600;

var layout = {
    width: chart_size,
    height: chart_size,
};

var config = {
    responsive : true,
    displaylogo: false,
};

var parameters = {
    time: 0,
    altitude: 0,
    variable: [],
    sensors: true,
}

var coords_box = {};

$(document).ready(function(){
    // set sliders range and display initial image
    setupGUI();
});

function setupGUI(){

    // Construct dat.gui
    var gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    // Wwait for every ajax call to finish
    $.when(

        gui.add(parameters, 'sensors').name('Sensor Data').onChange(updateData),
        $.getJSON('box/', (response) => {

            // Parse response
            var min_time = Math.ceil(response[0].min);
            var max_time = Math.floor(response[0].max);
            var initial_time = Math.ceil(response[0].min);

            var min_altitude = Math.ceil(response[1].min);
            var max_altitude = Math.floor(response[1].max);
            var initial_altitude = 1075;

            coords_box['min_x'] = Math.ceil(response[2].min);
            coords_box['max_x'] = Math.floor(response[2].max);

            coords_box['min_y'] = Math.ceil(response[3].min);
            coords_box['max_y'] = Math.floor(response[3].max);

            // Setup GUI
            gui.add(parameters, 'time', min_time, max_time)
                .setValue(initial_time)
                .step(1)
                .name('Time (s)')
                .onFinishChange(updateData);

            gui.add(parameters, 'altitude', min_altitude, max_altitude)
                .setValue(initial_altitude)
                .step(1)
                .name('Altitude (m)')
                .onFinishChange(updateData);
        }),

        $.getJSON('/discover/', (response) => {
            gui.add(parameters, 'variable', response.sample_tags)
            .setValue(response.sample_tags[0])
            .name("Variable")
            .onChange(updateData);
        }))
    // Once sliders are initialized, display initial section
    .done(updateData);
}

function updateData(){
    var map_extraction = parameters.sensors ? 'LWC' : 'clouds';
    var query = $.param({altitude: parameters.altitude, time: parameters.time, variable: map_extraction, 'min_x':coords_box.min_x, 'max_x':coords_box.max_x, 'min_y':coords_box.min_y, 'max_y':coords_box.max_y});
    $.getJSON('update/?' + query, (response) => {
        console.log(response)
        var lay = createLayout(parameters.variable, response.data);

        var data = [{
            x: response.axes,
            y: response.axes,
            z: response.data,
            colorscale : lay['cmap'],
            type: 'heatmap'     
        }];
        layout.title = lay['title'];

        Plotly.react('chart', data, layout, config);
    });
    removeLoader();
}
