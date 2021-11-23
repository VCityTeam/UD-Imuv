/** @format */

let udviz = null;

module.exports = class BBBScreen {
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

    const src = this.conf.bbb_room_tag.url;
    if (!src) {
      console.warn('no bbb url');
      return;
    }
    console.log(src);

    const iframe = document.createElement('iframe');
    iframe.src = src;
    const subdomain = '*';
    iframe.allow = 'microphone ' + subdomain + '; camera  ' + subdomain + ';';

    const ref = localCtx.getGameView().getObject3D().position;
    const worldTransform = go.computeWorldTransform();
    worldTransform.position.add(ref);

    const billboard = new udviz.Widgets.Billboard(iframe, worldTransform, 800);
    localCtx.getGameView().appendBillboard(billboard);
  }

  update() {
    //TODO should rebuild iframe with the right url
  }
};
