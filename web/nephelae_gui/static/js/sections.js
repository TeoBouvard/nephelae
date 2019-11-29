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
    taille_x: 100,
    taille_y: 100,
    taille: 100,
    position_x: 0,
    position_y: 0,
    altitude: 0,
    map: '',
    default_min: 100,
    default_max: 10000,
    center_fun: drawCenter
}

var map_boundaries = {};

var position_of_uav = {};
var controller_collection = {};

var sliders_length = {}

$(document).ready(function(){
    // set sliders range and display initial image
    setupGUI();
});

function setupGUI(){

    // Construct dat.gui
    var gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    // Wwait for every ajax call to finish
    var f1 = gui.addFolder('Pixels');
    var f2 = gui.addFolder('Pixels (UAV)');
    sliders_length['taille_x'] = f1.add(parameters, 'taille_x', 
        parameters.default_min, parameters.default_max)
        .setValue(5000)
        .step(1)
        .name('Taille x')
        .onFinishChange(updateData);

    sliders_length['taille_y'] = f1.add(parameters, 'taille_y', 
        parameters.default_min, parameters.default_max)
        .setValue(5000)
        .step(1)
        .name('Taille y')
        .onFinishChange(updateData);

    f2.add(parameters, 'taille', parameters.default_min, parameters.default_max)
        .setValue(5000)
        .step(1)
        .name('Taille')
        .onFinishChange(updateData);
    
    gui.add(parameters, 'center_fun')
        .name('Draw center');

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
                .setValue('None')
                .name("UAV")
                .onChange(function(){
                    fieldsBehavior(parameters.uav == 'None', f1, f2)
                    updateData();
                });

            fieldsBehavior(parameters.uav == 'None', f1, f2);
            parameters['uavs'] = {};
            parameters['variables'] = {};

            for (var uav_id in response.uavs){
                parameters['uavs'][uav_id] = true;
            };
            for (var vari of response.sample_tags){
                parameters['variables'][vari] = true;
            };
            $.getJSON('/discover_maps/', (response) => {
                for (var map in response){
                    map_boundaries[map] = response[map]['range']
                }
                gui.add(parameters, 'map', Object.keys(response))
                    .setValue(Object.keys(response)[0])
                    .name('Map')
                    .onChange(function(){
                        boundsChangement();
                        updateData();
                    });

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
        $.getJSON('uav_state_at_time/?' + query, (response) => {
            var coordonnees = 
                response[parameters.uav][Object.keys(parameters.variables)[0]]
                .positions[0];
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
    var query = doQuery();
    $.getJSON('map_section/?' + query, (response) => {
        var lay = createLayout(parameters.variable, response.data);
        var data = [{
            x: response.axe_x,
            y: response.axe_y,
            z: response.data,
            colorscale : lay['cmap'],
            type: 'heatmap'
        }];
        layout.title = lay['title'];
        Plotly.react('chart', data, layout, config);
    });
    removeLoader();
}

function drawCenter(){
    var query = doQuery();
    $.getJSON('center_cloud/?' + query, (response) => {
        var center = {
            x: [response.data[0]],
            y: [response.data[1]],
            mode: 'markers',
            type: 'scatter'
        }
        data = [center];
        Plotly.addTraces('chart', data);
    });
}

function doQuery(){
    if (parameters.uav != 'None') {
        var query = $.param({
            time: parameters.time,
            altitude: parameters.altitude,
            variable: parameters.map,
            min_x: parameters.position_x - parameters.taille/2,
            max_x: parameters.position_x + parameters.taille/2,
            min_y: parameters.position_y - parameters.taille/2,
            max_y: parameters.position_y + parameters.taille/2,
        });
    } else {
        var query = $.param({
            time: parameters.time,
            altitude: parameters.altitude,
            variable: parameters.map,
            min_x: parameters.position_x - parameters.taille_x/2,
            max_x: parameters.position_x + parameters.taille_x/2,
            min_y: parameters.position_y - parameters.taille_y/2,
            max_y: parameters.position_y + parameters.taille_y/2,
        });
    }
    return query
}

function fieldsBehavior(state, f1, f2){
    if (state){
        f1.show();
        f1.open();
        f2.hide();
    } else {
        f1.hide();
        f2.show();
        f2.open();
    }
}

function boundsChangement(){
    if (map_boundaries[parameters.map][0] != null){
        sliders_length['taille_x'].min(map_boundaries[parameters.map][0])
        sliders_length['taille_x'].max(map_boundaries[parameters.map][1])
        sliders_length['taille_y'].min(map_boundaries[parameters.map][2])
        sliders_length['taille_y'].max(map_boundaries[parameters.map][3])
        

        if (sliders_length['taille_x'].getValue() < map_boundaries[parameters.map][0])
            sliders_length['taille_x'].setValue(map_boundaries[parameters.map][0])
        if (sliders_length['taille_x'].getValue() > map_boundaries[parameters.map][1])
            sliders_length['taille_x'].setValue(map_boundaries[parameters.map][1])
        if (sliders_length['taille_y'].getValue() < map_boundaries[parameters.map][2])
            sliders_length['taille_y'].setValue(map_boundaries[parameters.map][2])
        if (sliders_length['taille_y'].getValue() > map_boundaries[parameters.map][3])
            sliders_length['taille_y'].setValue(map_boundaries[parameters.map][3])
    } else {
        sliders_length['taille_x'].min(parameters.default_min)
        sliders_length['taille_x'].max(parameters.default_max)
        sliders_length['taille_y'].min(parameters.default_min)
        sliders_length['taille_y'].max(parameters.default_max)
        
        if (sliders_length['taille_x'].getValue() < parameters.default_min)
            sliders_length['taille_x'].setValue(parameters.default_min)
        if (sliders_length['taille_x'].getValue() > parameters.default_max)
            sliders_length['taille_x'].setValue(parameters.default_max)
        if (sliders_length['taille_y'].getValue() < parameters.default_min)
            sliders_length['taille_y'].setValue(parameters.default_min)
        if (sliders_length['taille_y'].getValue() > parameters.default_max)
            sliders_length['taille_y'].setValue(parameters.default_max)
    }
    sliders_length['taille_x'].updateDisplay()
    sliders_length['taille_y'].updateDisplay()
}
