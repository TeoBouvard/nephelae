// Activate current menu in nav
$("#nav_map").addClass('active');

var flight_map, zoom_home, overlays;
var uavs_overlay;
var maps_parameters;

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

// Parameters
var parameters = {
    refresh_rate: parseInt(Cookies.get('refresh_rate')),     // milliseconds
    altitude: 600,          // meters
    trail_length: parseInt(Cookies.get('trail_length')),       // seconds
    thermals_cmap: 'seismic',
    clouds_cmap: 'Purples',
    transparent: true,
    tracked_uav: 'None',
    time: null,
    update_wind: updateWindData,
    dl_map: downloadMap,

    origin: [43.46, 1.27] // used to compute layer images
}

// Initialization starts here
$(document).ready(setupGUI);

function setupGUI(){

    $.getJSON('/discover/', (response) => {
   
    
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
    var f3 = gui.addFolder('Tools');

    f1.add(parameters, 'refresh_rate', 500, 3000).step(100).name('Delay (ms)');
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

    f3.add(parameters, 'dl_map').name('Download IGN map');
    gui.add(parameters, 'tracked_uav', tracked_uav_choices);

    // Create map once sliders are initialized
    setupMap();
    });
}


function setupMap(){

    $.getJSON('/discover_maps/', (discovered_maps) => {

    // Map
    flight_map = L.map('map_container', {zoomControl: false, center: parameters.origin, zoom: 15, maxZoom: 18, minZoom: 13});
    flight_map.on('moveend', updateLayerBounds);

    // Home button
    zoomHome = L.Control.zoomHome();

    // Create layers
    var tiles_overlay_none = L.tileLayer('');
    var tiles_overlay_dark =  L.tileLayer( "http://{s}.sm.mapstack.stamen.com/"+"(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/"+"{z}/{x}/{y}.png");
    var tiles_overlay_IGN = L.tileLayer('tile/{z}/{x}/{y}', {maxZoom : 18});

    path_overlay = L.layerGroup();
    uavs_overlay = L.layerGroup();

    // Set layer dictionnary for control initialization
    var base_layers = {
        "None": tiles_overlay_none,
        "Dark (online)": tiles_overlay_dark,
        "IGN": tiles_overlay_IGN,
    };

    // Adding non-dynamically fetched maps
    overlays = {
        "UAVs": uavs_overlay,
    };

    maps_parameters  = discovered_maps;
    map_is_displayed = {};
    for (var key in maps_parameters) {
        if (maps_parameters[key]['sample_size'] == 1)
            overlays[maps_parameters[key]['name']] = L.imageOverlay(maps_parameters[key]['url'] + '_img/?' + computeMapUrl(), flight_map.getBounds());
        if (maps_parameters[key]['sample_size'] == 2) {
            overlays[maps_parameters[key]['name']] = L.velocityLayer({
                displayValues: true,
                displayOptions: {
                    velocityType: "Wind",
                    displayEmptyString: "No wind data"
                },
                maxVelocity: 15
            });
            console.log(overlays[maps_parameters[key]['name']])
        }
    }

    // Add layers to the map
    L.control.layers(base_layers, overlays, {position: 'bottomright'}).addTo(flight_map);

    //for(key in overlays) if(key != "Wind") overlays[key].addTo(flight_map);

    // Display everything except vector field (wind) on initialization 
    overlays["UAVs"].addTo(flight_map);
    for (var key in maps_parameters) {
        if (maps_parameters[key]['sample_size'] == 1)
            overlays[maps_parameters[key]['name']].addTo(flight_map);
    }

    tiles_overlay_IGN.addTo(flight_map);

    // Prevent async conflicts by displaying uavs once map is initialized
    displayUavs();

    });
}

function displayUavs(){

    $.getJSON('/discover/', (response) => {
        
        parameters.origin = response.origin;
        parameters.uavs   = response.uavs
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
                uav_to_update.position.setLatLng(uav_position).setRotationAngle(uav_heading);
                uav_to_update.position.setPopupContent(infosToString(uav_to_update));

                // Update polyline
                uav_to_update.path.setLatLngs(uav_path);

                // Update time
                uav_to_update.time = uav_time;
            } 

            // ... or display error message if uav id does not match -> update fleet dictionnary and start tracking it
            else {
                console.error("no uav with id ", key, " found !");
                displayUavs();
            }
        }

        // Update home button coordinates and layers URL
        zoomHome.setHomeCoordinates(parameters.origin); // compute center of mass/getBoundsZoom later ?
        updateMapsUrl();
        setTimeout(updateUavs, parameters.refresh_rate);
    });
    
}

function updateLayerBounds(){

    for(var key in maps_parameters) {
        if(maps_parameters[key]['sample_size'] == 1)
            overlays[maps_parameters[key]['name']].setBounds(flight_map.getBounds());
    }
    
    updateMapsUrl();
    updateWindData();

    // Change checkbox style dynamically (fucking materialize framework)
    $(':checkbox').addClass('filled-in');
}

function updateMapsUrl(){
    for(var key in maps_parameters) {
        if(flight_map.hasLayer(overlays[maps_parameters[key]['name']])) { // checks if map if currently displayed
            if(maps_parameters[key]['sample_size'] == 1) {
                overlays[maps_parameters[key]['name']].setUrl(maps_parameters[key]['url'] + '_img/?'+ computeMapUrl());
            }

            // Wind map actualization disabled because particles are reset each time. Not good for epilepsy.

            //if(maps_parameters[key]['sample_size'] == 2) {
            //    $.getJSON('wind/?' + computeMapUrl(), (response) => {
            //        overlays[maps_parameters[key]['name']].setData(response);
            //    });
            //}
        }
    }
}

function updateWindData() {
    for(var key in maps_parameters) {
        if(flight_map.hasLayer(overlays[maps_parameters[key]['name']])) { // checks if map if currently displayed
            if(maps_parameters[key]['sample_size'] == 2) {
                $.getJSON(maps_parameters[key]['url'] + '_wind/?' + computeMapUrl(), (response) => {
                    overlays[maps_parameters[key]['name']].setData(response);
                });
            }
        }
    }
}


function computeMapUrl(){

    var bounds = flight_map.getBounds();

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
    });

    return query;
}

// Print HTML formatted string so that it can be added to marker popup
function infosToString(uav){
    var infos = '<p style="font-family:Roboto-Light;font-size:14px">';

    infos += '<b> UAV ' + uav.id + ' </b><br><br>' ;
    infos += 'Altitude : ' + uav.altitude.toFixed(1) + 'm<br> ';
    infos += 'Heading : ' + uav.heading.toFixed(0) + '° <br> ';
    infos += 'Speed : ' + uav.speed.toFixed(1) + ' m/s <br><br>';
    infos += '<a onClick="track(' + uav.id + ');" class="btn"><span class="white-text"><b>Sync MesoNH</b></span></a></p>'

    return infos;
}

// Attach or remove tracked uav in parameters
function track(id){
    parameters.tracked_uav = id
}

function downloadMap(){
    $.get('dl_map/?' + computeMapUrl());
    // automatically reload the page in 30 seconds to fetch downloaded map tiles (not conventional)
    setTimeout(window.location.reload.bind(window.location), 30000);
}
