/** @format */

import { ReceptionView } from './Reception/Reception';
import { WebSocketService } from 'ud-viz/src/Components/WebSocketService';
import Constants from 'ud-viz/src/Game/Shared/Components/Constants';

const webSocketService = new WebSocketService();
webSocketService.connectToServer();

webSocketService.on(
  Constants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
  function (message) {
    alert(message);
  }
);

const reception = new ReceptionView(webSocketService);
document.body.appendChild(reception.html());

// import { View3D, itowns, THREE } from 'ud-viz';
// import THREEUtils from 'ud-viz/src/Game/Shared/Components/THREEUtils';

// let x = 1832891;
// let y = 5174952;
// let r = 1000;

// const extent = new itowns.Extent('EPSG:3946', x - r, x + r, y - r, y + r);
// const view = new View3D();
// view.initItownsView(extent);

// const center = extent.center();

// const image = document.createElement('img');
// image.src = './assets/img/menuAuthBG.jpg';
// view.appendCSS3D(
//   image,
//   { width: 200, height: 500 },
//   new THREEUtils.Transform(
//     new THREE.Vector3(center.x, center.y, 50),
//     new THREE.Vector3(Math.PI * 0.5, Math.PI * 0.2, 0),
//     new THREE.Vector3(2, 2, 2)
//   )
// );

// const geometry = new THREE.SphereGeometry(100, 32, 32);
// const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
// const sphere = new THREE.Mesh(geometry, material);
// sphere.position.copy(new THREE.Vector3(center.x + 200, center.y, 50));
// sphere.updateMatrixWorld();

// view.getItownsView().scene.add(sphere);
