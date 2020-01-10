// Activate current menu in nav
$("#nav_map").addClass('active');

var flight_map, zoom_home, overlays, location_popup;
var uavs_overlay;
var maps_parameters;

var marker_collection = {};
var box_collection = {};
var loaded_map = {};
var marker_followed = {}


const id = Date.now()

/*
    fleet     : { uav_id : value_dict }
    value_dict : { 
        color         :   global_colors[index_icon], 
        position      :   marker, 
        altitude      :   float, 
        heading       :   float,
        path          :   L.Polyline,
    }
*/

var fleet = {};
var bounds;
// Parameters
var parameters = {
    altitude: 600,          // meters
    trail_length: parseInt(Cookies.get('trail_length')),       // seconds
    thermals_cmap: 'seismic',
    clouds_cmap: 'Purples',
    transparent: true,
    tracked_uav: 'None',
    socket_uavs: null,
    socket_datacloud: null,
    socket_point: null,
    time: null,
    update_wind: updateWindData,
    display_data: true,
    origin: null,
    displayedTime: null,
    flight_area: null
}

// Initialization starts here
$(document).ready(setupGUI);

function setupGUI(){

    $.getJSON('/discover/', (response) => {

        parameters.origin      = response.origin;
        parameters.flight_area = L.latLngBounds(
            L.latLng(response.flight_area.upper_right),
            L.latLng(response.flight_area.lower_left));

        var tracked_uav_choices = ['None']
        for (var id in response.uavs)
            tracked_uav_choices.push(id);

        // Construct dat.gui
        var gui = new dat.GUI({ autoplace: false });
        $('#gui_container').append(gui.domElement);

        var min_altitude = 15;
        var max_altitude = 2000;

        // Setup GUI
        var f1 = gui.addFolder('Options');
        var f2 = gui.addFolder('Layer colors');

        f1.add(parameters, 'altitude', min_altitude, max_altitude)
            .step(1)
            .name('Altitude (m)')
            .onFinishChange(() => {track('None'); updateWindData();})
            .listen();
        f1.add(parameters, 'trail_length', 0, 500).step(1).name('Trail length (s)');
        f1.add(parameters, 'update_wind').name('Update wind');

        f2.add(parameters, 'thermals_cmap', ['seismic', 'viridis']).name('Thermals color');
        f2.add(parameters, 'clouds_cmap', ['Purples', 'viridis']).name('Clouds color');
        f2.add(parameters, 'transparent').name('Transparent');

        gui.add(parameters, 'tracked_uav', tracked_uav_choices);
        
        gui.add(parameters, 'display_data').name('Cloud data')
            .onChange(setSocketData);
        
        setSocketData();
        setSocketPoint();
        // Create map once sliders are initialized
        setupMap();
    });
}

