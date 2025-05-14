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
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>GLB Viewer</title>
	<style>
		body, html {
			--background-color: #252526;
			--background-color-alt: #444444;
			--text-color: #CCCCCC;

			margin: 0; padding: 0;
			width: 100vw; height: 100vh;
			overflow: hidden;
			display: flex;
		}
		.container {
			position: relative;
			display: flex;
			width: 100%;
			height: 100%;
		}
		.hidden {
			display: none;
		}
		.faded {
			opacity: 0;
			transition: opacity 0.3s ease-in-out;
		}
		.tree-container {
			position: absolute;
			top: 10px;
			left: 10px;
			z-index: 10;
			display: flex;
			flex-direction: column;
			background: var(--background-color);
			color: var(--text-color);
			border-right: 1px solid var(--text-color);
			max-height: 50%;
			width: fit-content;
			overflow-y: auto;
			border: 1px solid var(--text-color);
		}
		.tree-header {
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--background-color);
			cursor: move;
			padding: 5px;
			}
		.tree-header:hover {
			box-shadow: 0 0 8px rgba(0,0,0,0.2);
			// border-bottom: 1px solid var(--text-color);
			background: var(--background-color-alt);
		}
		.tree {
			color: var(--text-color);
			background: var(--background-color);
			font-family: monospace;
			padding: 10px;
			box-sizing: border-box;
			height: 100%;
			width: 200px;
		}
		.tree-node {
			cursor: pointer;
			padding: 5px;
		}
		.splitter {
			position: absolute;
			top: 0;
			right: 0;
			height: 100%;
			width: 16px;

			display: flex;
			align-items: center;
			justify-content: center;

			cursor: col-resize;
			background: var(--background-color);
			color: var(--text-color);
			border-left: 1px solid var(--text-color);

			opacity: 0;
			transition: opacity 0.3s ease-in-out;

			svg {
				width: 12px;
				height: 12px;
			}
		}

		.splitter:hover {
			background: var(--background-color-alt);
			opacity: 1;
		}

		.details {
			position: absolute;
			top: 10px;
			right: 10px;
			z-index: 10;

			background: var(--background-color);
			color: var(--text-color);
			font-family: monospace;
			box-sizing: border-box;
			border: 1px solid var(--text-color);
		}
		.details__header {
			padding: 10px 10px 5px 10px;
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			cursor: move;
		}
		.details__header-title {
			font-size: 14px;
			font-weight: bold;
		}
		.details__header-message {
			transition: opacity 0.3s ease-in-out;
		}
		.details__close {
			cursor: pointer;
			color: var(--text-color);
			height: 16px;
			svg {
				width: 16px;
				height: 16px;
			}
		}
		.details__content {
			display: flex;
			flex-direction: column;
			padding: 10px;
			max-height: 200px;
			overflow-y: auto;
		}
		.details__item {
			display: flex;
			flex-direction: row;
			gap: 5px;
			padding: 5px;
		}
		.details__item:hover {
			background-color: var(--background-color-alt);
			cursor: pointer;
		}
		.viewer {
			flex-grow: 1;
			display: block;
		}
		canvas { width: 100%; height: 100%; display: block; }
	</style>
