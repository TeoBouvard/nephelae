// Activate current menu in nav
$('#nav_simulation').addClass('active');

// Simulation elements
var camera, near, far, scene, renderer, controls, stats;
var fleet = {};
var gui;
var then = new Date();

// Parameters
var parameters = {
	refresh_rate: 500,
	trail_length: 60,
	drone_visibility: true,
}

$(document).ready(function(){
	setupGUI();
	init();
	removeLoader();
});

function setupGUI(){
    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

	var f1 = gui.addFolder('Parameters');
	var f2 = gui.addFolder('Layers');

    f1.add(parameters, 'refresh_rate', 100, 3000).step(100).name('Delay (ms)');
    f1.add(parameters, 'trail_length', 0, 500).name('Trail');

	var fleet_toggle = f2.add(parameters, 'drone_visibility').name('Fleet');

	fleet_toggle.onChange(toggleFleetVisibility);

	f2.open();
}

function init() {

	// Set default up vector to z axis
	THREE.Object3D.DefaultUp.set( 0, 0, 1 );

	createRenderer();

	createCamera();

	createScene();

	createControls();

	window.addEventListener( 'resize', onWindowResize, false );

	createFloor();

	createLights();

	createDrones();


	// start the animation loop
  	renderer.setAnimationLoop(() => {
		update();
		render();
  	});

}

function createRenderer() {
	// why is canvas size bigger than container ?
    renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize($('#canvas_container').width() - 15, $('#canvas_container').height());
	$('#canvas_container').append( renderer.domElement );
}

function createCamera() {
	var fov = 60;
	var aspect = $('#canvas_container').width() / $('#canvas_container').height();
	near = 1;
	far = 5000;
	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.set(50, 0, 20);
}

function createScene() {
	scene = new THREE.Scene();
	scene.background = new THREE.Color('rgb(32,32,32)');
	scene.fog = new THREE.Fog('rgb(32,32,32)', near, far);
}

function createControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
}

function createFloor() {
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
}

function createLights() {
	// Create a directional light
	var light = new THREE.DirectionalLight('white', 2);
	light.position.set(100, 100, 1000);
	scene.add(light);
}

function createDrones() {

	$.getJSON('update/', (response) => {

		for(var key in response.drones){

			// Parse response data
            var drone_id = key;
            var drone_position = response.drones[key].simulation_position;
            var drone_altitude = response.drones[key].altitude;
        	var drone_path = response.drones[key].simulation_path.slice(-parameters.trail_length-1);
			drone_path.push(drone_position);

            // Compute color of marker
            var drone_color = global_colors[key%global_colors.length];

			// Create a drone
			var geometry = new THREE.SphereBufferGeometry(5, 32, 32);
			var material = new THREE.MeshStandardMaterial({color: drone_color});
			var drone_object = new THREE.Mesh(geometry, material);
;
			drone_object.position.set(drone_position[0], drone_position[1], drone_position[2]);
			scene.add(drone_object);

			// Create a line
			var geometry = new THREE.Geometry();
			for(var position in drone_path){
				var point = drone_path[position];
				geometry.vertices.push(new THREE.Vector3(point[0], point[1], point[2]));	
			}

			var material = new THREE.LineDashedMaterial({ color: drone_color, linewidth: 2});
			var path_object = new THREE.Line( geometry, material );
			scene.add(path_object);

			// Update fleet dictionnary with discovered drone
            fleet[drone_id] = {
                drone: drone_object,
				path: path_object
            };

		}
		// Focus on fleet
		fitCameraToSelection(camera, controls, fleet);
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
				var drone_path = response.drones[key].simulation_path.slice(-parameters.trail_length-1);
				drone_path.push(drone_position);

				// Compute color of marker
            	var drone_color = global_colors[key%global_colors.length];

				// Update drone position
				fleet[key].drone.position.set(drone_position[0], drone_position[1], drone_position[2]);

				// Recreate trail vertices (updating did not work properly)
				scene.remove(fleet[key].path);

				var geometry = new THREE.Geometry();
				for(var position in drone_path){
					var point = drone_path[position];
					geometry.vertices.push(new THREE.Vector3(point[0], point[1], point[2]));	
				}

				var material = new THREE.LineDashedMaterial({ color: drone_color, linewidth: 2});
	
				var path_object = new THREE.Line( geometry, material );

				scene.add(path_object);
				fleet[key].path = path_object;

			}
		});
	}
}

function render(){
	renderer.render(scene, camera);
}

function toggleFleetVisibility(){
	for(var key in fleet){
		fleet[key].drone.visible = !fleet[key].drone.visible;
		fleet[key].path.visible = !fleet[key].path.visible;
	}
}

function fitCameraToSelection(camera, controls, selection, fitOffset = 1.2) {

	var box = new THREE.Box3();

	for(const key in selection) box.expandByObject(selection[key].drone);

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
	//controls.maxPolarAngle = Math.PI / 2; // -> compute floor angle

	camera.near = distance / 100;
	camera.far = distance * 100;
	camera.updateProjectionMatrix();

	camera.position.copy(controls.target).sub(direction);

	controls.update();
}

function onWindowResize(){

    camera.aspect = $('#canvas_container').width() / $('#canvas_container').height();
    camera.updateProjectionMatrix();

    renderer.setSize( $('#canvas_container').width(), $('#canvas_container').height() );

}