function setupMap(){

    $.getJSON('/discover_maps/', (discovered_maps) => {

        // Map
        flight_map = L.map('map_container', {zoomControl: false, center: parameters.origin, zoom: 15, maxZoom: 18, minZoom: 13});
        flight_map.on('overlayadd', controller_callbackLoad);
        flight_map.on('overlayremove', controller_callbackLoad);
        flight_map.on('moveend', updateLayerBounds);
        // Home button
        zoomHome = L.Control.zoomHome();

        // Create layers
        var tiles_overlay_none = L.tileLayer('');
        var tiles_overlay_dark =  L.tileLayer( "http://{s}.sm.mapstack.stamen.com/"+"(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/"+"{z}/{x}/{y}.png");
        //var tiles_overlay_IGN = L.tileLayer('tile/{z}/{x}/{y}', {maxZoom : 18});
        //var key = "an7nvfzojv5wa96dsga5nk8w"
        var key = "pratique"
        var tiles_overlay_IGN = L.tileLayer(
                "https://wxs.ign.fr/"+key+"/geoportail/wmts?" +
                "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
                "&STYLE=normal" +
                "&TILEMATRIXSET=PM" +
                "&FORMAT=image/jpeg"+
                "&LAYER=ORTHOIMAGERY.ORTHOPHOTOS"+
                "&TILEMATRIX={z}" +
                "&TILEROW={y}" +
                "&TILECOL={x}",
            {
                minZoom : 13,
                maxZoom : 18,
                attribution : "IGN-F/Geoportail",
                tileSize : 256 // les tuiles du Géooportail font 256x256px
            }
        );
        var tiles_overlay_map_IGN = L.tileLayer(
                "https://wxs.ign.fr/"+key+"/geoportail/wmts?" +
                "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
                "&STYLE=normal" +
                "&TILEMATRIXSET=PM" +
                "&FORMAT=image/jpeg"+
                "&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS" +
                "&TILEMATRIX={z}" +
                "&TILEROW={y}" +
                "&TILECOL={x}",
            {
                minZoom : 13,
                maxZoom : 18,
                attribution : "IGN-F/Geoportail",
                tileSize : 256 // les tuiles du Géooportail font 256x256px
            }
        );

        path_overlay = L.layerGroup();
        uavs_overlay = L.layerGroup();

        // Set layer dictionnary for control initialization
        var base_layers = {
            "None": tiles_overlay_none,
            "Dark (online)": tiles_overlay_dark,
            "IGN (photos)": tiles_overlay_IGN,
            "IGN (maps)": tiles_overlay_map_IGN,
        };

        // Adding non-dynamically fetched maps
        overlays = {
            "UAVs": uavs_overlay,
        };

        maps_parameters  = discovered_maps;
        bounds = getCurrentBounds();
        var requested_map = computeMapUrl();
        for (var key in maps_parameters) {
            if (maps_parameters[key]['sample_size'] == 1) {
                overlays[maps_parameters[key]['name']] = L.imageOverlay(
                    maps_parameters[key]['url'] + '_img/?' + requested_map,
                    bounds);
            }
            if (maps_parameters[key]['sample_size'] == 2) {
                overlays[maps_parameters[key]['name']] = L.velocityLayer({
                    displayValues: true,
                    displayOptions: {
                        velocityType: "Wind",
                        displayEmptyString: "No wind data"
                    },
                    maxVelocity: 15
                });
            }
            maps_parameters[key]['lambda'] = closure_function(key);
        }

        // Add layers to the map
        var layers_controller = L.control.layers(base_layers, overlays, {position:
            'bottomright'}).addTo(flight_map);

        //for(key in overlays) if(key != "Wind") overlays[key].addTo(flight_map);

        // Display everything except vector field (wind) on initialization 
        overlays["UAVs"].addTo(flight_map);
        for (var key in maps_parameters) {
            if (maps_parameters[key]['sample_size'] == 1)
                overlays[maps_parameters[key]['name']].addTo(flight_map);
        }

        //tiles_overlay_IGN.addTo(flight_map);
        tiles_overlay_dark.addTo(flight_map);
        L.control.scale({
            maxWidth: 100,
            imperial: false}
        ).addTo(flight_map);
        L.marker(parameters.origin)
            .bindTooltip("Origin", {permanent: true, direction: 'right'})
            .addTo(flight_map);

        //display location on click
        location_popup = L.popup();
        flight_map.on('click', click_display_location);

        // Prevent async conflicts by displaying uavs once map is initialized
        displayUavs();

    });
}


// This function only exists to prevent closure problems in loop
// If anyone has a better solution, please help me
function closure_function(map){
    loaded_map[map] = false;
    return function(){
        waitForAllMaps(map);
    };
}

function waitForAllMaps(map){
    loaded_map[map] = true;
    var list_keys = Object.keys(loaded_map);
    var i = 0;
    var check = true;
    while(check && i < list_keys.length){
        check = loaded_map[list_keys[i]];
        i += 1;
    }
    if (check){
        parameters.displayedTime = parameters.time;
        updateMapsUrl(list_keys);
        for(var j =0; j < list_keys.length; j++){
            loaded_map[list_keys[j]] = false;
        }
    }
}

function displayUavs(){

    $.getJSON('/discover/', (response) => {

        parameters.origin = response.origin;
        parameters.uavs   = response.uavs;
        var uav_ids = []
        for (var id in response.uavs)
            uav_ids.push(id);

        // add +1 to trail_length so that zero performs a valid slice
        var query = $.param({uav_id: uav_ids, trail_length: parameters.trail_length+1, reality: true});

        $.getJSON('update/?' + query, (response) => {

            // Initialize uav array with uav_id and position marker
            for (var key in response.positions){

                // Parse response data
                var uav_id = key;
                var uav_path = response.positions[key].path;
                var uav_position = uav_path.slice(-1)[0];
                var uav_altitude = uav_path.slice(-1)[0][2];
                var uav_heading = response.positions[key].heading;
                var uav_speed = response.positions[key].speed;
                var uav_time = response.positions[key].time;

                // Compute color and icon of markers based on uav ID
                //console.log(parameters.uavs[key])
                var uav_color = parameters.uavs[key].gui_color
                // var uav_icon = global_icons[key%global_colors.length];
                var uav_icon = get_plane_icon(uav_color)

                // Create leaflet marker and polyline at uav position
                var marker = L.marker(uav_position, {icon: uav_icon}).bindTooltip("UAV " + key);
                var polyline = L.polyline([uav_path], {color : uav_color, weight : '2', dashArray : '5,7'});

                // Update fleet dictionnary with discovered uav
                fleet[uav_id] = {
                    id: uav_id,
                    color : uav_color, 
                    position : marker, 
                    altitude : uav_altitude, 
                    heading: uav_heading,
                    path : polyline,
                    time : uav_time,
                    speed : uav_speed,
                };

                // Add uav marker to layer group
                fleet[uav_id].position.setRotationAngle(uav_heading).addTo(uavs_overlay);
                fleet[uav_id].position.bindPopup(infosToString(fleet[uav_id]));
                fleet[uav_id].path.addTo(uavs_overlay);
            }

            // Center map on uav last uav added
            if(Object.keys(fleet).length != 0){
                flight_map.setView(uav_position, 15);
                zoomHome.addTo(flight_map);
                updateUavs();
            } else {
                alert("No UAVs detected, try launching the simulation and restart the server");
                updateUavs();
            }
            removeLoader();
        });
    });
}

