// Activate current menu in nav
document.getElementById('nav_simulation').className = 'active';

import Stats from './libs/Stats.js';

// Simulation elements
var camera, scene, renderer, controls, stats;
var drones = {};
var gui;

// Parameters
var parameters = {
	refresh_rate: 500
}
var then = new Date();

$(document).ready(function(){
	setupGUI();
	init();
	removeLoader();
});

function setupGUI(){
    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    gui.add(parameters, 'refresh_rate', 200, 3000);
    //gui.add(parameters, 'altitude', 0, 4000);
    //gui.add(parameters, 'trail_length', 0, 500);
}

function init() {

	// Create a Web GL renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas_div, antialias: true });
	renderer.setSize($('#canvas_div').width(), $('#canvas_div').height());

	// Create a camera
	var fov = 60;
	var aspect = $('#canvas_div').width() / $('#canvas_div').height();
	var near = 1;
	var far = 5000;
	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.set(50, 0, 20);

	// Create a scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color('white');
	scene.fog = new THREE.Fog('white', near, far);

	// Add controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);

	// load floor texture, set wrap mode to repeat
	var texture = new THREE.TextureLoader().load("textures/seamless_water.jpg" );
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set( 50, 60 );

	// Create a floor mesh
	var geometry = new THREE.PlaneBufferGeometry(10000, 10000, 1, 1);
	var material = new THREE.MeshMatcapMaterial({ map: texture });
	var floor = new THREE.Mesh(geometry, material);
	scene.add(floor);

	// Add performance stats
	stats = new Stats();
	$('#stats').append(stats.dom);

	// Create a directional light
	var light = new THREE.DirectionalLight('white', 2);
	light.position.set(100, 100, 1000);
	scene.add(light);


	// Create drones objects
	$.getJSON('update/', (response) => {

		for(var key in response.drones){

			// Parse response data
            var drone_id = key;
            var drone_position = response.drones[key].simulation_position;
            var drone_altitude = response.drones[key].altitude;
            //var drone_heading = response.drones[key].heading;
            //var drone_path = response.drones[key].path.slice(-length_slider.value);

            // Compute color and icon of markers, increment index_icon for next drone 
            var drone_color = global_colors[key%global_colors.length];

			// Create a drone
			var geometry = new THREE.SphereBufferGeometry(5, 32, 32);
			var material = new THREE.MeshStandardMaterial({color: drone_color});
			var object = new THREE.Mesh(geometry, material);

			object.name = key;
			object.position.set(drone_position[0], drone_position[1], drone_position[2]);

			scene.add(object);

			// Update drones dictionnary with discovered drone
            drones[drone_id] = {
                object : object,
            };
		}

		// Focus on drones
		fitCameraToSelection(camera, controls, drones);
	});


	// start the animation loop
  	renderer.setAnimationLoop(() => {
		stats.update();
		update();
		render();
  	});

}

function update(){

	var now = new Date();
	var elapsed_time = now - then;

	if (elapsed_time >= parameters.refresh_rate){
		then = now;

		// Update drones objects
		$.getJSON('update/', (response) => {

			for(var key in response.drones){

				// Parse response data
				var drone_id = key;
				var drone_position = response.drones[key].simulation_position;
				var drone_altitude = response.drones[key].altitude;
				//var drone_heading = response.drones[key].heading;
				//var drone_path = response.drones[key].path.slice(-length_slider.value);

				drones[key].object.position.set(drone_position[0], drone_position[1], drone_position[2]);
			}

		});
	}
}

function render(){
	renderer.render(scene, camera);
}

function fitCameraToSelection(camera, controls, selection, fitOffset = 1.2) {
  
  var box = new THREE.Box3();
  
  for(const key in selection) box.expandByObject(selection[key].object);
  
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  
  const maxSize = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);
  
  const direction = controls.target.clone()
    .sub(camera.position)
    .normalize()
    .multiplyScalar(distance);
  

  controls.maxDistance = distance * 5;
  controls.target.copy(center);
  controls.maxPolarAngle = Math.PI / 2; // -> compute floor angle
  
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();

  camera.position.copy(controls.target).sub(direction);
  
  controls.update();
}