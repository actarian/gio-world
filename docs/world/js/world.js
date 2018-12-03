/* global window, document, console, THREE, TweenLite, TweenMax, Elastic */

(function() {
	'use strict';

	function DragListener(target, downCallback, moveCallback, upCallback) {
		this.target = target || document;
		this.downCallback = downCallback || function(e) {
			console.log('DragListener.downCallback not setted', e);
		};
		this.moveCallback = moveCallback || function(e) {
			console.log('DragListener.moveCallback not setted', e);
		};
		this.upCallback = upCallback || function(e) {
			console.log('DragListener.upCallback not setted', e);
		};
		this.dragging = false;
		this.init();
	}

	DragListener.prototype = {
		init: function() {
			this.onMouseDown = this.onMouseDown.bind(this);
			this.onMouseMove = this.onMouseMove.bind(this);
			this.onMouseUp = this.onMouseUp.bind(this);
			this.onTouchStart = this.onTouchStart.bind(this);
			this.onTouchMove = this.onTouchMove.bind(this);
			this.onTouchEnd = this.onTouchEnd.bind(this);
			this.target.addEventListener('mousedown', this.onMouseDown, false);
			this.target.addEventListener('touchstart', this.onTouchStart, false);
		},
		// events
		onDown: function(down) {
			this.down = down; // this.position ? { x: down.x - this.position.x, y: down.y - this.position.y } : down;
			this.strength = { x: 0, y: 0 };
			this.distance = this.distance || { x: 0, y: 0 };
			this.speed = { x: 0, y: 0 };
			this.downCallback(this);
		},
		onDrag: function(position) {
			this.dragging = true;
			var target = this.target;
			var distance = { x: position.x - this.down.x, y: position.y - this.down.y };
			var strength = { x: distance.x / window.innerWidth * 2, y: distance.y / window.innerHeight * 2 };
			var speed = { x: this.speed.x + (strength.x - this.strength.x) * 0.1, y: this.speed.y + (strength.y - this.strength.y) * 0.1 };
			this.position = position;
			this.distance = distance;
			this.strength = strength;
			this.speed = speed;
			this.moveCallback({
				position: position,
				distance: distance,
				strength: strength,
				speed: speed,
				target: target,
			});
		},
		onUp: function() {
			this.dragging = false;
			this.upCallback(this);
		},
		// mouse
		onMouseDown: function(e) {
			this.target.removeEventListener('touchstart', this.onTouchStart);
			this.onDown({
				x: e.clientX,
				y: e.clientY
			});
			this.addMouseListeners();
		},
		onMouseMove: function(e) {
			this.onDrag({
				x: e.clientX,
				y: e.clientY
			});
		},
		onMouseUp: function(e) {
			this.removeMouseListeners();
			this.onDrag({
				x: e.clientX,
				y: e.clientY
			});
			this.onUp();
		},
		// touch
		onTouchStart: function(e) {
			this.target.removeEventListener('mousedown', this.onMouseDown);
			if (e.touches.length > 1) {
				e.preventDefault();
				this.onDown({
					x: e.touches[0].pageX,
					y: e.touches[0].pageY
				});
				this.addTouchListeners();
			}
		},
		onTouchMove: function(e) {
			if (e.touches.length > 0) {
				e.preventDefault();
				this.onDrag({
					x: e.touches[0].pageX,
					y: e.touches[0].pageY
				});
			}
		},
		onTouchEnd: function(e) {
			this.removeTouchListeners();
			this.onDrag(this.position);
			this.onUp();
		},
		//
		addMouseListeners: function() {
			document.addEventListener('mousemove', this.onMouseMove, false);
			document.addEventListener('mouseup', this.onMouseUp, false);
		},
		addTouchListeners: function() {
			document.addEventListener('touchend', this.onTouchEnd, false);
			document.addEventListener('touchmove', this.onTouchMove, false);
		},
		removeMouseListeners: function() {
			document.removeEventListener('mousemove', this.onMouseMove);
			document.removeEventListener('mouseup', this.onMouseUp);
		},
		removeTouchListeners: function() {
			document.removeEventListener('touchend', this.onTouchEnd);
			document.removeEventListener('touchmove', this.onTouchMove);
		},
	};

	window.DragListener = DragListener;

}());

/* global window, document, console, THREE, TweenLite, TweenMax, Elastic */