</head>
<body>
	<div class="container">
		<div class="tree-container">
			<div class="tree-header">
				Hierarchy
			</div>
			<div class="tree"></div>
			<div class="splitter">
				<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M15 9V7h2v2h-2zm2 6v-2h-4v-2h4V9h2v2h2v2h-2v2h-2zm0 0v2h-2v-2h2zm-6-4v2H7v2H5v-2H3v-2h2V9h2v2h4zm-4 4h2v2H7v-2zm2-8v2H7V7h2z" fill="currentColor"/> </svg>
			</div>
		</div>
		<div class="details hidden">
			<div class="details__header">
				<div class="details__header-title">
					Details
				</div>
				<div class="details__header-message faded">
					Copied to clipboard
				</div>
				<div class="details__close">
					<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M5 5h2v2H5V5zm4 4H7V7h2v2zm2 2H9V9h2v2zm2 0h-2v2H9v2H7v2H5v2h2v-2h2v-2h2v-2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2zm2-2v2h-2V9h2zm2-2v2h-2V7h2zm0 0V5h2v2h-2z" fill="currentColor"/> </svg>
				</div>
			</div>
			<div class="details__content">
			</div>
		</div>
		<canvas class="viewer"></canvas>
	</div>
	<script type="importmap">
		{
			"imports": {
				"three": "https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.module.js",
				"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.149.0/examples/jsm/",
				"three/examples/jsm/": "https://cdn.jsdelivr.net/npm/three@0.149.0/examples/jsm/"
			}
		}
	</script>
	<script>
		const $tree = document.querySelector('.tree');
		const $splitter = document.querySelector('.splitter');
		const $treeHeader = document.querySelector('.tree-header');
		const $treeContainer = document.querySelector('.tree-container');
		const $detailsContainer = document.querySelector('.details');
		const $detailsHeader = document.querySelector('.details__header');
		let isDragging = false;
		let isDraggingDetails = false;
		let offsetX, offsetY;
		let offsetXDetails, offsetYDetails;
		let isResizing = false;
		let initialX = 0;

		$treeHeader.addEventListener('mousedown', (e) => {
			isDragging = true;
			document.body.style.cursor = 'move';
			offsetX = e.clientX - $treeContainer.offsetLeft;
			offsetY = e.clientY - $treeContainer.offsetTop;
		});

		$detailsHeader.addEventListener('mousedown', (e) => {
			isDraggingDetails = true;
			document.body.style.cursor = 'move';
			offsetXDetails = e.clientX - $detailsContainer.offsetLeft;
			offsetYDetails = e.clientY - $detailsContainer.offsetTop;
		});

		$splitter.addEventListener('mousedown', (e) => {
			isResizing = true;
			document.body.style.cursor = 'col-resize';
			initialX = e.clientX;
		});

		document.addEventListener('mousemove', (e) => {
			if (isResizing) {
				const newWidth = e.clientX;
				if (newWidth > 100 && newWidth < window.innerWidth - 100) {
					$tree.style.width = newWidth + 'px';
				}
			}
			if (isDragging) {
				const newX = e.clientX - offsetX;
				const newY = e.clientY - offsetY;

				// Keep the container within window bounds
				const maxX = window.innerWidth - $treeContainer.offsetWidth;
				const maxY = window.innerHeight - $treeContainer.offsetHeight;

				$treeContainer.style.left = Math.min(Math.max(0, newX), maxX) + 'px';
				$treeContainer.style.top = Math.min(Math.max(0, newY), maxY) + 'px';
			}

			if (isDraggingDetails) {
				const newX = e.clientX - offsetXDetails;
				const newY = e.clientY - offsetYDetails;

				const maxX = window.innerWidth - $detailsContainer.offsetWidth;
				const maxY = window.innerHeight - $detailsContainer.offsetHeight;

				$detailsContainer.style.right = (window.innerWidth - Math.min(Math.max(0, newX), maxX) - $detailsContainer.offsetWidth) + 'px';
				$detailsContainer.style.top = Math.min(Math.max(0, newY), maxY) + 'px';
			}
		});

		document.addEventListener('mouseup', () => {
			isResizing = false;
			isDragging = false;
			isDraggingDetails = false;
			document.body.style.cursor = 'default';
		});
	</script>
	<script type="module">
		import * as THREE from 'three';
		import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
		import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('.viewer'), antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);

		const light = new THREE.HemisphereLight(0xffffff, 0x444444);
		light.position.set(0, 200, 0);
		scene.add(light);

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.update();

		const $detailsClose = document.querySelector('.details__close');
		$detailsClose.onclick = () => {
			resetDetails();
		};

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

			const treeContainer = document.querySelector('.tree');
			buildHierarchyTree(gltf.scene, treeContainer);

			animate();
		}, undefined, function (error) {
			console.error(error);
		});

		function animate() {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		}

		function buildHierarchyTree(object3d, container) {
			const node = document.createElement('div');
			node.textContent = object3d.name || object3d.type;
			node.className = 'tree-node';
			node.onclick = () => showObjectDetails(object3d);
			container.appendChild(node);

			if (object3d.children.length > 0) {
				const childContainer = document.createElement('div');
				childContainer.style.marginLeft = '1em';
				container.appendChild(childContainer);
				object3d.children.forEach(child => buildHierarchyTree(child, childContainer));
			}
		}

		function showObjectDetails(obj3d) {
			const $detailsContainer = document.querySelector('.details');
			const $details = document.querySelector('.details__content');
			$details.innerHTML = '';
			const details = createDetailItem(obj3d);
			details.forEach(detail => $details.appendChild(detail));
			$detailsContainer.classList.remove('hidden');
		}

		function createDetailItem(obj) {
			const details = [];
			const relevant_keys = ['name', 'type', 'position', 'rotation', 'scale', 'visible', 'castShadow', 'receiveShadow'];
			for (let i = 0; i < relevant_keys.length; i++) {
				const $detailsItem = document.createElement('div');
				$detailsItem.classList.add('details__item');
				const key = relevant_keys[i];
				let value = obj[key];

				// Format different types of objects
				if (value && typeof value === 'object') {
					switch (true) {
						case value.isVector3:
							value = '(' + value.x.toFixed(2) + ', ' + value.y.toFixed(2) + ', ' + value.z.toFixed(2) + ')';
							break;
						case value.isEuler:
							value = '(' + value.x.toFixed(2) + ', ' + value.y.toFixed(2) + ', ' + value.z.toFixed(2) + ')';
							break;
						default:
							value = JSON.stringify(value);
					}
				}

				$detailsItem.textContent = key + ': ' + value;
				$detailsItem.onclick = () => copyToClipboard(value);
				details.push($detailsItem);
			}
			return details;
		}

		function copyToClipboard(text) {
			navigator.clipboard.writeText(text);
			const $detailsHeaderMessage = document.querySelector('.details__header-message');
			const $detailsHeaderTitle = document.querySelector('.details__header-title');
			$detailsHeaderMessage.textContent = 'Copied to clipboard';
			$detailsHeaderTitle.classList.add('hidden');
			$detailsHeaderMessage.classList.remove('faded');

			setTimeout(() => {
				$detailsHeaderMessage.classList.add('faded');
				$detailsHeaderTitle.classList.remove('hidden');
			}, 1000);
		}

		function resetDetails() {
			const $detailsContainer = document.querySelector('.details');
			const $details = document.querySelector('.details__content');
			$details.innerHTML = '';
			$detailsContainer.classList.add('hidden');
		}

		window.addEventListener('resize', () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		});
	</script>
</body>
</html>`;
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
};
