// Activate current menu in nav
$('#nav_raw_data').addClass('active');
var viewSocket = {};


var gui

// Chart style
var chart_height = 250;
var lm = 70;
var rm = 20;
var bm = 20;
var tm = 10;

var config = {
    responsive: true,
    displaylogo: false,
    displayModeBar: false,
};

// Parameters
var parameters = {
    trail_length: parseInt(Cookies.get('trail_length')), // seconds
    streaming: true,
    socket: null,
    uav_color: {},
    start_buff: 1,
    end_buff: 100,
}
var dataviewsParameters = {
    selected_view: null,
    views: {},
    gui_folder: null,
    gui_folder_items: {}
}

var alt_variable = 'ALT'

$(document).ready(() => {
    setSockets();
    setupGUI();
});

function setupGUI(){

    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').html(gui.domElement);

    var f1 = gui.addFolder('Real-Time');

    f1.add(parameters, 'trail_length', 10, 6000).step(10).name("Log length (s)").onFinishChange(updateData);

    var f2 = gui.addFolder('History');

    f2.add(parameters, 'start_buff').name("Start Buffer").onChange(updateData);
    f2.add(parameters, 'end_buff').name("End Buffer").onChange(updateData);
    fieldsBehavior(parameters.streaming, f1, f2);

    var f3 = gui.addFolder('UAVs');
    var f4 = gui.addFolder('Variables');

    $.getJSON('/discover/', (response) => {

        parameters['uavs'] = {};
        parameters['variables'] = {};

        for (var uav_id in response.uavs){
            parameters['uavs'][uav_id] = true;
            parameters['uav_color'][uav_id] = response.uavs[uav_id].gui_color;
            f3.add(parameters['uavs'], uav_id).name('UAV ' + uav_id).onChange(updateData);
        }

        for (var tag of response.sample_tags){
            parameters['variables'][tag] = true;
            f4.add(parameters['variables'], tag).name(tag).onChange((state) => toggleChart(state));
        }

        gui.add(parameters, 'streaming').name("Streaming").onChange(function(state) {
            fieldsBehavior(state, f1, f2);
            toggleStreaming(state);
        });
        
        // for changing filtering parameters on raw_data
        setupDataviewControl();


        // Draw charts once GUI is initialized
        toggleChart(true);
        updateData();
    });
}

function setupDataviewControl() {
    $.getJSON('/raw_data/get_dataviews_parameters/', (response) => {
        dataviewsParameters.views = response;
        dataviewsParameters.dataviewsNames = []
        for (let name in dataviewsParameters.views) {
            dataviewsParameters.dataviewsNames.push(name);
        }

        dataviewsParameters.gui_folder = gui.addFolder('Dataview Controls');
        if (dataviewsParameters.dataviewsNames.length == 0) {
            dataviewsParameters.dataviewsNames = 'No parameter views';
            dataviewsParameters.gui_folder
                .add(dataviewsParameters, 'dataviewsNames');
            return;
        }
        
        dataviewsParameters.selected_view = 
            dataviewsParameters.dataviewsNames[0];
        let item = dataviewsParameters.gui_folder
            .add(dataviewsParameters, 'selected_view', dataviewsParameters.dataviewsNames)
        item.onChange(updateDataviewControl);
        updateDataviewControl();
    });
}

function updateDataviewControl() {
    clearViewParameters();
    $.getJSON('/raw_data/get_dataviews_parameters/', (response) => {
        dataviewsParameters.views = response;

        let params = dataviewsParameters.views[dataviewsParameters.selected_view];
        for (let key in params) {
            let item = dataviewsParameters.gui_folder
                .add(dataviewsParameters.views[dataviewsParameters.selected_view],
                     key)
                .setValue(params[key]);
            dataviewsParameters.gui_folder_items[key] = item;
            item.onChange(function(){sendView(dataviewsParameters.selected_view);});
        }
    });
}

function clearViewParameters() {
    for (let key in dataviewsParameters.gui_folder_items) {
        dataviewsParameters.gui_folder.remove(
            dataviewsParameters.gui_folder_items[key])
        delete dataviewsParameters.gui_folder[key];
    }
}


