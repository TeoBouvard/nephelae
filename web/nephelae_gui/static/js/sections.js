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
    sensors: false,
    tracked_uav: 'None'
}

var mesonh_box = {};

$(document).ready(function(){
    // set sliders range and display initial image
    setupGUI();
});

function setupGUI(){

    // Construct dat.gui
    var gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    // Wwait for every ajax call to finish
    var test = {THT: true}
    var query = $.param({at_time: 10,
                variables: getSelectedElements({RCT: true}),
                uav_id: getSelectedElements({204: true})})
    $.getJSON('nom_temporaire/?' + query, (response) => {console.log(response)})

    $.when(

        gui.add(parameters, 'sensors').name('Sensor Data').onChange(updateData),
        $.getJSON('mesonh_dims/', (response) => {
            // Parse response
            var min_time = Math.ceil(response[0].min);
            var max_time = Math.floor(response[0].max);
            var initial_time = Math.ceil(response[0].min);

            var min_altitude = Math.ceil(response[1].min);
            var max_altitude = Math.floor(response[1].max);
            var initial_altitude = 1075;

            mesonh_box['min_x'] = Math.ceil(response[2].min);
            mesonh_box['max_x'] = Math.floor(response[2].max);

            mesonh_box['min_y'] = Math.ceil(response[3].min);
            mesonh_box['max_y'] = Math.floor(response[3].max);

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
            gui.add(parameters, 'tracked_uav', Object.keys(response.uavs))
            .setValue(Object.keys(response.uavs)[0])
            .name("UAV")
            .onChange(updateData);
            
            gui.add(parameters, 'variable', response.sample_tags)
            .setValue(response.sample_tags[0])
            .name("Variable")
            .onChange(updateData);
        }),
    // Once sliders are initialized, display initial section
    ).done(updateData);
}

function updateData(){
    var map_extraction = parameters.sensors ? 'LWC' : 'clouds';

    var query = $.param({altitude: parameters.altitude, time: parameters.time, 
        variable: map_extraction, 'min_x':100, 
        'max_x':1000, 'min_y':100, 
        'max_y':1000});
    $.getJSON('mesonh_section/?' + query, (response) => {
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
