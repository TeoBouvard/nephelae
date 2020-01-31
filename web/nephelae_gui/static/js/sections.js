// Activate current menu in nav
$('#nav_sections').addClass('active');

// Chart style and options
var chart_size = 1000;

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
    uav_color: {},
    taille_x: 100,
    taille_y: 100,
    taille: 100,
    position_x: 0,
    position_y: 0,
    altitude: 0,
    map: '',
    default_min: 100,
    default_max: 10000,
    scale: false,
    threshold: 2e-4,
    center_fun: drawCenter,
    contour_fun: drawContour,
    boxes_fun: showBoxes,
    using_sliders: false
}

var map_boundaries = {};
var map_threshold = {};
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
    
    // Set up listener (Is there a good way to do that ????)
    Plotly.react('chart', []);
    var chart = document.getElementById('chart');
    chart.on('plotly_click', showVolume);

    // Wait for every ajax call to finish
    var f1 = gui.addFolder('Pixels');
    var f2 = gui.addFolder('Pixels (Scaled)');
    
    var no_bounds_folder = gui.addFolder('Center choice');
    var bounds_folder = gui.addFolder('Space choice');
    
    
    controller_collection['taille_x'] = 
        f1.add(parameters, 'taille_x', parameters.default_min,
        parameters.default_max)
        .setValue(5000)
        .step(1)
        .name('Taille x')
        .onFinishChange(updateData);

    controller_collection['taille_y'] = 
        f1.add(parameters, 'taille_y', parameters.default_min,
        parameters.default_max)
        .setValue(5000)
        .step(1)
        .name('Taille y')
        .onFinishChange(updateData);
    
    controller_collection['taille'] = 
        f2.add(parameters, 'taille', parameters.default_min,
            parameters.default_max)
        .setValue(5000)
        .step(1)
        .name('Taille')
        .onFinishChange(updateData);
    
    controller_collection['threshold'] = 
        gui.add(parameters, 'threshold')
        .setValue(2e-4)
        .step(1e-5)
        .name('Threshold')
        .onFinishChange(function(){
            map_threshold[parameters.map] = parameters.threshold;
            updateData();
        });

    
    gui.add(parameters, 'center_fun')
        .name('Draw center');

    gui.add(parameters, 'contour_fun')
        .name('Draw contour');
    
    gui.add(parameters, 'boxes_fun')
        .name('Show bounds');

    controller_collection['time'] =
        no_bounds_folder.add(parameters, 'time')
        .setValue(0)
        .step(0.0001)
        .name('Time (s)')
        .onFinishChange(updateData);

    controller_collection['altitude'] =
        no_bounds_folder.add(parameters, 'altitude')
        .setValue(700)
        .step(1)
        .name('Altitude (m)')
        .onFinishChange(updateData);
    
    controller_collection['time_bounds'] =
        bounds_folder.add(parameters, 'time')
        .setValue(0)
        .step(0.0001)
        .name('Time (s)')
        .onFinishChange(updateData);

    controller_collection['altitude_bounds'] =
        bounds_folder.add(parameters, 'altitude')
        .setValue(700)
        .step(1)
        .name('Altitude (m)')
        .onFinishChange(updateData);

    controller_collection['position_x'] =
        no_bounds_folder.add(parameters, 'position_x')
        .setValue(900)
        .step(1)
        .name('Pos. X axis')
        .onFinishChange(updateData);

    controller_collection['position_y'] =
        no_bounds_folder.add(parameters, 'position_y')
        .setValue(-900)
        .step(1)
        .name('Pos. Y axis')
        .onFinishChange(updateData);
    
    controller_collection['bounds_position_x'] = 
        bounds_folder.add(parameters, 'position_x', parameters.default_min,
        parameters.default_max)
        .setValue(5000)
        .step(1)
        .name('Pos. X axis')
        .onFinishChange(updateData);
    
    controller_collection['bounds_position_y'] = 
        bounds_folder.add(parameters, 'position_y', parameters.default_min,
        parameters.default_max)
        .setValue(5000)
        .step(1)
        .name('Pos. Y axis')
        .onFinishChange(updateData);
    
    $.getJSON('/discover/', (response) => {
        x = Object.keys(response.uavs).concat('None')

        gui.add(parameters, 'uav', x)
            .setValue('None')
            .name("UAV")
            .onChange(function(){
                updateData();
            });

        fieldsBehavior(parameters.uav == 'None', f1, f2);
        parameters['uavs'] = {};
        parameters['variables'] = {};

        for (var uav_id in response.uavs){
            parameters['uav_color'][uav_id] = response.uavs[uav_id].gui_color;
            parameters['uavs'][uav_id] = true;
        };
        let list_tags = Object.keys(response.sample_tags);
        for (var i = 0; i < list_tags.length; i++){
            parameters['variables'][list_tags[i]] = (i == 0);
        };
        $.getJSON('/discover_maps/', (response) => {
            list_map = [];
            for (var map in response){
                if(!map.endsWith('_border')){
                    map_boundaries[map] = response[map]['range'];
                    map_threshold[map] = response[map]['threshold'];
                    list_map.push(map);
                }
            }
            gui.add(parameters, 'map', list_map)
                .setValue(Object.keys(response)[0])
                .name('Map')
                .onChange(function(){
                    boundsChangement(bounds_folder, no_bounds_folder);
                    controller_collection['threshold'].setValue(
                        map_threshold[parameters.map]);
                    controller_collection['threshold'].updateDisplay();
                    updateData();
                });
            gui.add(parameters, 'scale')
                .name('Scale')
                .onChange(function(){
                    fieldsBehavior(parameters.scale, f2, f1);
                    updateData();
                });
            boundsChangement(bounds_folder, no_bounds_folder);
            updateData();
        });
    });
}

