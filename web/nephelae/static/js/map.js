// Activate current menu in nav
$("#nav_map").addClass('active');

var flight_map, zoom_home, overlays;
var uavs_overlay, cloud_overlay, wind_overlay;

/*
    fleet     : { drone_id : value_dict }
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
    refresh_rate: 1000,     // milliseconds
    altitude: 600,          // meters
    trail_length: 60,       // seconds
    thermals_cmap: 'viridis',
    clouds_cmap: 'viridis',
    transparent: true,
    tracked_drone: undefined,
    time: undefined,
    update_wind: updateWindData,

    origin: [43.46, 1.27] // used to compute layer images
}

// Initialization starts here
$(document).ready(setupGUI);

function setupGUI(){

    // Construct dat.gui
    var gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    // Get sliders range
    $.getJSON('box/', (response) => {
        
        // Parse response
        var min_altitude = Math.ceil(response[1].min);
        var max_altitude = Math.floor(response[1].max);

        // Setup GUI
        var f1 = gui.addFolder('Options');
        var f2 = gui.addFolder('Layer colors');

        f1.add(parameters, 'refresh_rate', 200, 3000).step(100).name('Delay (ms)');
        f1.add(parameters, 'altitude', min_altitude, max_altitude)
            .step(1)
            .name('Altitude (m)')
            .onChange(() => {track(-1); updateWindData();})
            .listen();
        f1.add(parameters, 'trail_length', 0, 500).step(1).name('Trail length (s)');
        f1.add(parameters, 'update_wind').name('Update wind');

        f2.add(parameters, 'thermals_cmap', ['Reds', 'viridis']).name('Thermals color');
        f2.add(parameters, 'clouds_cmap', ['Purples', 'viridis']).name('Clouds color');
        f2.add(parameters, 'transparent').name('Transparent');

        // Once sliders are initialized -> create map
        setupMap();
    });
}


function setupMap(){

    // Map
    flight_map = L.map('map_container', {zoomControl: false, center: parameters.origin, zoom: 15, maxZoom: 18, minZoom: 12});
    flight_map.on('moveend', updateLayerBounds);

    // Home button
    zoomHome = L.Control.zoomHome();

    // Create layers
    var tiles_overlay_none = L.tileLayer('');
    var tiles_overlay_dark =  L.tileLayer( "http://{s}.sm.mapstack.stamen.com/"+"(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/"+"{z}/{x}/{y}.png");
    var tiles_overlay_IGN = L.tileLayer('tile/{z}/{x}/{y}', {maxZoom : 15});

    path_overlay = L.layerGroup();
    uavs_overlay = L.layerGroup();

    cloud_overlay = L.imageOverlay('clouds_img/?' + computeURL(), flight_map.getBounds());
    thermals_overlay = L.imageOverlay('thermals_img/?' + computeURL(), flight_map.getBounds());

    wind_overlay = L.velocityLayer({
        displayValues: true,
        displayOptions: {
            velocityType: "Wind",
            displayEmptyString: "No wind data"
        },
        maxVelocity: 15
    });

    // Set layer dictionnary for control initialization
    var base_layers = {
        "None": tiles_overlay_none,
        "Dark, Online": tiles_overlay_dark,
        "IGN": tiles_overlay_IGN,
    };

    overlays = {
        "UAVs": uavs_overlay,
        "Clouds": cloud_overlay,
        "Thermals": thermals_overlay,
        "Wind": wind_overlay,
    };

    // Add layers to the map
    L.control.layers(base_layers, overlays, {position: 'bottomright'}).addTo(flight_map);

    // Display everything on initialization
    for(key in overlays) overlays[key].addTo(flight_map);
    tiles_overlay_dark.addTo(flight_map);

    // Prevent async conflicts by displaying drones once map is initialized
    displayDrones();
}

function displayDrones(){

    $.getJSON('discover/', (response) => {
        
        parameters.origin = response.origin;
        
        // add +1 to trail_length so that zero performs a valid slice
        var query = $.param({uav_id: response.uavs, trail_length: parameters.trail_length+1});

        $.getJSON('update/?' + query, (response) => {

            // Initialize drone array with drone_id and position marker
            for (var key in response.positions){

                // Parse response data
                var drone_id = key;
                var drone_path = response.positions[key].path;
                var drone_position = drone_path.slice(-1)[0];
                var drone_altitude = drone_path.slice(-1)[0][2];
                var drone_heading = response.positions[key].heading;
                var drone_speed = response.positions[key].speed;
                var drone_time = response.positions[key].time;
                
                // Compute color and icon of markers based on drone ID
                var drone_color = global_colors[key%global_colors.length];
                var drone_icon = global_icons[key%global_colors.length];
                
                // Create leaflet marker and polyline at drone position
                var marker = L.marker(drone_position, {icon: drone_icon}).bindTooltip("UAV " + key);
                var polyline = L.polyline([drone_path], {color : drone_color, weight : '2', dashArray : '5,7'});
                
                // Update fleet dictionnary with discovered drone
                fleet[drone_id] = ({
                    id: drone_id,
                    color : drone_color, 
                    position : marker, 
                    altitude : drone_altitude, 
                    heading: drone_heading,
                    path : polyline,
                    time : drone_time
                });

                // Add drone marker to layer group
                fleet[drone_id].position.setRotationAngle(drone_heading).addTo(uavs_overlay);
                fleet[drone_id].position.bindPopup(infosToString(drone_id, drone_altitude, drone_heading), {autoClose: false});
                fleet[drone_id].path.addTo(uavs_overlay);
            }
            
            // Center map on drone last drone added
            if(Object.keys(fleet).length != 0){
                flight_map.setView(drone_position, 15);
                zoomHome.addTo(flight_map);
                updateDrones();
            } else {
                alert("No drones detected, try launching the simulation and restart the server");
                updateDrones();
            }
            removeLoader();

        });
    });
}

function updateDrones(){

    // add +1 to trail_length so that zero performs a valid slice
    var query = $.param({uav_id: Object.keys(fleet), trail_length: parameters.trail_length+1});

    // Request updated data from the server
    $.getJSON('update/?' + query, (response) => {

        // Parse response
        for (var key in response.positions){

            // Parse response data
            var drone_id = key;
            var drone_path = response.positions[key].path;
            var drone_position = drone_path.slice(-1)[0];
            var drone_altitude = drone_path.slice(-1)[0][2];
            var drone_heading = response.positions[key].heading;
            var drone_speed = response.positions[key].speed;
            var drone_time = response.positions[key].time;

            // Identify corresponding drone ...
            var drone_to_update = fleet[drone_id];

            // ... and update it
            if(drone_to_update){

                // Update infos
                drone_to_update.heading = drone_heading;
                drone_to_update.speed = drone_speed;
                drone_to_update.altitude = drone_altitude;
                drone_to_update.time = drone_time;

                // Update markers
                drone_to_update.position.setLatLng(drone_position).setRotationAngle(drone_heading);
                drone_to_update.position.setPopupContent(infosToString(drone_to_update));

                // Update polyline
                drone_to_update.path.setLatLngs(drone_path);

                // Update time
                drone_to_update.time = drone_time;

            } 
            // ... or display error message if drone id does not match -> update fleet dictionnary and start tracking it
            else {
                console.error("no drone with id ", drone_id, " found !");
                initializeDrones();
            }
        }

        // Update home button coordinates and layers URL
        zoomHome.setHomeCoordinates(parameters.origin); // compute center of mass/getBoundsZoom later ?
        updateURL();
        setTimeout(updateDrones, parameters.refresh_rate);
    });

}

function updateURL(){
    cloud_overlay.setUrl('clouds_img/?'+ computeURL());
    thermals_overlay.setUrl('thermals_img/?'+ computeURL());

}

function updateLayerBounds(){
    cloud_overlay.setBounds(flight_map.getBounds());
    thermals_overlay.setBounds(flight_map.getBounds());
    
    updateURL();
    updateWindData();

    // Change checkbox style dynamically (fucking materialize framework)
    $(':checkbox').addClass('filled-in');
}

function computeURL(){

    var bounds = flight_map.getBounds();

    // Check if a drone is being tracked with MesoNH
    if (parameters.tracked_drone != undefined){
        parameters.altitude = parameters.tracked_drone.altitude;
        parameters.time = parameters.tracked_drone.time;
    } else {
        parameters.time = Object.keys(fleet).length > 0 ? fleet[Object.keys(fleet)[0]].time : 0;;
    }

    // Build query with parameters
    var query = $.param({
        altitude: parameters.altitude,
        time: parameters.time%715,
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
    var infos = '<p style="text-align:center;font-family:Roboto-Light;font-size:14px">';

    infos += '<b>UAV ' + uav.id + ' </b><br> ' ;
    infos += uav.altitude + 'm <br> ';
    infos += uav.heading + '° <br> ';
    infos += uav.speed + ' m/s <br>';
    infos += '<a onClick="track(' + uav.id + ');" class="btn"><span class="white-text"><b>Follow with MesoNH</b></span></a></p>'

    return infos;
}

// Attach or remove tracked uav in parameters
function track(id){
    if (id == -1){
        parameters.tracked_drone = undefined;
    } else {
        parameters.tracked_drone = fleet[id];
    }
}

function updateWindData() {

    // Request updated data from the server
    $.getJSON('wind/?' + computeURL(), (response) => {
        wind_overlay.setData(response);
    });
}
