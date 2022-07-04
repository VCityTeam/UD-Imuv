/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;

module.exports = class DisplayMedia {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;

    this.content = null;
  }

  onClick() {
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();

    if (this.content) return;

    if (this.conf.iframe_src) {
      const closebutton = document.createElement('button');
      closebutton.innerHTML = 'close iframe';
      gameView.appendToUI(closebutton);

      const content = document.createElement('iframe');
      this.content = content;
      content.src = this.conf.iframe_src;

      //size
      this.updateSize(gameView.getSize());

      gameView.appendToUI(content);

      const _this = this;
      closebutton.onclick = function () {
        content.remove();
        _this.content = null;
        closebutton.remove();
      };
    }
  }

  updateSize(size) {
    this.content.style.height = size.y * 0.7 + 'px';
    this.content.style.width = size.x + 'px';
  }

  onResize() {
    if (!this.content) return;

    const localContext = arguments[1];
    const gameView = localContext.getGameView();
    this.updateSize(gameView.getSize());
  }
};
