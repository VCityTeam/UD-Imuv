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
    const go = arguments[0];
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();
    if (this.content) return;

    if (this.conf.iframe_src) {
      const closebutton = document.createElement('button');
      closebutton.classList.add('button-imuv');
      closebutton.classList.add('diplay_media_close_button');
      closebutton.title = 'Fermer';

      const closeCross = document.createElement('div');
      closeCross.classList.add('close_cross');
      closebutton.appendChild(closeCross);
      gameView.appendToUI(closebutton);

      const content = document.createElement('iframe');
      content.classList.add('display_media_iframe');
      content.style.left = gameView.getRootWebGL().style.left;
      this.content = content;
      content.src = this.conf.iframe_src;

      //size
      this.updateSize(gameView.getSize());

      gameView.appendToUI(content);

      const _this = this;
      const avatarController =
        localCtx.findLocalScriptWithID('avatar_controller');
      avatarController.setAvatarControllerMode(false, localCtx);

      closebutton.onclick = function (event) {
        event.stopPropagation();
        content.remove();
        _this.content = null;
        closebutton.remove();
        avatarController.setAvatarControllerMode(true, localCtx);
      };
    }

    if (this.conf.sound_id) {
      const audioComp = go.getComponent(udviz.Game.Audio.TYPE);
      if (!audioComp) console.error('no audio comp');
      const sound = audioComp.getSounds()[this.conf.sound_id];
      if (sound.playing()) {
        sound.pause();
      } else {
        sound.play();
      }
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
