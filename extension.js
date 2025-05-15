const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

class GLBDocument {
	constructor(uri) {
		this.uri = uri;
	}

	dispose() {

	}
}

function activate(context) {
	const provider = {
		async openCustomDocument(uri, openContext, token) {
			return new GLBDocument(uri);
		},

		async resolveCustomEditor(document, webviewPanel, _token) {

			const fileData = await vscode.workspace.fs.readFile(document.uri);


			const base64Data = Buffer.from(fileData).toString('base64');
			const dataUri = `data:application/octet-stream;base64,${base64Data}`;

			const modelUri = webviewPanel.webview.asWebviewUri(document.uri);
			const scriptUri = webviewPanel.webview.asWebviewUri(
				vscode.Uri.file(path.join(context.extensionPath, 'media', 'viewer.js'))
			);

			webviewPanel.webview.options = {
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(path.dirname(document.uri.fsPath))]
			};

			webviewPanel.webview.html = getWebviewContent(dataUri, scriptUri);
		}
	};

	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			'glbViewer.customEditor',
			provider,
			{
				webviewOptions: {
					retainContextWhenHidden: true
				}
			}
		)
	);
}

function getWebviewContent(dataUri, scriptUri) {
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

			scrollbar-color: var(--background-color-alt) var(--background-color);
			scrollbar-width: thin;
		}
		.container {
			position: relative;
			display: flex;
			width: 100%;
			height: 100%;
		}
		div.hidden {
			display: none;
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
			max-height: 50%;
			width: fit-content;
			border-radius: 4px;
			overflow: hidden;
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
			overflow-y: auto;
			overflow-x: hidden;
		}

		.tree-node {
			font-family: monospace;
			user-select: none;
		}

		.tree-node__label-wrapper {
			display: flex;
			align-items: center;
			cursor: pointer;
			padding: 2px 4px;
			border-radius: 4px;
		}

		.tree-node__label-wrapper:hover {
			background-color: var(--background-color-alt);
		}

		.tree-node__icon {
			width: 16px;
			height: 16px;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-right: 4px;
			transition: transform 0.1s ease;
			flex-shrink: 0;
		}

		.tree-node__label {
			flex-grow: 1;
			font-size: 13px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			min-width: 0;
		}

		.tree-node__action {
			width: 16px;
			height: 16px;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		.tree-node__children {
			margin-left: 0; /* padding handled by depth * 10px */
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
			border-radius: 4px;
			overflow: hidden;
		}
		.details__header {
			padding: 5px 10px;
			display: flex;
			border-bottom: 1px solid var(--background-color);
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			cursor: move;
		}
		.details__header:hover {
			box-shadow: 0 0 8px rgba(0,0,0,0.2);
			border-bottom: 1px solid var(--background-color-alt);
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
			<div class="tree">
				<!-- Tree will be populated here -->
			</div>
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
		let selectedOutline;

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
				if (newWidth > 200 && newWidth < window.innerWidth - 200) {
					$tree.style.width = newWidth + 'px';
				}
			}
			if (isDragging) {
				const newX = e.clientX - offsetX;
				const newY = e.clientY - offsetY;


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
		loader.load("${dataUri}", function (gltf) {
			console.log("GLB loaded", gltf);
			scene.add(gltf.scene);

			const box = new THREE.Box3().setFromObject(gltf.scene);
			const size = box.getSize(new THREE.Vector3()).length();
			const center = box.getCenter(new THREE.Vector3());

			camera.position.copy(center);
			camera.position.z += size * 1.5;
			camera.lookAt(center);

			renderer.setClearColor(0xeeeeee, 1);

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

		function buildHierarchyTree(object3d, $container, depth = 0) {
			const ICON_ARROW_RIGHT = '<svg fill="none" viewBox="0 0 24 24" width="16" height="16"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
			const ICON_ARROW_DOWN = '<svg fill="none" viewBox="0 0 24 24" width="16" height="16"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
			const ICON_OBJECT = '<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h4v4H7V7zm6 0h4v4h-4V7zm-6 6h4v4H7v-4zm6 0h4v4h-4v-4z" fill="currentColor"/> </svg>'
			const ICON_OPEN_EYE = '<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M0 7h2v2H0V7zm4 4H2V9h2v2zm4 2v-2H4v2H2v2h2v-2h4zm8 0H8v2H6v2h2v-2h8v2h2v-2h-2v-2zm4-2h-4v2h4v2h2v-2h-2v-2zm2-2v2h-2V9h2zm0 0V7h2v2h-2z" fill="currentColor"/> </svg>'
			const ICON_CLOSED_EYE = '<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M8 6h8v2H8V6zm-4 4V8h4v2H4zm-2 2v-2h2v2H2zm0 2v-2H0v2h2zm2 2H2v-2h2v2zm4 2H4v-2h4v2zm8 0v2H8v-2h8zm4-2v2h-4v-2h4zm2-2v2h-2v-2h2zm0-2h2v2h-2v-2zm-2-2h2v2h-2v-2zm0 0V8h-4v2h4zm-10 1h4v4h-4v-4z" fill="currentColor"/> </svg>'

			const $node = document.createElement('div');
			$node.className = 'tree-node';
			$node.style.paddingLeft = depth * 10 + 'px';

			const $icon = document.createElement('div');
			$icon.className = 'tree-node__icon';
			$icon.innerHTML = ICON_ARROW_RIGHT;

			const $action = document.createElement('div');
			$action.className = 'tree-node__action';
			$action.innerHTML = object3d.visible ? ICON_CLOSED_EYE : ICON_OPEN_EYE;

			const $label = document.createElement('div');
			$label.className = 'tree-node__label';
			$label.textContent = object3d.name || object3d.type;

			const $labelWrapper = document.createElement('div');
			$labelWrapper.className = 'tree-node__label-wrapper';
			$labelWrapper.appendChild($icon);
			$labelWrapper.appendChild($label);
			$labelWrapper.appendChild($action);

			const $children = document.createElement('div');
			$children.className = 'tree-node__children';
			$children.style.display = 'none';

			$node.appendChild($labelWrapper);
			$node.appendChild($children);
			$container.appendChild($node);

			// Function to toggle visibility of all children
			const toggleChildrenVisibility = (parent, visible) => {
				parent.visible = visible;
				parent.children.forEach(child => {
					child.visible = visible;
					toggleChildrenVisibility(child, visible);
				});
			};

			// Function to update eye icons for all children
			const updateChildrenEyeIcons = (parent, visible) => {
				const parentNode = parent.userData.treeNode;
				if (parentNode) {
					const actionIcon = parentNode.querySelector('.tree-node__action');
					if (actionIcon) {
						actionIcon.innerHTML = visible ? ICON_CLOSED_EYE : ICON_OPEN_EYE;
					}
				}
				parent.children.forEach(child => {
					updateChildrenEyeIcons(child, visible);
				});
			};

			// Store reference to DOM node in the 3D object
			object3d.userData.treeNode = $node;

			if (object3d.children.length > 0) {
				object3d.children.forEach(child => {
					buildHierarchyTree(child, $children, depth + 1);
				});

				$labelWrapper.onclick = () => {
					const isCollapsed = $children.style.display === 'none';
					$children.style.display = isCollapsed ? 'block' : 'none';
					$icon.innerHTML = isCollapsed ? ICON_ARROW_DOWN : ICON_ARROW_RIGHT;
				};

				// Add click handler for the eye icon
				$action.onclick = (e) => {
					e.stopPropagation(); // Prevent triggering the label click
					const newVisibility = !object3d.visible;
					toggleChildrenVisibility(object3d, newVisibility);
					updateChildrenEyeIcons(object3d, newVisibility);
				};
			} else {
				$icon.innerHTML = ICON_OBJECT;
				$action.onclick = (e) => {
					e.stopPropagation(); // Prevent triggering the label click
					object3d.visible = !object3d.visible;
					$action.innerHTML = object3d.visible ? ICON_CLOSED_EYE : ICON_OPEN_EYE;
				};
			}

			$label.onclick = () => showObjectDetails(object3d);
			$icon.onclick = () => showObjectDetails(object3d);
		}

		function showObjectDetails(obj3d) {
			const $detailsContainer = document.querySelector('.details');
			const $details = document.querySelector('.details__content');
			$details.innerHTML = '';
			const details = createDetailItem(obj3d);
			details.forEach(detail => $details.appendChild(detail));
			$detailsContainer.classList.remove('hidden');
			if (obj3d.isObject3D || obj3d.isMesh) {
				focusCameraOnObject(obj3d);
			}
		}

		function createDetailItem(obj) {
			const details = [];
			const relevant_keys = ['name', 'type', 'position', 'rotation', 'scale', 'visible', 'castShadow', 'receiveShadow'];
			for (let i = 0; i < relevant_keys.length; i++) {
				const $detailsItem = document.createElement('div');
				$detailsItem.classList.add('details__item');
				const key = relevant_keys[i];
				let value = obj[key];


				if (value && typeof value === 'object') {
					switch (true) {
						case value.isVector3:
							value = value.x.toFixed(2) + ', ' + value.y.toFixed(2) + ', ' + value.z.toFixed(2);
							break;
						case value.isEuler:
							value = value.x.toFixed(2) + ', ' + value.y.toFixed(2) + ', ' + value.z.toFixed(2);
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


		function highlightObject(obj) {
			if (selectedOutline) {
				scene.remove(selectedOutline);
			}

			const box = new THREE.Box3().setFromObject(obj);
			const helper = new THREE.Box3Helper(box, 0xff0000);
			selectedOutline = helper;
			scene.add(helper);
		}

		function focusCameraOnObject(obj) {

			const box = new THREE.Box3().setFromObject(obj);
			const center = box.getCenter(new THREE.Vector3());

			const size = box.getSize(new THREE.Vector3());
			const boundingSphereRadius = size.length() / 2;

			const fov = THREE.MathUtils.degToRad(camera.fov);
			const aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;

			const distanceForHeight = boundingSphereRadius / Math.sin(fov / 2);
			const distanceForWidth = boundingSphereRadius / Math.sin(Math.atan(Math.tan(fov / 2) * aspect));
			const fitDistance = Math.max(distanceForHeight, distanceForWidth) * 1.2;

			const direction = new THREE.Vector3();
			camera.getWorldDirection(direction);
			direction.negate();

			const newPosition = center.clone().add(direction.multiplyScalar(fitDistance));
			camera.position.copy(newPosition);

			camera.near = fitDistance / 100;
			camera.far = fitDistance * 100;
			camera.updateProjectionMatrix();

			if (controls) {
				controls.target.copy(center);
				controls.update();
			}
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
