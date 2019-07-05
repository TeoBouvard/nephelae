// Activate current menu in nav
document.getElementById('nav_simulation').className = 'active';
var camera, scene, renderer, controls;

init();
animate();
removeLoader();

function init() {

    renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0xA9A9A9 );
	document.body.appendChild( renderer.domElement );

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.set(0, 0, 500);


	scene = new THREE.Scene();

	var geometry = new THREE.PlaneGeometry( 1000, 1000, 20, 20 );
	var material = new THREE.MeshBasicMaterial( { color: 0x808080, wireframe: true} );
	var floor = new THREE.Mesh( geometry, material );
	floor.material.side = THREE.DoubleSide;
	scene.add( floor );

    controls = new THREE.OrbitControls(camera, renderer.domElement);

}

function animate() {

	requestAnimationFrame( animate );
	renderer.render( scene, camera );

}