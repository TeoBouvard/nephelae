// Activate current menu in nav
document.getElementById('nav_simulation').className = 'active';
var camera, scene, renderer, controls;

$(document).ready(function(){
	init();
	animate();
	removeLoader();
});

function init() {

	// Cretate a Web GL renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );


	// Create a Camera
	var fov = 80; // Field of View
	var aspect = window.innerWidth / window.innerHeight;
	var near = 1; // the near clipping plane
	var far = 5000; // the far clipping plane
	camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
	camera.position.set(0, 0, 500);

	// Create a scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color('skyblue');

	// Create a floor mesh
	var geometry = new THREE.PlaneGeometry( 1000, 1000, 20, 20 );
	var material = new THREE.MeshBasicMaterial( { color: 0x808080, wireframe: true} );
	var floor = new THREE.Mesh( geometry, material );
	scene.add( floor );

	// Create a drone mesh
	var geometry = new THREE.PlaneGeometry( 1000, 1000, 20, 20 );
	var material = new THREE.MeshBasicMaterial( { color: 0x808080, wireframe: true} );
	var floor = new THREE.Mesh( geometry, material );
	scene.add( floor );

	// Add controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);

	var axesHelper = new THREE.AxesHelper( 500 );
	scene.add( axesHelper );

}

function animate() {

	requestAnimationFrame( animate );
	update();
	render();

}

function update(){

}

function render(){
	renderer.render( scene, camera );
}