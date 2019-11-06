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
}

var position_of_uav = {};

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
        $.getJSON('mesonh_dims/', (response) => {
            // Parse response
            var min_time = Math.ceil(response[0].min);
            var max_time = Math.floor(response[0].max);
            var initial_time = Math.ceil(response[0].min);

            var min_altitude = Math.ceil(response[1].min);
            var max_altitude = Math.floor(response[1].max);
            var initial_altitude = 1075;

            // Setup GUI
            gui.add(parameters, 'time', min_time, max_time)
                .setValue(initial_time)
                .step(1)
                .name('Time (s)')
                .onFinishChange(updateData);

            gui.add(parameters, 'resolution', 100, 5000)
                .setValue(100)
                .step(1)
                .name('Resolution (pixels)')
                .onFinishChange(updateData);
        });

        $.getJSON('/discover/', (response) => {
            gui.add(parameters, 'uav', Object.keys(response.uavs))
            .setValue(Object.keys(response.uavs)[0])
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
    // Once sliders are initialized, display initial section

}

function updateData(){
    var query = $.param({
        at_time: parameters.time,
        variables: getSelectedElements(parameters.variables),
        uav_id: getSelectedElements(parameters.uavs)
    });
    $.getJSON('nom_temporaire/?' + query, (response) => {
        var coordonnees = 
            response[parameters.uav][parameters.variable].positions[0];
        position_of_uav.x = coordonnees[1];
        position_of_uav.y = coordonnees[2];
        position_of_uav.z = coordonnees[3];
        updateStaticMap();
     });
}

function updateStaticMap(){
    var map_extraction = parameters.sensors ? 'LWC' : 'clouds';
    var query = $.param({
        time: parameters.time,
        altitude: position_of_uav.z,
        variable: map_extraction,
        min_x: position_of_uav.x - parameters.resolution,
        max_x: position_of_uav.x + parameters.resolution,
        min_y: position_of_uav.y - parameters.resolution,
        max_y: position_of_uav.y + parameters.resolution,
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
