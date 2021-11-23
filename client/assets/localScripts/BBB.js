/** @format */

let udviz = null;
const LABEL_JOIN = 'JOIN BBB Room';
const LABEL_LEAVE = 'LEAVE BBB Room';

module.exports = class BBB {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;

    this.bbbIframe = null;
    this.joinWorldBBB = null;
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

    const joinWorldBBB = document.createElement('div'); //TODO clean css
    joinWorldBBB.classList.add('button_Editor');
    joinWorldBBB.innerHTML = LABEL_JOIN;
    this.joinWorldBBB = joinWorldBBB;
    localCtx.getGameView().appendToUI(joinWorldBBB);

    //CALLBACK
    joinWorldBBB.onclick = function () {
      if (_this.bbbIframe) {
        _this.removeIframe();
      } else {
        const Constants = udviz.Game.Shared.Components.Constants;
        const webSocketService = localCtx.getWebSocketService();
        if (!webSocketService) return;
        const localScript = go.getComponent(udviz.Game.Shared.LocalScript.TYPE);
        webSocketService.emit(Constants.WEBSOCKET.MSG_TYPES.CREATE_BBB_ROOM, {
          goUUID: go.getUUID(),
          componentUUID: localScript.getUUID(),
        });
      }
    };
  }

  removeIframe() {
    this.joinWorldBBB.innerHTML = LABEL_JOIN;
    this.bbbIframe.remove();
    this.bbbIframe = null;
  }

  dispose() {
    const localCtx = arguments[1];
    const webSocketService = localCtx.getWebSocketService();
    if (!webSocketService) return;
    const Constants = udviz.Game.Shared.Components.Constants;
    webSocketService.reset([Constants.WEBSOCKET.MSG_TYPES.CREATE_BBB_ROOM]);
  }

  update() {
    if (this.bbbIframe) return;

    const src = this.conf.bbb_room_tag.url;
    if (!src) {
      console.warn('no bbb url');
      return;
    }
    console.log(src);

    const localCtx = arguments[1];

    this.joinWorldBBB.innerHTML = LABEL_LEAVE;

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.style.width = '500px';
    iframe.style.height = '500px';
    const subdomain = '*';
    iframe.allow = 'microphone ' + subdomain + '; camera  ' + subdomain + ';';
    localCtx.getGameView().appendToUI(iframe);
    this.bbbIframe = iframe;
  }
};