function updateUavs(){

    // add +1 to trail_length so that zero performs a valid slice
    var query = $.param({uav_id: Object.keys(fleet), trail_length: parameters.trail_length+1, reality: true});
    $.when(
        // Request updated data from the server
        $.getJSON('update/?' + query, (response) => {
            // Parse response
            for (var key in response.positions){
                // Parse response data
                var uav_path = response.positions[key].path;
                var uav_position = uav_path.slice(-1)[0];
                var uav_altitude = uav_path.slice(-1)[0][2];
                var uav_heading = response.positions[key].heading;
                var uav_speed = response.positions[key].speed;
                var uav_time = response.positions[key].time;
                var uav_times = response.positions[key].times;
                // Identify corresponding uav ...
                var uav_to_update = fleet[key];
                // ... and update it
                if(uav_to_update){

                    // Update infos
                    uav_to_update.heading = uav_heading;
                    uav_to_update.speed = uav_speed;
                    uav_to_update.altitude = uav_altitude;
                    uav_to_update.time = uav_time;

                    // Update markers and popup
                    uav_to_update.position.setLatLng(uav_position).
                        setRotationAngle(uav_heading);
                    uav_to_update.position.
                        setPopupContent(infosToString(uav_to_update));
                    uav_to_update.path_data = uav_path;
                    // Update polyline
                    uav_to_update.path.setLatLngs(uav_path);

                    // Update time
                    uav_to_update.time = uav_time;
                    uav_to_update.times = uav_times;

                } 

                // ... or display error message if uav id does not match -> update fleet dictionnary and start tracking it
                else {
                    console.error("no uav with id ", key, " found !");
                    displayUavs();
                }
            }

            // Update home button coordinates and layers URL
            zoomHome.setHomeCoordinates(parameters.origin); // compute center of mass/getBoundsZoom later ?
            $(':checkbox').addClass('filled-in');
        })).done(function() {
            if (parameters.socket_uavs == null){
                parameters.socket_uavs = new WebSocket('ws://' + 
                    window.location.host + '/ws/GPS/');
                parameters.socket_uavs.onmessage = (e) =>
                    handleMessageUAV(JSON.parse(e.data))
            }
        });
}

function handleMessageUAV(message){
    var uav_to_update = fleet[message.uav_id];
    while(uav_to_update.times.length >= 0 &&
        message.time-uav_to_update.times[0] > parameters.trail_length){
        uav_to_update.times.shift();
        uav_to_update.path_data.shift();
    }
    uav_to_update.times.push(message.time);
    uav_to_update.path_data.push(message.position);
    uav_to_update.heading = message.heading;
    uav_to_update.speed = message.speed;
    uav_to_update.altitude = message.position[2];
    uav_to_update.time = message.time;

    uav_to_update.position.setLatLng(message.position).setRotationAngle(message.heading);
    uav_to_update.path.setLatLngs(uav_to_update.path_data);
    uav_to_update.position.setPopupContent(infosToString(uav_to_update));
}

function controller_callbackLoad(){
    for(var key in maps_parameters){
        // checks if map if currently displayed
        if(flight_map.hasLayer(overlays[maps_parameters[key]['name']])) {
            loaded_map[key] = false;
            overlays[maps_parameters[key]['name']].on('load', maps_parameters[key]['lambda'])
            loadMap(key);
        } else {
            overlays[maps_parameters[key]['name']].off('load');
            delete loaded_map[key];
            clearMarkers(key);
        }
    }
}

