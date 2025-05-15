# GLB Viewer for VS Code

A Visual Studio Code extension that provides a 3D viewer for GLB (GL Binary) files with an interactive hierarchy tree and detailed object properties.

## Features

- **3D Model Viewer**: View GLB files directly in VS Code with a Three.js-powered 3D viewer
- **Interactive Hierarchy Tree**:
  - Expandable/collapsible node structure
  - Toggle visibility of individual objects or entire hierarchies
  - Drag-and-drop positioning of the tree panel
  - Resizable tree panel
- **Object Properties**:
  - View detailed properties of selected objects
  - Copy property values to clipboard
  - Auto-focus camera on selected objects
- **Camera Controls**:
  - Orbit: Left mouse button
  - Pan: Right mouse button
  - Zoom: Mouse wheel
- **Modern UI**:
  - Dark theme support
  - Draggable panels
  - Responsive layout

## Requirements

- Visual Studio Code 1.100.0 or higher
- GLB files to view

## Installation

1. Open VS Code
2. Go to the Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "GLB Viewer"
4. Click Install

## Usage

1. Open a GLB file in VS Code
2. The file will automatically open in the GLB Viewer
3. Use the hierarchy tree on the left to:
   - Expand/collapse nodes
   - Toggle visibility of objects
   - Select objects to view their properties
4. Use the 3D viewer to:
   - Orbit: Left mouse button
   - Pan: Right mouse button
   - Zoom: Mouse wheel
5. Click on objects in the hierarchy to:
   - View their properties in the details panel
   - Focus the camera on the selected object

## Features in Detail

### Hierarchy Tree
- Located on the left side of the viewer
- Shows the complete structure of your 3D model
- Each node can be expanded/collapsed
- Eye icons to toggle visibility of objects and their children
- Draggable and resizable panel

### Properties Panel
- Shows detailed information about selected objects
- Properties include:
  - Name
  - Type
  - Position
  - Rotation
  - Scale
  - Visibility
  - Shadow properties
- Click on any property to copy its value to clipboard

### 3D Viewer
- Powered by Three.js
- Automatic camera positioning based on model size
- Grid helper for better spatial reference
- Ambient and hemisphere lighting for better visualization

## Known Issues

- Large GLB files might take longer to load
- Some complex materials or effects might not render exactly as in other viewers

## Release Notes

### 0.1.0
- Initial release
- Basic GLB viewing capabilities
- Interactive hierarchy tree
- Object properties panel
- Camera controls

## Contributing

Feel free to submit issues and enhancement requests!

## License

[MIT License](LICENSE.md)

## Acknowledgments

- Built with [Three.js](https://threejs.org/)
- Inspired by the need for a simple GLB viewer in VS Code