(function() {
	'use strict';

	var worldTexture;

	var loader = new THREE.TextureLoader();
	loader.crossOrigin = '';
	loader.load('world/img/world-texture.gif', function(texture) {
		// texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		// texture.repeat.set(2, 2);
		worldTexture = texture;
		createScene();
	});

	function createScene() {

		document.querySelector('.world').setAttribute('class', 'world init');

		var cities = [
			[43.9096538, 12.8399805], // pesaro
			[41.8519772, 12.2347364], // rome
			[51.5287718, -0.2416791], // london
			[55.6713812, 12.4537393], // copenaghen
			[40.6976637, -74.1197623], // new york
			[19.3911668, -99.4238221], // mexico city
			[39.9390731, 116.11726], // beijing
			[31.2243084, 120.9162376], // shangai
		];

		var mouse = { x: 0, y: 0 },
			parallax = { x: 0, y: 0 };

		var renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true
		});
		renderer.shadowMap.enabled = true;
		renderer.setSize(window.innerWidth, window.innerHeight);

		var title = document.querySelector('.world > .title');
		var shadow = document.querySelector('.world > .shadow');
		var canvas = document.querySelector('.world > .canvas');
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
		THREE.Euler.prototype.add = function(euler) {
			this.set(this.x + euler.x, this.y + euler.y, this.z + euler.z, this.order);
			return this;
		};
		var worldRotation = new THREE.Euler(0.0, Math.PI * 1.2, 0.0, 'XYZ');
		var worldDragRotation = new THREE.Euler(0, 0, 0, 'XYZ');
		var worldStartDragRotation = new THREE.Euler(0, 0, 0, 'XYZ');
		var worldSpeedRotation = new THREE.Euler(0, 0, 0, 'XYZ');
		var world = addWorld(scene, worldRotation, worldTexture);
		var particles = addParticles(world);

		window.addEventListener('resize', onWindowResize, false);
		document.addEventListener('mousemove', onMouseMove, false);

		var dragListener = new DragListener(canvas, function(e) {
			worldStartDragRotation.copy(worldDragRotation);
		}, function(e) {
			worldDragRotation.copy(worldStartDragRotation).add(new THREE.Euler(0, Math.PI * e.strength.x, 0, 'XYZ'));
			worldSpeedRotation.set(0, 0, 0, 'XYZ');
		}, function(e) {
			worldSpeedRotation.set(0, Math.PI * e.speed.x, 0, 'XYZ');
		});

		play();
		onWindowResize();

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

		function addWorld(parent, rotation, texture) {
			var geometry = new THREE.SphereGeometry(0.5, 48, 48);
			// var geometry2 = new THREE.IcosahedronGeometry(0.5, 4);
			// console.log(geometry2.vertices.length, geometry.vertices.length);
			var material = new THREE.MeshStandardMaterial({
				color: '#fff',
				transparent: true,
				opacity: 0.85,
				roughness: 0.65,
				metalness: 0.6,
				map: texture,
			});
			var mesh = new THREE.Mesh(geometry, material);
			mesh.castShadow = true;
			mesh.receiveShadow = false;
			mesh.rotation.set(rotation.x, rotation.y, rotation.z);
			parent.add(mesh);
			return mesh;
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

		function onMouseMove(e) {
			var w2 = window.innerWidth / 2;
			var h2 = window.innerHeight / 2;
			mouse = {
				x: (e.clientX - w2) / w2,
				y: (e.clientY - h2) / h2,
			};
			// console.log('onMouseMove', mouse);
		}

		function doParallax() {
			// parallax
			parallax.x += (mouse.x - parallax.x) / 8;
			parallax.y += (mouse.y - parallax.y) / 8;
			//
			var titleXy = {
				x: -50 + 0.5 * -parallax.x,
				y: -50 + 0.5 * -parallax.y,
			};
			TweenLite.set(title, {
				transform: 'translateX(' + titleXy.x + '%) translateY(' + titleXy.y + '%)'
			});
			var shadowXy = {
				x: -50 + 3 * -parallax.x,
				y: -50 + 3 * -parallax.y,
			};
			TweenLite.set(shadow, {
				transform: 'translateX(' + shadowXy.x + '%) translateY(' + shadowXy.y + '%)'
			});
			directional1.position.set(parallax.x * 0.3, 2 + parallax.y * 0.3, 0.5);
			directional2.position.set(parallax.x * 0.3, -2 + parallax.y * 0.3, 0);
		}

		function render(delta) {
			if (!dragListener.dragging) {
				worldRotation.y += worldSpeedRotation.y;
				worldSpeedRotation.y += (0.002 - worldSpeedRotation.y) / 50;
			}
			world.rotation.copy(worldRotation).add(worldDragRotation);
			particles.geometry.vertices.forEach(function(vertex, i) {
				var local = world.localToWorld(vertex.clone());
				var distance = local.distanceTo(particleRef);
				var s = Math.max(0, Math.min(1, (1 - distance))) * 5;
				particles.geometry.colors[i] = new THREE.Color(s, s, s);
				particles.geometry.colorsNeedUpdate = true;
			});
			renderer.render(scene, camera);
			doParallax();
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

	}

}());