function loadMap(key){
    var requested_map = computeMapUrl();
    if(flight_map.hasLayer(overlays[maps_parameters[key]['name']])) {
            if(maps_parameters[key]['sample_size'] == 1)
                overlays[maps_parameters[key]['name']].setUrl(
                    maps_parameters[key]['url'] + '_img/?' + requested_map);
            else
                $.getJSON('wind/?' + requested_map, (response) => {
                    overlays[maps_parameters[key]['name']].setData(response);
                });
    }
}

function updateMapsUrl(list_keys){
    var requested_map = computeMapUrl();
    for(var key of list_keys){
        if(flight_map.hasLayer(overlays[maps_parameters[key]['name']])) {
            if(maps_parameters[key]['sample_size'] == 1)
                overlays[maps_parameters[key]['name']].setUrl(
                    maps_parameters[key]['url'] + '_img/?' + requested_map);
            else
                $.getJSON('wind/?' + requested_map, (response) => {
                    overlays[maps_parameters[key]['name']].setData(response);
                });
        }
    }
}

function updateWindData() {
    var requested_map = computeMapUrl();
    for(var key in maps_parameters) {
        if(flight_map.hasLayer(overlays[maps_parameters[key]['name']])) { // checks if map if currently displayed
            if(maps_parameters[key]['sample_size'] == 2) {
                $.getJSON(maps_parameters[key]['url'] + '_wind/?' + requested_map, (response) => {
                    overlays[maps_parameters[key]['name']].setData(response);
                });
            }
        }
    }
}

function computeMapUrl(){
    // Check if a uav is being tracked with MesoNH
    if (parameters.tracked_uav != null && parameters.tracked_uav != 'None'){
        parameters.altitude = fleet[parameters.tracked_uav].altitude;
        parameters.time     = fleet[parameters.tracked_uav].time;
    } else {
        parameters.time = Object.keys(fleet).length > 0 ? fleet[Object.keys(fleet)[0]].time : new Date().getSeconds();
    }
    // Build query with parameters
    var query = $.param({
        altitude: parameters.altitude,
        time: parameters.time,
        map_bounds: {
            west: bounds.getWest(),
            east: bounds.getEast(),
            south: bounds.getSouth(),
            north: bounds.getNorth()
        },
        origin: parameters.origin,
        thermals_cmap: parameters.thermals_cmap,
        clouds_cmap: parameters.clouds_cmap,
        transparent: parameters.transparent,
        id: id,
    });
    return query;
}

function getCurrentBounds(){
    var screen_bounds = flight_map.getBounds();
    var south_bound, east_bound, west_bound, north_bound;
    var flight_area = parameters.flight_area

    if(screen_bounds.getSouth() >= flight_area.getSouth())
        south_bound = screen_bounds.getSouth();
    else
        south_bound = flight_area.getSouth();

    if(screen_bounds.getNorth() <= flight_area.getNorth())
        north_bound = screen_bounds.getNorth();
    else
        north_bound = flight_area.getNorth();

    if(screen_bounds.getEast() <= flight_area.getEast())
        east_bound = screen_bounds.getEast();
    else
        east_bound = flight_area.getEast();

    if(screen_bounds.getWest() >= flight_area.getWest())
        west_bound = screen_bounds.getWest();
    else
        west_bound = flight_area.getWest();
    return L.latLngBounds(
        L.latLng([north_bound, east_bound]),
        L.latLng([south_bound, west_bound])
    );
}

// Print HTML formatted string so that it can be added to marker popup
function infosToString(uav){
    var infos = '<p style="font-family:Roboto-Light;font-size:14px">';

    infos += '<b> UAV ' + uav.id + ' </b><br><br>' ;
    infos += 'Altitude : ' + uav.altitude.toFixed(1) + 'm<br> ';
    infos += 'Heading : ' + uav.heading.toFixed(0) + '° <br> ';
    infos += 'Speed : ' + uav.speed.toFixed(1) + ' m/s <br><br>';
    infos += '<a onClick="track(' + uav.id + ');" class="btn"><span class="white-text"><b>Follow UAV</b></span></a></p>'

    return infos;
}

function updateLayerBounds(){
    bounds = getCurrentBounds();
    for(var key in maps_parameters) {
        if(maps_parameters[key]['sample_size'] == 1)
            overlays[maps_parameters[key]['name']].setBounds(bounds);
    }
}


// Attach or remove tracked uav in parameters
function track(id){
    parameters.tracked_uav = id
}

