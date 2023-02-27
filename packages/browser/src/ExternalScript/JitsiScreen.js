import { ExternalGame, Billboard, THREE } from '@ud-viz/browser';
import { Game } from '@ud-viz/shared';
import * as JitsiMeetExternalAPI from 'jitsi-iframe-api';
import { Constant } from '@ud-imuv/shared';

export class JitsiScreen extends ExternalGame.ScriptBase {
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
        Game.Component.ExternalScript.TYPE
      );
      name = externalComp.getModel().getVariables().name;
    }

    //create iframe
    const divJitsi = document.createElement('div');

    const size = 200;

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

    const url = new URL(Constant.JITSI.PUBLIC_URL);
    new JitsiMeetExternalAPI(url.host + url.pathname, options);

    const positionBillboard = new THREE.Vector3();
    const quaternionBillboard = new THREE.Quaternion();
    const scaleBillboard = new THREE.Vector3();
    this.object3D.matrixWorld.decompose(
      positionBillboard,
      quaternionBillboard,
      scaleBillboard
    );

    const billboard = new Billboard(
      divJitsi,
      positionBillboard,
      new THREE.Euler().setFromQuaternion(quaternionBillboard),
      scaleBillboard,
      size
    );
    this.context.frame3D.appendBillboard(billboard);
  }
}