function updateData(){

    var data = {};
    var query = makeQuery();
    $.getJSON('update/?' + query, (response) => {

        // Parse server response
        for (var uav_id in response.data){
            var timestamps = [];
            var altitudes = [];
            for (var variable_name in response.data[uav_id]){

                var positions = response.data[uav_id][variable_name]['positions'];

                timestamps = [];
                altitudes = [];
                // Compute timestamps from path
                for(var i = 0; i < positions.length ; i++){
                    timestamps.push(positions[i][0]);
                    altitudes.push(positions[i][3]);
                }

                var new_data = {
                    type: 'line',
                    name: uav_id,
                    x: timestamps,
                    y: response.data[uav_id][variable_name]['values'],
                    mode: 'line',
                    line: {
                        width: 1,
                        shape: 'linear',
                        color: parameters.uav_color[uav_id],
                    },
                    meta: [uav_id],
                    hovertemplate:
                    'Time : %{x:.1f}s <br>' +
                    'Value : %{y:.2f} <br>' +
                    '<extra>UAV %{meta[0]}</extra>',
                    hoverlabel: {
                        bgcolor: 'black',
                        bordercolor: 'black',
                        font: {family: 'Roboto', si1ze: '15', color: 'white'},
                        align: 'left',
                    }
                };
                variable_name in data ? data[variable_name].push(new_data) : data[variable_name] = [new_data];
            }
            var document_alt = document.getElementById(alt_variable);
            if (document_alt !== null && timestamps.length != 0){
                var new_data = {
                    type: 'line',
                    name: uav_id,
                    x: timestamps,
                    y: altitudes,
                    mode: 'line',
                    line: {
                        width: 1,
                        shape: 'linear',
                        color: parameters.uav_color[uav_id],
                    },
                    meta: [uav_id],
                    hovertemplate:
                    'Time : %{x:.1f}s <br>' +
                    'Value : %{y:.2f} <br>' +
                    '<extra>UAV %{meta[0]}</extra>',
                    hoverlabel: {
                        bgcolor: 'black',
                        bordercolor: 'black',
                        font: {family: 'Roboto', si1ze: '15', color: 'white'},
                        align: 'left',
                    }
                };
                alt_variable in data ? data[alt_variable].push(new_data) : data[alt_variable] = [new_data];
            }
        }

        // Update charts
        updateCharts(data);

        if (parameters.streaming && parameters.socket == null) {
            parameters.socket = new WebSocket('ws://' + 
                window.location.host + '/ws/sensor/raw_data/');
            parameters.socket.onmessage = (e) => handleMessage(JSON.parse(e.data));
        }

        removeLoader();
    });
}

function updateCharts(data){
    list_variables = getSelectedElements(parameters.variables)
    for (variable of list_variables){
        Plotly.react(variable, data[variable], printLayout(variable), config);
    }
    if (list_variables.length != 0)
        Plotly.react(alt_variable, data[alt_variable],
            printLayout(alt_variable), config);
}

function toggleStreaming(state){
    if (!state){
        parameters.socket.close();
        parameters.socket = null;
    }  
    updateData();
}

function toggleChart(state){
    // not 100% sure why this works
    for (variable in parameters.variables){
        if(state == parameters.variables[variable]){
            if (state){
                $('#charts').append(
                    '<div id="container_'+ variable + '" class="row">' +
                    '<div class="col s12">' +
                    '<div id=' + variable + '></div>' +
                    '</div>' +
                    '</div>'
                );
                updateData();
            } else {
                $('#container_' + variable).find('*').addBack().remove();
            }
        }
    }
    var setAlt = false;
    var list_keys = Object.keys(parameters.variables);
    for (var i = 0; i < list_keys.length && !setAlt; i++)
        setAlt = parameters.variables[list_keys[i]];
    if (setAlt){
        $('#charts').append(
            '<div id="container_' + alt_variable + '" class="row">' +
            '<div class="col s12">' +
            '<div id=' + alt_variable + '></div>' +
            '</div>' +
            '</div>');
        updateData();
    } else {
        $('#container_' + alt_variable).find('*').addBack().remove();
    }
}

function printLayout(variable){
    return layout = {
        yaxis: { title: createLayout(variable)['title'] },
        height: chart_height,
        margin: { l: lm, r: rm, b: bm, t: tm },
        hovermode: 'closest',
        showlegend: false,
        uirevision: true,
    };
}

