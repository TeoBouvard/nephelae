// Activate current menu in nav
document.getElementById('nav_simulation').className = 'active';

import Stats from './libs/Stats.js';

// Simulation elements
var camera, scene, renderer, controls, stats;

// Parameters
var refresh_rate = 1000;
var then = new Date()

$(document).ready(function(){
	init();
	removeLoader();
});

function init() {

	// Create a Web GL renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	// Create a Camera
	var fov = 80;
	var aspect = window.innerWidth / window.innerHeight;
	var near = 1;
	var far = 500;
	camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
	camera.position.set(0, 10, 20);

	// Create a scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x444444);

	// Add controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);

	// Create a floor mesh
	var geometry = new THREE.PlaneBufferGeometry( 1000, 1000, 50, 50 );
	var material = new THREE.MeshBasicMaterial( { color: 0xFFFFFF, wireframe: true} );
	var floor = new THREE.Mesh( geometry, material );
	floor.rotation.x = Math.PI / 2;
	scene.add( floor );

	stats = new Stats();
	//$('body').append( stats.dom );

	// Axes helper, to be removed
	var axesHelper = new THREE.AxesHelper( 500 );
	scene.add( axesHelper );

	// Create a directional light
	var light = new THREE.DirectionalLight( 0xffffff, 5.0 );
	light.position.set( 0, 500, 0 );

	// remember to add the light to the scene
	scene.add( light );

	// Create a drone
	var geometry = new THREE.SphereBufferGeometry( 1, 32, 32 );
	var material = new THREE.MeshStandardMaterial( {color: 0x156289} );
	var sphere = new THREE.Mesh( geometry, material );
	sphere.name = "drone"
	scene.add( sphere );






	// start the animation loop
  	renderer.setAnimationLoop( () => {
		stats.update();
		update();
		render();
  	});

}

function update(){
	var now = new Date();
	var elapsed_time = now - then;
	if (elapsed_time >= refresh_rate){
		then = now;
		$.getJSON('update/', (response) => {
			console.log(response);
		});

		console.log(scene.getObjectByName('drone').position.x);
		scene.getObjectByName('drone').position.x++;
	}
}

function render(){
	renderer.render( scene, camera );
}
