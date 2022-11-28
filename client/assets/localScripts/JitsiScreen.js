/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;

module.exports = class JitsiScreen {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const _this = this;

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

    return

    const size = 200;

    const options = {
      roomName: this.conf.jitsi_room_name,
      parentNode: divJitsi,
      width: size * go.getScale().x,
      height: size * go.getScale().y,
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

    const ref = localCtx.getGameView().getObject3D().position;
    const worldTransform = go.computeWorldTransform();
    worldTransform.position.add(ref);
    const billboard = new udviz.Views.Billboard(divJitsi, worldTransform, size);
    localCtx.getGameView().appendBillboard(billboard);
  }
};
