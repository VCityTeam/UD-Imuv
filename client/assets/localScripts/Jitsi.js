/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;

const LABEL_JOIN = 'JOIN JITSI Room';
const LABEL_LEAVE = 'LEAVE JITSI Room';

module.exports = class Jitsi {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;

    this.divJitsi = null;
    this.joinRoomJitsi = null;
    this.loadingUIEl = null;
  }

  /**
   * Create a loading UI element if it doesn't exist, and append it to the game view
   * @param gameView - The game view that the loading UI should be added to.
   * @returns loadingElement created
   */
  createLoadingUIEl(gameView) {
    if (this.loadingUIEl) return;
    const loadingUIEl = document.createElement('div');
    loadingUIEl.classList.add('lds-default');
    for (let i = 0; i < 12; i++) {
      const element = document.createElement('div');
      loadingUIEl.appendChild(element);
    }
    this.loadingUIEl = loadingUIEl;
    gameView.appendToUI(loadingUIEl);
    return loadingUIEl;
  }

  /**
   * Remove the loading UI element from the DOM and clear the reference to it
   */
  removeLoadingUIEl() {
    if (!this.loadingUIEl) return;
    this.loadingUIEl.remove();
    this.loadingUIEl = null;
  }

  /**
   * It creates a button that will allow you to join a room.
   * @returns Nothing.
   */
  init() {
    const go = arguments[0];
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

    const joinRoomJitsi = document.createElement('div'); //TODO clean css
    joinRoomJitsi.classList.add('button_Editor');
    joinRoomJitsi.innerHTML = LABEL_JOIN;
    this.joinRoomJitsi = joinRoomJitsi;
    localCtx.getGameView().appendToUI(joinRoomJitsi);

    const _this = this;
    //CALLBACK
    joinRoomJitsi.onclick = function () {
      if (_this.divJitsi) {
        _this.removeIframe();
        return;
      }
      _this.joinRoomJitsi.innerHTML = LABEL_LEAVE;

      const divJitsi = document.createElement('div');
      _this.divJitsi = divJitsi;
      const options = {
        roomName: go.components.LocalScript.uuid,
        width: 500,
        height: 500,
        parentNode: divJitsi,
        lang: 'fr',
      };

      const api = new JitsiMeetExternalAPI('meet.jit.si', options);

      localCtx.getGameView().appendToUI(divJitsi);
    };
  }

  /**
   * Remove the iframe from the DOM and clear the reference to it
   */
  removeIframe() {
    this.joinRoomJitsi.innerHTML = LABEL_JOIN;
    this.divJitsi.remove();
    this.divJitsi = null;
  }

  dispose() {
    const localCtx = arguments[1];
    const webSocketService = localCtx.getWebSocketService();
    if (!webSocketService) return;
    const ImuvConstants = localCtx.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];
    webSocketService.reset([ImuvConstants.WEBSOCKET.MSG_TYPES.CREATE_BBB_ROOM]);
  }

  /**
   * *Update the join button to say "Leave" instead of "Join"*
   * @returns Nothing.
   */
  onOutdated() {
    if (this.divJitsi) return;

    this.joinRoomJitsi.innerHTML = LABEL_LEAVE;
  }
};
