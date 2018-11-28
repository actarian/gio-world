/* global window, document, console, THREE, TweenLite, TweenMax, Elastic */

(function() {
	'use strict';

	var cities = [
		[43.9096538, 12.8399805],
		[41.8519772, 12.2347364],
		[51.5287718, -0.2416791],
		[40.6976637, -74.1197623]
	];

	var renderer = new THREE.WebGLRenderer({
		alpha: true,
		antialias: true
	});
	renderer.shadowMap.enabled = true;
	renderer.setSize(window.innerWidth, window.innerHeight);
	var canvas = document.querySelector('#canvas');
	canvas.appendChild(renderer.domElement);
	var scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x000000, 0.1); // new THREE.Fog(0x000000, 0, 10);

	var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100);
	camera.position.set(0, 1.0, 2.0);
	camera.up = new THREE.Vector3(0, 0, -1);
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	var ambient = new THREE.AmbientLight(0x222222);
	scene.add(ambient);

	var directional1;
	directional1 = new THREE.DirectionalLight(0xe0e0e0, 0.8);
	directional1.position.set(0, 2, 0.5);
	directional1.castShadow = true;
	directional1.shadowCameraVisible = true;
	directional1.shadowMapWidth = directional1.shadowMapHeight = 2048;
	scene.add(directional1);

	var directional2 = new THREE.DirectionalLight(0xe0e0e0, 0.4);
	directional2.position.set(0, -2, 0);
	scene.add(directional2);

	var particleRef = new THREE.Vector3(0.0, 0.0, 1.0);
	// var shadow = addShadow(scene);
	var world = addWorld(scene);
	var particles = addParticles(world);

	onWindowResize();
	play();

	window.addEventListener('resize', onWindowResize, false);

	function createSprite() {
		var canvas = document.createElement('canvas');
		canvas.width = 128;
		canvas.height = 128;
		var ctx = canvas.getContext('2d');
		var gradient = ctx.createRadialGradient(
			canvas.width / 2,
			canvas.height / 2,
			0,
			canvas.width / 2,
			canvas.height / 2,
			canvas.width / 2
		);
		gradient.addColorStop(0, 'rgba(255,255,255,1)');
		gradient.addColorStop(0.2, 'rgba(255,255,255,1)');
		gradient.addColorStop(0.22, 'rgba(255,255,255,.2)');
		gradient.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		return canvas;
	}

	function addShadow(parent) {
		var geometry = new THREE.PlaneGeometry(100, 100);
		geometry.rotateX(-Math.PI / 4);
		var material = new THREE.ShadowMaterial();
		material.opacity = 0.2;
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.z = -0.6;
		mesh.receiveShadow = true;
		parent.add(mesh);
		return mesh;
	}

	function addWorld(parent) {
		var geometry = new THREE.SphereGeometry(0.5, 64, 64);
		var material = new THREE.MeshStandardMaterial({
			color: '#fff',
			transparent: true,
			opacity: 0.85,
			roughness: 0.65,
			metalness: 0.6,
			map: THREE.ImageUtils.loadTexture('world/img/world-texture.gif'),
		});
		var mesh = new THREE.Mesh(geometry, material);
		mesh.castShadow = true;
		mesh.receiveShadow = false;
		mesh.rotation.y = Math.PI * 1.2;
		parent.add(mesh);
		return mesh;
	}

	function addCities(parent) {
		var meshes = new Array(10).fill(0).map(function(x, i) {
			var geometry = new THREE.SphereGeometry(0.005, 20, 20);
			var material = new THREE.MeshStandardMaterial({
				color: new THREE.Color('red')
			});
			var mesh = new THREE.Mesh(geometry, material);
			return mesh;
		}).forEach(function(mesh, i) {
			var latlon = cities[Math.floor(Math.random() * cities.length)];
			var point = calcPosFromLatLonRad(latlon[0], latlon[1], 0.5);
			mesh.position.set(point.x, point.y, point.z);
			parent.add(mesh);
		});
		return meshes;
	}

	function addParticles(parent) {
		var texture = new THREE.CanvasTexture(createSprite());
		var geometry = new THREE.Geometry();
		var material = new THREE.PointsMaterial({
			size: 0.07,
			map: texture,
			vertexColors: THREE.VertexColors,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true
		});
		var particles = new THREE.Points(geometry, material);
		var points = cities.map(function(x) {
			return calcPosFromLatLonRad(x[0], x[1], 0.5);
		}).forEach(function(point, i) {
			var vertex = new THREE.Vector3();
			vertex.x = point.x;
			vertex.y = point.y;
			vertex.z = point.z;
			geometry.vertices.push(vertex);
			geometry.colors.push(new THREE.Color(0, 0, 0));
		});
		geometry.mergeVertices();
		geometry.verticesNeedUpdate = true;
		particles.geometry = geometry;
		parent.add(particles);
		return particles;
	}

	function onWindowResize() {
		var size = {
			width: 0,
			height: 0,
			aspect: 0,
		};
		size.width = canvas.offsetWidth;
		size.height = canvas.offsetHeight;
		size.aspect = size.width / size.height;
		if (renderer) {
			renderer.setSize(size.width, size.height);
		}
		if (camera) {
			camera.aspect = size.aspect;
			camera.updateProjectionMatrix();
		}
	}

	function render(delta) {
		world.rotation.y += 0.002;
		particles.geometry.vertices.forEach(function(vertex, i) {
			var local = world.localToWorld(vertex.clone());
			var distance = local.distanceTo(particleRef);
			var s = Math.max(0, Math.min(1, (1 - distance))) * 5;
			particles.geometry.colors[i] = new THREE.Color(s, s, s);
			particles.geometry.colorsNeedUpdate = true;
		});
		renderer.render(scene, camera);
	}

	function calcPosFromLatLonRad(lat, lon, radius) {
		var phi = (90 - lat) * (Math.PI / 180);
		var theta = (lon + 180) * (Math.PI / 180);
		var x = -((radius) * Math.sin(phi) * Math.cos(theta));
		var z = ((radius) * Math.sin(phi) * Math.sin(theta));
		var y = ((radius) * Math.cos(phi));
		return new THREE.Vector3(x, y, z);
	}

	function play() {
		var clock = new THREE.Clock();

		function loop(time) {
			var delta = clock.getDelta();
			render(delta);
			window.requestAnimationFrame(loop);
		}
		loop();
	}

}());