function updateData(){
    clearLayout();
    var query = $.param({
        at_time: parameters.time,
        variables: getSelectedElements(parameters.variables),
        uav_id: getSelectedElements(parameters.uavs)
    });
    if (parameters.uav != 'None' && !parameters.using_sliders){
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
    } else if (parameters.uav != 'None'){
        $.getJSON('uav_state_at_time/?' + query, (response) => {
            var coordonnees = 
                response[parameters.uav][Object.keys(parameters.variables)[0]]
                .positions[0];
            parameters.altitude = coordonnees[3];
            controller_collection['altitude_bounds'].updateDisplay();
            parameters.time = coordonnees[0];
            controller_collection['time_bounds'].updateDisplay();
            parameters.position_x = controller_collection['bounds_position_x'].__min;
            controller_collection['bounds_position_x'].updateDisplay();
            parameters.position_y = controller_collection['bounds_position_y'].__min;
            controller_collection['bounds_position_y'].updateDisplay();
            updateBoundedMapWithUAV(coordonnees[1], coordonnees[2]);
        });
    } else {
        updateStaticMap();
    }
}

function updateBoundedMapWithUAV(coord_x, coord_y){
    var query = doQuery();
    $.getJSON('map_section/?' + query, (response) => {
        var lay = createLayout(parameters.variable, response.data);
        var data = [{
            x: response.x_axis,
            y: response.y_axis,
            z: response.data,
            colorscale : lay['cmap'],
            type: 'heatmap'
        }];
        layout.title = lay['title'];
        layout.xaxis = {
            autorange:false,
            range: [Math.min.apply(Math, response.x_axis),
                Math.max.apply(Math, response.x_axis)],
            zeroline:false};
        layout.yaxis = {
            autorange:false,
            range: [Math.min.apply(Math, response.y_axis),
                Math.max.apply(Math, response.y_axis)],
            zeroline: false};
        layout.autosize = false;
        Plotly.react('chart', data, layout, config);
        plotUAV(coord_x, coord_y);
    });
    removeLoader();
}

