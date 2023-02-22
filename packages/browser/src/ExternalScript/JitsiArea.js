export class JitsiArea {
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

  createJitsiIframe(localCtx) {
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
      interfaceConfigOverwrite: {
        //https://github.com/jitsi/jitsi-meet/blob/a7c653bc30156ec6ae7e3f67b28fffb07f3e79de/config.js#L699 DOC
        //this is link is not synchronized with our server version /!\
        TOOLBAR_BUTTONS: [
          'camera',
          'chat',
          'closedcaptions',
          'desktop',
          'dock-iframe',
          'download',
          'embedmeeting',
          'etherpad',
          'feedback',
          'filmstrip',
          'fullscreen',
          // 'hangup',
          'help',
          'highlight',
          'invite',
          'linktosalesforce',
          'livestreaming',
          'microphone',
          'noisesuppression',
          'participants-pane',
          'profile',
          'raisehand',
          'recording',
          'security',
          'select-background',
          'settings',
          'shareaudio',
          'sharedvideo',
          'shortcuts',
          'stats',
          'tileview',
          'toggle-camera',
          'undock-iframe',
          'videoquality',
          'whiteboard',
        ],
      },
    };

    const JitsiIframeAPI = localCtx.getGameView().getLocalScriptModules()[
      'JitsiIframeAPI'
    ];
    const ImuvConstants = localCtx.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];
    const url = new URL(ImuvConstants.JITSI.PUBLIC_URL);
    const api = new JitsiIframeAPI(url.host + url.pathname, options);

    const scriptUI = localCtx.findExternalScriptWithID('ui');
    scriptUI.displaySocialIframe(divJitsi);

    this.divJitsi = divJitsi;
  }

  onEnter() {
    if (this.divJitsi) return;
    const localCtx = arguments[1];
    this.createJitsiIframe(localCtx);
  }

  onColliding() {
    //check also the onColliding method, so when url parameter teleport in jitsi area the iframe is created
    if (this.divJitsi) return;
    const localCtx = arguments[1];
    this.createJitsiIframe(localCtx);
  }

  onLeave() {
    if (this.divJitsi) {
      const localCtx = arguments[1];
      const scriptUI = localCtx.findExternalScriptWithID('ui');
      scriptUI.removeSocialIframe();
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
}
