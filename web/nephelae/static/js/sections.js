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
}


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

        $.getJSON('box/', (response) => {

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
                .onFinishChange(updateData);

            gui.add(parameters, 'altitude', min_altitude, max_altitude)
                .setValue(initial_altitude)
                .step(1)
                .name('Altitude (m)')
                .onFinishChange(updateData);
        }),

        $.getJSON('discover/', (response) => {
            gui.add(parameters, 'variable', response.sample_tags)
            .setValue(response.sample_tags[0])
            .name("Variable")
            .onChange(updateData);
        }))

    // Once sliders are initialized, display initial section
    .done(updateData);
}

function updateData(){
    
    var query = $.param({altitude: parameters.altitude, time: parameters.time, variable: parameters.variable});

    $.getJSON('update/?' + query, (response) => {

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
        removeLoader();
    });
}