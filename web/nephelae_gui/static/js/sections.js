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
    uav: '',
    resolution: 100,
    position_x: 0,
    position_y: 0,
    altitude: 0,
}

var position_of_uav = {};
var controller_collection = {};

$(document).ready(function(){
    // set sliders range and display initial image
    setupGUI();
});

function setupGUI(){

    // Construct dat.gui
    var gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    // Wwait for every ajax call to finish
    gui.add(parameters, 'sensors').name('Sensor Data').onChange(updateData),

    gui.add(parameters, 'resolution', 100, 5000)
        .setValue(2500)
        .step(1)
        .name('Resolution (pixels)')
        .onFinishChange(updateData);

    $.getJSON('mesonh_dims/', (response) => {
        // Parse response
        var min_time = Math.ceil(response[0].min);
        var max_time = Math.floor(response[0].max);

        var min_altitude = Math.ceil(response[1].min);
        var max_altitude = Math.floor(response[1].max);
        var initial_altitude = 700;

        var min_axe_x = Math.ceil(response[2].min);
        var max_axe_x = Math.floor(response[2].max);

        var min_axe_y = Math.ceil(response[3].min);
        var max_axe_y = Math.floor(response[3].max);

        // Setup GUI
        gui.add(parameters, 'time', min_time, max_time)
            .setValue(min_time)
            .step(1)
            .name('Time (s)')
            .onFinishChange(updateData);

        controller_collection['altitude'] =
            gui.add(parameters, 'altitude', min_altitude, max_altitude)
                .setValue(initial_altitude)
                .step(1)
                .name('Altitude (m)')
                .onFinishChange(updateData);
        
        controller_collection['position_x'] =
            gui.add(parameters, 'position_x', min_axe_x, max_axe_x)
                .setValue(min_axe_x)
                .step(1)
                .name('Pos. X axis')
                .onFinishChange(updateData);
        
        controller_collection['position_y'] =
            gui.add(parameters, 'position_y', min_axe_y, max_axe_y)
                .setValue(min_axe_y)
                .step(1)
                .name('Pos. Y axis')
                .onFinishChange(updateData);
            
        $.getJSON('/discover/', (response) => {
            x = Object.keys(response.uavs).concat('None')
            
            gui.add(parameters, 'uav', x)
            .setValue(x[0])
            .name("UAV")
            .onChange(updateData);
            
            gui.add(parameters, 'variable', response.sample_tags)
            .setValue(response.sample_tags[0])
            .name("Variable")
            .onChange(updateData);
        
            parameters['uavs'] = {};
            parameters['variables'] = {};
        
            for (var uav_id in response.uavs){
                parameters['uavs'][uav_id] = true;
            };
            for (var vari of response.sample_tags){
                parameters['variables'][vari] = true;
            };
            updateData();
        });
    });
}

function updateData(){
    if (parameters.uav != 'None'){
        var query = $.param({
            at_time: parameters.time,
            variables: getSelectedElements(parameters.variables),
            uav_id: getSelectedElements(parameters.uavs)
        });
        $.getJSON('nom_temporaire/?' + query, (response) => {
            var coordonnees = 
                response[parameters.uav][parameters.variable].positions[0];
            parameters.position_x = coordonnees[1];
            controller_collection['position_x'].updateDisplay();
            parameters.position_y = coordonnees[2];
            controller_collection['position_y'].updateDisplay();
            parameters.altitude = coordonnees[3];
            controller_collection['altitude'].updateDisplay();
            updateStaticMap();
        });
    }
    else
        updateStaticMap();
}

function updateStaticMap(){
    var map_extraction = parameters.sensors ? 'LWC' : 'clouds';
    var query = $.param({
        time: parameters.time,
        altitude: parameters.altitude,
        variable: map_extraction,
        min_x: parameters.position_x - parameters.resolution,
        max_x: parameters.position_x + parameters.resolution,
        min_y: parameters.position_y - parameters.resolution,
        max_y: parameters.position_y + parameters.resolution,
    });
    $.getJSON('map_section/?' + query, (response) => {
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