function plotUAV(coord_x, coord_y){
    var uav = {
        x: [coord_x],
        y: [coord_y],
        mode: 'markers',
        type: 'scatter',
        name: 'UAV ' + parameters.uav,
        marker: {
            color: parameters.uav_color[parameters.uav],
        },
    }
    data = [uav];
    Plotly.addTraces('chart', data);
}

function updateStaticMap(){
    var query = doQuery();
    $.getJSON('map_section/?' + query, (response) => {
        var lay = createLayout(parameters.variable, response.data);
        var data = [{
            x: response.x_axis,
            y: response.y_axis,
            z: response.data,
            colorscale : lay['cmap'],
            type: 'heatmap'
        }];
        layout.title = lay['title'];
        layout.xaxis = {
            autorange:false,
            range: [Math.min.apply(Math, response.x_axis),
                Math.max.apply(Math, response.x_axis)],
            zeroline:false};
        layout.yaxis = {
            autorange:false,
            range: [Math.min.apply(Math, response.y_axis),
                Math.max.apply(Math, response.y_axis)],
            zeroline: false};
        layout.autosize = false;
        Plotly.react('chart', data, layout, config);
    });
    removeLoader();
}

function drawCenter(){
    var query = doQuery() + '&' + $.param({threshold: parameters.threshold});
    $.getJSON('center_cloud/?' + query, (response) => {
        var center = {
            x: response.list_x,
            y: response.list_y,
            mode: 'markers',
            name: 'Cloud center',
            type: 'scatter',
        }
        data = [center];
        Plotly.addTraces('chart', data);
    });
}

function drawContour(){
    var query = doQuery() + '&' + $.param({threshold: parameters.threshold});
    $.getJSON('contour_cloud/?' + query, (response) => {
        var in_contour = {
            x: response.x_axis,
            y: response.y_axis,
            z: response.inner_border,
            type: 'contour',
            name: 'Inner border',
            contours:{
                start: 0,
                end: 1,
                size: 1,
                coloring: 'lines'
            },
            colorscale: [[0, 'rgb(0,0,0)'], [1, 'rgb(0,0,0)']],
        };
        var out_contour = {
            x: response.x_axis,
            y: response.y_axis,
            z: response.outer_border,
            type: 'contour',
            name: 'Outer border',
            contours:{
                start: 0,
                end: 1,
                size: 1,
                coloring: 'lines'
            },
            colorscale: [[0, 'rgb(255,255,255)'], [1, 'rgb(255,255,255)']]
        };
        data = [in_contour, out_contour];
        Plotly.addTraces('chart', data);
    });
}

function showBoxes(){
    var query = doQuery() + '&' + $.param({threshold: parameters.threshold});
    $.getJSON('boxes_cloud/?' + query, (response) => {
        var lay = {};
        lay['shapes'] = [];
        for (var i = 0; i < response.boundaries_x.length; i++){
            var shape = {
                x0: response.boundaries_x[i][0],
                y0: response.boundaries_y[i][0],
                x1: response.boundaries_x[i][1],
                y1: response.boundaries_y[i][1],
                line: {
                    color: 'rgba(50, 171, 96, 1)'
                },
            };
            lay['shapes'].push(shape);
        }
        Plotly.relayout('chart', lay);
    });
}

function showVolume(data){
    var query = doQuery();
    var query2 = $.param({
        c1: data.points[0].x,
        c2: data.points[0].y,
        threshold: parameters.threshold,
    });
    query += '&' + query2;
    $.getJSON('click_volume_cloud/?' + query, (response) => {
        if (response.data != null){
            var lay = {};
            lay['annotations'] = []
            annotation = {
                text: 'Volume du nuage :' + response.data.toString(),
                x: data.points[0].x,
                y: data.points[0].y,
                font: {
                    color: '#ff0000'
                },
                arrowcolor: '#ff0000'
            };
            lay['annotations'].push(annotation)
            Plotly.relayout('chart', lay);
        }
    });
}

