// Activate current menu in nav
$('#nav_simulation').addClass('active');

var WIDTH = $('#canvas_container').width();
var HEIGHT = $('#canvas_container').height();

// Simulation elements
var camera, near, far, scene, renderer, controls, raycaster, mouse, plane_model;
var fleet = {};
var gui;
var then = new Date();

// Parameters
var parameters = {
	refresh_rate: 1000,
	trail_length: 20,
	fleet_visibility: true,
	fleet_focus: fitCameraToFleet,
}

$(document).ready(function(){
	setupGUI();
	init();
	removeLoader();
});

function setupGUI(){
	
    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

	var f1 = gui.addFolder('Controls');
	var f2 = gui.addFolder('Layers');

    f1.add(parameters, 'refresh_rate', 500, 3000).step(100).name('Delay (ms)');
    f1.add(parameters, 'trail_length', 0, 60).step(5).name('Trail');
	f1.add(parameters, 'fleet_focus').name('Focus on fleet');

	f2.add(parameters, 'fleet_visibility').onChange(toggleFleetVisibility).name('Fleet');

}

function init() {

	// Set default up vector to z axis
	THREE.Object3D.DefaultUp.set( 0, 0, 1 );

	createRenderer();

	createCamera();

	createScene();

	createControls();

	window.addEventListener( 'resize', onWindowResize, false );
	window.addEventListener( 'click', onClick, false );

	createFloor();

	createLights();

	createUavs();

	// start the animation loop
  	renderer.setAnimationLoop(() => {
		update();
		render();
  	});

}

function createRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(WIDTH, HEIGHT);
	$('#canvas_container').append( renderer.domElement );
}

function createCamera() {
	var fov = 60;
	var aspect = WIDTH / HEIGHT;
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
	console.log(camera)
	console.log(renderer)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2;
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
	light.position.set(100, 100, 10000);
	scene.add(light);
}

function createUavs() {

	var loader = new THREE.GLTFLoader();

	$.when(loader.load('models/glider.gltf', (gltf) => {
		plane_model = gltf.scene;
		plane_model.rotateX(Math.PI / 2)
		//plane_model.scale.set(0.5, 0.5, 0.5);
	}))
	.done( () => {

		$.getJSON('discover/', (response) => {

			// add +1 to trail_length so that zero performs a valid slice
			var query = $.param({uav_id: response.uavs, trail_length: parameters.trail_length+1, reality:false});

			$.getJSON('update/?' + query, (response) => {

				for (var key in response.positions){

					// Parse response data
					var uav_id = key;
					var uav_path = response.positions[key].path;
					var uav_position = uav_path.slice(-1)[0];
					var uav_altitude = uav_path.slice(-1)[0][2];
					var uav_heading = response.positions[key].heading;

					// Compute color of marker
					var uav_color = global_colors[key%global_colors.length];

					// Create a uav
					var uav_object = plane_model.clone();

					uav_object.position.set(uav_position[0], uav_position[1], uav_position[2]);
					uav_object.rotation.y = Math.PI - uav_heading.toRad();
					scene.add(uav_object);

					// Create a line
					var geometry = new THREE.Geometry();
					for(var position of uav_path){
						geometry.vertices.push(new THREE.Vector3(position[0], position[1], position[2]));	
					}

					var material = new THREE.LineDashedMaterial({ color: uav_color, linewidth: 2});
					var path_object = new THREE.Line( geometry, material );
					scene.add(path_object);

					// Update fleet dictionnary with discovered uav
					fleet[uav_id] = {
						uav: uav_object,
						last_heading: uav_heading.toRad(),
					};
				}
			
			// Focus on fleet
			fitCameraToFleet();

			});
		});
	});
}

function update(){

	var now = new Date();
	var elapsed_time = now - then;

	if (elapsed_time >= parameters.refresh_rate && then != null){

		// stop sending request while this one is processed 
		then = null;

		// add +1 to trail_length so that zero performs a valid slice
		var query = $.param({uav_id: Object.keys(fleet), trail_length: parameters.trail_length+1, reality: false});

		// Update uavs objects
		$.getJSON('update/?' + query, (response) => {

			if (parameters.fleet_visibility){
				
				for(var key in response.positions){

					// Parse response data
					var uav_id = key;
					var uav_path = response.positions[key].path;
					var uav_position = uav_path.slice(-1)[0];
                	var uav_altitude = uav_path.slice(-1)[0][2];
					var uav_heading = response.positions[key].heading;
					// Roll estimation, might come from message later
					var course_change = uav_heading.toRad() - fleet[key].last_heading;

					// Compute color of trail
					var uav_color = global_colors[key%global_colors.length];

					// Update uav object
					fleet[key].last_heading = uav_heading.toRad();
					fleet[key].uav.position.set(uav_position[0], uav_position[1], uav_position[2]);
					fleet[key].uav.rotation.y = Math.PI - uav_heading.toRad();
					fleet[key].uav.rotation.z = 0.5*course_change;
					fleet[key].uav.userData = {
						id: key,
						altitude: uav_altitude,
					}

					// Update path object by recreating trail vertices (updating does not work properly)
					scene.remove(fleet[key].path);

					if(parameters.trail_length > 0){
						var geometry = new THREE.Geometry();
						for(var position of uav_path){
							geometry.vertices.push(new THREE.Vector3(position[0], position[1], position[2]));	
						}
						var material = new THREE.LineDashedMaterial({ color: uav_color, linewidth: 2});
						var path_object = new THREE.Line( geometry, material );

						scene.add(path_object);
					}
				}
			}
			// restart sending requests
			then = new Date();
		});
	}
}

function render(){
	renderer.render(scene, camera);
}

function toggleFleetVisibility(){
	for(var key in fleet){
		fleet[key].uav.visible = !fleet[key].uav.visible;
		fleet[key].path.visible = !fleet[key].path.visible;
	}
}

function fitCameraToFleet(fitOffset = 1.5) {

	var box = new THREE.Box3();

	for(const key in fleet) box.expandByObject(fleet[key].uav);

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

	camera.near = distance / 100;
	camera.far = distance * 100;
	camera.updateProjectionMatrix();

	camera.position.copy(controls.target).sub(direction);

	controls.update();
}

/* EVENT LISTENERS */

function onWindowResize(){

	WIDTH = $('#canvas_container').width();
	HEIGHT = $('#canvas_container').height();
	
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();

    renderer.setSize( WIDTH, HEIGHT );
}

function onClick( event ) {
	
	// Compute mouse position in the canvas
    var rect = $('canvas')[0].getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
	mouse.x = ( x / WIDTH ) * 2 - 1;
	mouse.y = - ( y / HEIGHT ) * 2 + 1;

	// Create a list of intersectable objects
	var objects = [];
	for (var key in fleet){
		objects.push(fleet[key].uav);
	}

	// Update raycaster direction
    raycaster.setFromCamera( mouse, camera );

	// Raycast !
    var intersects = raycaster.intersectObjects( objects, true );

    if ( intersects.length > 0 ) {
        displayInfo(intersects);
    }
}

function displayInfo(data){
	console.log(data)
}