function click_display_location(e) {
    ////alert("You clicked the map at " + e.latlng);
    //latlon_to_local(e.latlng);
    // console.log(e);
    var query = $.param({
        lat: e.latlng.lat,
        lon: e.latlng.lng
    });
    dropdown = '<select id="dropdown_uav_id" class="browser-default">';
    for (var uav_id in fleet){
        dropdown += '<option>' + uav_id + '</option>';
    }
    dropdown += '</select>';
    $.getJSON('/latlon_to_local/?' + query, (local) => {
        x = local.x;
        y = local.y;
        lat = e.latlng.lat;
        lng = e.latlng.lng;
        location_popup
            .setLatLng(e.latlng)
            .setContent("Local: " + local.x.toFixed(2) + ", " + local.y.toFixed(2) +
                        "<br>LatLon: " + e.latlng.lat.toFixed(4) + ", " + e.latlng.lng.toFixed(4) +
                        "<br><br> Follow with UAV: " + dropdown +
                        '<a onClick="generateMarker('+x+','+y+','+lat+','+lng+');" class="btn">' +
                        '<span class="white-text"><b>Choose Center</b></span>' +
                        '</a></p>')
            .openOn(flight_map);
    });
}

function generateMarker(x,y,lat,lng){
    if (parameters.displayedTime && Object.keys(loaded_map).length !== 0){
        var uav_selected = document.getElementById('dropdown_uav_id').value;
        coordinates = {'x':x, 'y':y, 'lat':lat, 'lng':lng,
            't':parameters.displayedTime};
        if (uav_selected in marker_followed && marker_followed[uav_selected]
            !== undefined){
            marker_followed[uav_selected].setLatLng([coordinates.lat,
                coordinates.lng]);
        } else {
            marker_followed[uav_selected] = L.circleMarker(
                [coordinates.lat, coordinates.lng],
                {color: parameters.uavs[uav_selected].gui_color})
                .on('click', function(){
                    var query = $.param({'uav_id': uav_selected});
                    $.getJSON('remove_marker_to_uav/?' + query, function(){
                        flight_map.removeLayer(marker_followed[uav_selected]);
                        delete marker_followed[uav_selected];
                    })
                });
            marker_followed[uav_selected].addTo(flight_map);
        }
        sendMarkerToUAV(uav_selected, coordinates);
    }
}

function sendMarkerToUAV(uav_selected, coordinates){
    var query = $.param({
        'x': coordinates.x,
        'y': coordinates.y,
        't': coordinates.t,
        'uav_id': uav_selected
    });
    $.getJSON('send_marker_to_uav/?' + query)
}

function updateMarker(message){
    marker_followed[message.id].setLatLng([message.lat, message.lng]);
}

function showCloudData(message){
    var variable = Object.keys(message);
    clearMarkers(variable);
    for (data in message[variable]){
        box = L.rectangle([[message[variable][data].box_latlon[0][0],
                            message[variable][data].box_latlon[1][1]],
                            [message[variable][data].box_latlon[1][0],
                            message[variable][data].box_latlon[0][1]]],
            {color: '#FF0000'})
            .addTo(flight_map);
        marker = L.circleMarker([message[variable][data]
            .center_of_mass_latlon[0], message[variable][data]
            .center_of_mass_latlon[1]]).addTo(flight_map);
        box_collection[variable].push(box);
        marker_collection[variable].push(marker);
    }
}

function clearMarkers(variable_name){
    if (variable_name in marker_collection)
        for (var i = 0; i < marker_collection[variable_name].length; i++)
            flight_map.removeLayer(marker_collection[variable_name][i]);
    if (variable_name in box_collection)
        for (var i = 0; i < box_collection[variable_name].length; i++)
            flight_map.removeLayer(box_collection[variable_name][i]);

    marker_collection[variable_name] = [];
    box_collection[variable_name] = [];
}

function setSocketData(){
    if (!parameters.socket_datacloud && parameters.display_data){
        parameters.socket_datacloud = new WebSocket('ws://' + 
            window.location.host + '/ws/sensor/cloud_data/' + id + '/');
        parameters.socket_datacloud.onmessage = (e) => showCloudData(JSON.parse(e.data));
    } else if (parameters.socket_datacloud && !parameters.display_data){
        parameters.socket_datacloud.close();
        parameters.socket_datacloud = null;
        for (key in maps_parameters)
            clearMarkers(key);
    }
}

function setSocketPoint(){
    parameters.socket_point = new WebSocket('ws://' + 
        window.location.host + '/ws/sensor/point/' + id + '/');
    parameters.socket_point.onmessage = (e) => updateMarker(JSON.parse(e.data));
}