function doQuery(){
    if (parameters.scale) {
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

function boundsChangement(f1, f2){
    if (map_boundaries[parameters.map][0] != null){
        fieldsBehavior(true, f1, f2);
        controller_collection['taille_x'].max(map_boundaries[parameters.map][1] +
            Math.abs(map_boundaries[parameters.map][0]))
        controller_collection['taille_y'].max(map_boundaries[parameters.map][3] +
            Math.abs(map_boundaries[parameters.map][2]))

        controller_collection['bounds_position_x'].min(
            map_boundaries[parameters.map][0])
        controller_collection['bounds_position_x'].max(
            map_boundaries[parameters.map][1])
        controller_collection['bounds_position_y'].min(
            map_boundaries[parameters.map][2])
        controller_collection['bounds_position_y'].max(
            map_boundaries[parameters.map][3])

        controller_collection['taille'].max(Math.max(
            map_boundaries[parameters.map][1] +
            Math.abs(map_boundaries[parameters.map][0]),
            map_boundaries[parameters.map][3] +
            Math.abs(map_boundaries[parameters.map][2])
            )
        )

        if (controller_collection['taille_x'].getValue() >
            map_boundaries[parameters.map][1] +
            Math.abs(map_boundaries[parameters.map][0]))

                controller_collection['taille_x'].setValue(
                    map_boundaries[parameters.map][1])

        if (controller_collection['taille_y'].getValue() >
            map_boundaries[parameters.map][3] +
            Math.abs(map_boundaries[parameters.map][2]))

                controller_collection['taille_y'].setValue(
                    map_boundaries[parameters.map][3])

        if (controller_collection['bounds_position_x'].getValue() <
            map_boundaries[parameters.map][0])

                controller_collection['bounds_position_x'].setValue(
                    map_boundaries[parameters.map][0])
        
        if (controller_collection['bounds_position_x'].getValue() >
            map_boundaries[parameters.map][1])

                controller_collection['bounds_position_x'].setValue(
                    map_boundaries[parameters.map][1])
        
        if (controller_collection['bounds_position_y'].getValue() <
            map_boundaries[parameters.map][2])

                controller_collection['bounds_position_y'].setValue(
                    map_boundaries[parameters.map][2])
 
        if (controller_collection['bounds_position_y'].getValue() <
            map_boundaries[parameters.map][3])

                controller_collection['bounds_position_y'].setValue(
                    map_boundaries[parameters.map][3])
    
        controller_collection['bounds_position_x'].updateDisplay()
        controller_collection['bounds_position_y'].updateDisplay()
        controller_collection['altitude_bounds'].updateDisplay()
        controller_collection['time_bounds'].updateDisplay()

        parameters.using_sliders = true;
    } else {
        controller_collection['taille_x'].max(parameters.default_max)
        controller_collection['taille_y'].max(parameters.default_max)
        controller_collection['taille'].max(parameters.default_max)

        if (controller_collection['taille_x'].getValue() > parameters.default_max)
            controller_collection['taille_x'].setValue(parameters.default_max)

        if (controller_collection['taille_y'].getValue() > parameters.default_max)
            controller_collection['taille_y'].setValue(parameters.default_max)
        
        if (controller_collection['taille'].getValue() > parameters.default_max)
            controller_collection['taille'].setValue(parameters.default_max)
        
        controller_collection['position_x'].updateDisplay()
        controller_collection['position_y'].updateDisplay()
        controller_collection['altitude'].updateDisplay()
        controller_collection['time'].updateDisplay()
        
        fieldsBehavior(false, f1, f2);
        parameters.using_sliders = false;
    }
    controller_collection['taille_x'].updateDisplay()
    controller_collection['taille_y'].updateDisplay()
}

function clearLayout(){
    layout['shapes'] = [];
    layout['annotations'] = [];
}
