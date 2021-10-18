/** @format */

let udviz = null;

module.exports = class BBB {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;

    this.bbbIframe = null;
  }

  init() {
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

    const LABEL_JOIN = 'JOIN BBB Room';
    const LABEL_LEAVE = 'LEAVE BBB Room';

    const joinWorldBBB = document.createElement('div'); //TODO clean css
    joinWorldBBB.classList.add('button_Editor');
    joinWorldBBB.innerHTML = LABEL_JOIN;
    localCtx.getGameView().appendToUI(joinWorldBBB);

    //CALLBACK
    joinWorldBBB.onclick = function () {
      if (_this.bbbIframe) {
        joinWorldBBB.innerHTML = LABEL_JOIN;
        _this.bbbIframe.remove();
        _this.bbbIframe = null;
      } else {
        const src = _this.conf.bbb_room_tag.url;
        if (!src) {
          alert('no bbb url');
          return;
        }
        console.log(src);

        joinWorldBBB.innerHTML = LABEL_LEAVE;

        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.style.width = '500px';
        iframe.style.height = '500px';
        const subdomain = '*';
        iframe.allow =
          'microphone ' + subdomain + '; camera  ' + subdomain + ';';
        localCtx.getGameView().appendToUI(iframe);
        _this.bbbIframe = iframe;
      }
    };
  }

  update() {
    //TODO should rebuild iframe with the right url
  }
};
