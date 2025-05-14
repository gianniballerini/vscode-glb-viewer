const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

function activate(context) {
	let disposable = vscode.commands.registerCommand('extension.viewGLB', (uri) => {
		const panel = vscode.window.createWebviewPanel(
			'glbViewer',
			`GLB Viewer - ${path.basename(uri.fsPath)}`,
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(path.dirname(uri.fsPath))]
			}
		);

		const modelUri = panel.webview.asWebviewUri(vscode.Uri.file(uri.fsPath));

		panel.webview.html = getWebviewContent(modelUri.toString());
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent(modelUri) {
	return `
	  <!DOCTYPE html>
	  <html lang="en">
	  <head>
		<meta charset="UTF-8">
		<title>GLB Viewer</title>
		<style>
		  	body, html {
				margin: 0; padding: 0;
				width: 100vw; height: 100vh;
				overflow: hidden;
				display: flex;
			}
			#tree {
				width: 250px;
				height: 100%;
				overflow-y: auto;
				background: #f5f5f5;
				border-right: 1px solid #ccc;
				font-family: monospace;
				padding: 10px;
				box-sizing: border-box;
			}
			#viewer {
				flex-grow: 1;
				display: block;
			}
			.tree-node {
				cursor: pointer;
				margin-left: 1em;
			}
		  canvas { width: 100vw; height: 100vh; display: block; }
		</style>
	  </head>
	  <body>
		<div id="tree"></div>
		<canvas id="viewer"></canvas>
		<script type="importmap">
		  {
			"imports": {
			  "three": "https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.module.js",
			  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.149.0/examples/jsm/",
			  "three/examples/jsm/": "https://cdn.jsdelivr.net/npm/three@0.149.0/examples/jsm/"
			}
		  }
		</script>
		<script type="module">
			import * as THREE from 'three';
			import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
			import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
			const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('viewer'), antialias: true });
			renderer.setSize(window.innerWidth, window.innerHeight);

			const light = new THREE.HemisphereLight(0xffffff, 0x444444);
			light.position.set(0, 200, 0);
			scene.add(light);

			const controls = new OrbitControls(camera, renderer.domElement);
			controls.update();

			const loader = new GLTFLoader();
			loader.load("${modelUri}", function (gltf) {
				console.log("GLB loaded", gltf);
				scene.add(gltf.scene);

				const box = new THREE.Box3().setFromObject(gltf.scene);
				const size = box.getSize(new THREE.Vector3()).length();
				const center = box.getCenter(new THREE.Vector3());

				camera.position.copy(center);
				camera.position.z += size * 1.5;
				camera.lookAt(center);

				renderer.setClearColor(0xeeeeee, 1); // Light gray background

				const grid = new THREE.GridHelper(10, 10);
				scene.add(grid);

				animate();
			}, undefined, function (error) {
				console.error(error);
			});

			camera.position.z = 2;

			function animate() {
				requestAnimationFrame(animate);
				controls.update();
				renderer.render(scene, camera);
			}

			window.addEventListener('resize', () => {
				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();
				renderer.setSize(window.innerWidth, window.innerHeight);
			});
		</script>
	  </body>
	  </html>
	`;
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
};