function handleMessage(messages){

    //Reads the list of messages
    let dataUpdate = {};
    var tampon = undefined;
    let chart_alt = $('#'+alt_variable);
    for (let message of messages) {

        if (!(message.variable_name in parameters.variables)) {
            setupGUI();
            continue;
        }
        let chart = $('#'+ message.variable_name);

        let trace_index = getTraceIndexByName(chart, message.uav_id);
        if (trace_index < 0) {
            continue;
        }

        if (!(message.variable_name in dataUpdate)) {
            dataUpdate[message.variable_name] = {};
        }
        if (!(trace_index in dataUpdate[message.variable_name])) {
            dataUpdate[message.variable_name][trace_index] = {x:[[]], y:[[]]};
        }
        if (tampon === undefined)
            tampon = message.variable_name;
        dataUpdate[message.variable_name][trace_index].x[0].push(message.position[0]);
        dataUpdate[message.variable_name][trace_index].y[0].push(message.data[0]);

        if (tampon == message.variable_name){
            if (!(alt_variable in dataUpdate))
                dataUpdate[alt_variable] = {};
            var trace_index_alt = getTraceIndexByName(chart_alt, message.uav_id);

            if (!(trace_index_alt in dataUpdate[alt_variable]))
                dataUpdate[alt_variable][trace_index_alt] = {x:[[]], y:[[]]};

            dataUpdate[alt_variable][trace_index_alt].x[0].push(message.position[0]);
            dataUpdate[alt_variable][trace_index_alt].y[0].push(message.position[3]);
        }
    }

    for (let variable_name in dataUpdate) {
        // limiting length of data display (check if this works. It does. WHY ???)
        var document_data = document.getElementById(variable_name).data;
        if (document_data !== undefined){
            for (var i = 0; i < document_data.length; i++) {
                if (document_data[i].x.length < 1) {
                    continue;
                }
                let endTime = document_data[i].x[document_data[i].x.length - 1];
                while (endTime - document_data[i].x[0] > parameters.trail_length) {
                    document_data[i].x.shift();
                    document_data[i].y.shift();
                }
            }

            for (let trace_index in dataUpdate[variable_name]) {
                let tr_index = Number(trace_index);
                Plotly.extendTraces(variable_name,
                    dataUpdate[variable_name][tr_index],
                    [tr_index]);
            }
        }
    }
}

function getTraceIndexByName(chart, name){
    // find the index of the first trace in the chart with name 'name'
    return (chart[0] !== undefined && chart[0].data !== undefined ? 
        chart[0].data.findIndex(element => element.name == name) : -1);
}

function makeQuery(){
    return (parameters.streaming 
        ? 
        $.param({start: parameters.trail_length,
            variables: getSelectedElements(parameters.variables),
            uav_id: getSelectedElements(parameters.uavs)})
        :
        $.param({start: -parameters.start_buff,
            variables: getSelectedElements(parameters.variables),
            uav_id: getSelectedElements(parameters.uavs),
            step: 1,
            end: parameters.end_buff}));
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

function sendView(id){
    var query_dict = {view_id: id};
    for (key in dataviewsParameters.gui_folder_items){
        query_dict[key] = dataviewsParameters.gui_folder_items[key].getValue();
    }
    let query = $.param(query_dict);
    $.ajax({
        dataType: 'JSON',
        url: 'change_parameters_view/?' + query,
        success: function(){sendRefreshSignal(id, viewSocket);},
    });
}

function updateView(response){
    let id = dataviewsParameters.selected_view;
    var query = $.param({view_id: id});
    $.ajax({
        dataType: 'JSON',
        url: 'get_state_view/?' + query,
        success: function(d){
            dataviewsParameters.views[id] = d.parameters;
            updateData();
        },
    });
}

function setSockets(){
    viewSocket['type'] = refreshTypes.VIEW;
    viewSocket['socket'] = new WebSocket('ws://' + window.location.host +
        '/ws/refresh_notifier/' + viewSocket['type'] + '/');
    viewSocket['socket'].onmessage = (e) => updateView(JSON.parse(e.data));
}
