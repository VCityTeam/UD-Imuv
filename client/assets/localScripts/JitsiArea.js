const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;
const threeType = require('three');
/** @type {threeType} */
let THREE = null;

module.exports = class JitsiArea {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;
    THREE = Game.THREE;

    this.divJitsi = null;
  }

  init() {
    const go = arguments[0];

    this.buildShapes(go);
  }

  onEnter() {
    if (this.divJitsi) return;

    const localCtx = arguments[1];

    if (navigator && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          console.log('Video + audio allowed');
        })
        .catch((e) => {
          console.log('e: ', e);
        });
    } else {
      console.warn('cant request video and audio');
    }

    let name = 'editor';
    const avatarGO = localCtx
      .getRootGameObject()
      .find(localCtx.getGameView().getUserData('avatarUUID'));

    if (avatarGO) {
      const lsComp = avatarGO.getComponent(udviz.Game.LocalScript.TYPE);
      name = lsComp.conf.name;
    }

    //create iframe
    const divJitsi = document.createElement('div');

    const size = 500;

    const options = {
      roomName: this.conf.jitsi_room_name,
      parentNode: divJitsi,
      width: size,
      height: size,
      lang: 'fr',
      userInfo: {
        displayName: name,
      },
      configOverwrite: { prejoinPageEnabled: false },
    };

    const JitsiIframeAPI = localCtx.getGameView().getLocalScriptModules()[
      'JitsiIframeAPI'
    ];
    const api = new JitsiIframeAPI('meet.jit.si', options);

    localCtx.getGameView().appendToUI(divJitsi);

    this.divJitsi = divJitsi;
  }

  onLeave() {
    if (this.divJitsi) {
      this.divJitsi.remove();
      this.divJitsi = null;
    }
  }

  buildShapes(go) {
    const renderComp = go.getComponent(Game.Render.TYPE);

    const shapesJSON = go
      .getComponent(Game.ColliderModule.TYPE)
      .getShapesJSON();

    const material = new THREE.MeshBasicMaterial({
      opacity: 0.2,
      transparent: true,
    });

    const height = 1;

    shapesJSON.forEach(function (shape) {
      switch (shape.type) {
        case 'Circle':
          //cylinder
          const geometryCylinder = new THREE.CylinderGeometry(
            shape.radius,
            shape.radius,
            height,
            32
          );
          const cylinder = new THREE.Mesh(geometryCylinder, material);
          cylinder.rotateX(Math.PI * 0.5);
          cylinder.position.set(shape.center.x, shape.center.y, shape.center.z);
          renderComp.addObject3D(cylinder);
          break;
        case 'Polygon':
          if (!shape.points.length) break;

          let altitude = 0;

          const shapeGeo = new THREE.Shape();
          shapeGeo.moveTo(shape.points[0].x, shape.points[0].y);
          altitude += shape.points[0].z;

          for (let index = 1; index < shape.points.length; index++) {
            const point = shape.points[index];
            shapeGeo.lineTo(point.x, point.y);

            altitude += point.z;
          }
          shapeGeo.lineTo(shape.points[0].x, shape.points[0].y);

          altitude /= shape.points.length;

          const geometryExtrude = new THREE.ExtrudeGeometry(shapeGeo, {
            depth: height,
          });
          const mesh = new THREE.Mesh(geometryExtrude, material);
          mesh.position.z = altitude - height * 0.5;
          renderComp.addObject3D(mesh);
          break;
        default:
          console.error('wrong type shape');
      }
    });
  }
};
