export class DisplayMedia {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;

    this.content = null;
  }

  onClick() {
    const go = arguments[0];
    const localCtx = arguments[1];

    if (this.content) return;

    if (this.conf.iframe_src) {
      const scriptUI = localCtx.findLocalScriptWithID('ui');
      scriptUI.displayIframe(localCtx, this.conf.iframe_src);
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
}
