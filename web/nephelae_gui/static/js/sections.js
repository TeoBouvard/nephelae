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
    uav: '',
    resolution: 100,
    position_x: 0,
    position_y: 0,
    altitude: 0,
    map: '',
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
    gui.add(parameters, 'resolution', 100, 5000)
        .setValue(2500)
        .step(1)
        .name('Resolution (pixels)')
        .onFinishChange(updateData);

    $.getJSON('mesonh_dims/', (response) => {
        // Setup GUI
        controller_collection['time'] =
            gui.add(parameters, 'time')
                .setValue(0)
                .step(1)
                .name('Time (s)')
                .onFinishChange(updateData);

        controller_collection['altitude'] =
            gui.add(parameters, 'altitude')
                .setValue(0)
                .step(1)
                .name('Altitude (m)')
                .onFinishChange(updateData);
        
        controller_collection['position_x'] =
            gui.add(parameters, 'position_x')
                .setValue(900)
                .step(1)
                .name('Pos. X axis')
                .onFinishChange(updateData);
        
        controller_collection['position_y'] =
            gui.add(parameters, 'position_y')
                .setValue(-900)
                .step(1)
                .name('Pos. Y axis')
                .onFinishChange(updateData);
            
        $.getJSON('/discover/', (response) => {
            x = Object.keys(response.uavs).concat('None')
            
            gui.add(parameters, 'uav', x)
            .setValue(x[0])
            .name("UAV")
            .onChange(updateData);
        
            parameters['uavs'] = {};
            parameters['variables'] = {};
        
            for (var uav_id in response.uavs){
                parameters['uavs'][uav_id] = true;
            };
            for (var vari of response.sample_tags){
                parameters['variables'][vari] = true;
            };
            $.getJSON('/discover_maps/', (response) => {
                
                gui.add(parameters, 'map', Object.keys(response))
                .setValue('clouds')
                .name('Map')
                .onChange(updateData);

                updateData();
            });
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
                response[parameters.uav][Object.keys(parameters.variables)[0]].positions[0];
            parameters.position_x = coordonnees[1];
            controller_collection['position_x'].updateDisplay();
            parameters.position_y = coordonnees[2];
            controller_collection['position_y'].updateDisplay();
            parameters.altitude = coordonnees[3];
            controller_collection['altitude'].updateDisplay();
            parameters.time = coordonnees[0];
            controller_collection['time'].updateDisplay();
            updateStaticMap();
        });
    }
    else
        updateStaticMap();
}

function updateStaticMap(){
    var query = $.param({
        time: parameters.time,
        altitude: parameters.altitude,
        variable: parameters.map,
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
