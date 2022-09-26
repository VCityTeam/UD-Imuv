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
      closebutton.classList.add('button-imuv');
      closebutton.innerHTML = 'Fermer';
      closebutton.style.position = 'absolute';
      closebutton.style.top = '0px';
      closebutton.style.left = '0px';
      closebutton.style.zIndex = 3;
      gameView.appendToUI(closebutton);

      const content = document.createElement('iframe');
      content.classList.add('display_media_iframe');
      this.content = content;
      content.src = this.conf.iframe_src;

      //size
      this.updateSize(gameView.getSize());

      gameView.appendToUI(content);

      const _this = this;
      const rootGO = localCtx.getRootGameObject();
      const avatarController = rootGO.fetchLocalScripts()['avatar_controller'];
      avatarController.setAvatarControllerMode(false, localCtx);

      closebutton.onclick = function () {
        content.remove();
        _this.content = null;
        closebutton.remove();
        avatarController.setAvatarControllerMode(true, localCtx);
      };
    }
  }

  updateSize(size) {
    this.content.style.height = size.y + 'px';
    this.content.style.width = size.x + 'px';
  }

  onResize() {
    if (!this.content) return;

    const localContext = arguments[1];
    const gameView = localContext.getGameView();
    this.updateSize(gameView.getSize());
  }
};
