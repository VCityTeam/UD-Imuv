import { Game, THREE, DomElement3D, Shared } from '@ud-viz/browser';

import * as JitsiMeetExternalAPI from 'jitsi-iframe-api';
import { Constant } from '@ud-imuv/shared';

export class JitsiScreen extends Game.External.ScriptBase {
  init() {
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

    //create iframe
    const divJitsi = document.createElement('div');

    const options = {
      roomName: this.variables.jitsi_room_name,
      parentNode: divJitsi,
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

    const url = new URL(JITSI_PUBLIC_URL);
    new JitsiMeetExternalAPI(url.host + url.pathname, options);

    const positionDomElement3D = new THREE.Vector3();
    const quaternionDomElement3D = new THREE.Quaternion();
    const scaleDomElement3D = new THREE.Vector3();
    this.object3D.matrixWorld.decompose(
      positionDomElement3D,
      quaternionDomElement3D,
      scaleDomElement3D
    );

    const domElement3D = new DomElement3D(
      divJitsi,
      positionDomElement3D,
      new THREE.Euler().setFromQuaternion(quaternionDomElement3D),
      scaleDomElement3D,
      200
    );
    this.context.frame3D.appendDomElement3D(domElement3D);
  }

  static get ID_SCRIPT() {
    return 'jitsi_screen_id_ext_script';
  }
}
