import { Game, Shared, THREE } from '@ud-viz/browser';
import * as JitsiMeetExternalAPI from 'jitsi-iframe-api';
import { UI } from './UI';

export class JitsiArea extends Game.External.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.divJitsi = null;
  }

  init() {
    this.buildShapes();
  }

  createJitsiIframe() {
    if (navigator && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then(() => {
          console.log('Video + audio allowed');
        })
        .catch((e) => {
          console.log('e: ', e);
        });
    } else {
      console.warn('cant request video and audio');
    }

    let name = 'editor';
    const avatarGO = this.context.object3D.getObjectByProperty(
      'uuid',
      this.context.userData.avatarUUID
    );
    if (avatarGO) {
      const externalComp = avatarGO.getComponent(
        Shared.Game.Component.ExternalScript.TYPE
      );
      name = externalComp.getModel().getVariables().name;
    }

    // create iframe
    const divJitsi = document.createElement('div');

    const size = 500;

    const options = {
      roomName: this.variables.jitsi_room_name,
      parentNode: divJitsi,
      width: size,
      height: size,
      lang: 'fr',
      userInfo: {
        displayName: name,
      },
      interfaceConfigOverwrite: {
        // https://github.com/jitsi/jitsi-meet/blob/a7c653bc30156ec6ae7e3f67b28fffb07f3e79de/config.js#L699 DOC
        // this is link is not synchronized with our server version /!\
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

    const url = new URL(JITSI_PUBLIC_URL);
    // eslint-disable-next-line no-new
    new JitsiMeetExternalAPI(url.host + url.pathname, options);

    const scriptUI = this.context.findExternalScriptWithID(UI.ID_SCRIPT);
    scriptUI.displaySocialIframe(divJitsi);

    this.divJitsi = divJitsi;
    console.log('create jitsi');
  }

  onEnter() {
    if (this.divJitsi) return;
    this.createJitsiIframe();
  }

  onColliding() {
    // check also the onColliding method, so when url parameter teleport in jitsi area the iframe is created
    if (this.divJitsi) return;
    this.createJitsiIframe();
  }

  onLeave() {
    if (this.divJitsi) {
      const scriptUI = this.context.findExternalScriptWithID(UI.ID_SCRIPT);
      scriptUI.removeSocialIframe();
      this.divJitsi = null;
    }
  }

  buildShapes() {
    const renderComp = this.object3D.getComponent(
      Shared.Game.Component.Render.TYPE
    );

    const shapesJSON = this.object3D
      .getComponent(Shared.Game.Component.Collider.TYPE)
      .getModel()
      .getShapesJSON();

    const material = new THREE.MeshBasicMaterial();

    const height = 1;

    shapesJSON.forEach((shape) => {
      if (shape.type === 'Circle') {
        // cylinder
        const geometryCylinder = new THREE.CylinderGeometry(
          shape.radius,
          shape.radius,
          height,
          32
        );
        const cylinder = new THREE.Mesh(geometryCylinder, material);
        cylinder.rotateX(Math.PI * 0.5);
        cylinder.position.set(shape.center.x, shape.center.y, shape.center.z);
        renderComp.getController().addObject3D(cylinder);
      } else if (shape.type === 'Polygon' && shape.points.length) {
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
        renderComp.getController().addObject3D(mesh);
      } else {
        console.error('unknow type');
      }
    });
  }

  static get ID_SCRIPT() {
    return 'jitsi_area_id_ext_script';
  }
}
