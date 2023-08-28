import { LocalScript, Audio } from 'ud-viz/src/Game/Game';

export class LocalScriptDisplayMediaUI {
  constructor(goUI, gV) {
    // variables
    const content = goUI.content;

    const uuid = goUI.go.getUUID();
    const goInGame = gV.getLastState().getGameObject().find(uuid);

    // title
    const titleDisplayMedia = document.createElement('h3');
    titleDisplayMedia.innerHTML = 'DisplayMedia:';
    content.appendChild(titleDisplayMedia);

    // add a label to the input iframe_src
    const label = document.createElement('div');
    label.innerHTML = 'Lien iframe';
    content.appendChild(label);

    // get ls component
    const lsComp = goInGame.getComponent(LocalScript.TYPE);
    if (!lsComp) throw new Error('no localscript');

    // create input iframe src
    const inputIframeSrc = document.createElement('input');
    inputIframeSrc.type = 'text';
    inputIframeSrc.placeholder = 'http:// || https:// || ./*.html';
    inputIframeSrc.value = lsComp.conf.iframe_src; // init
    content.appendChild(inputIframeSrc);

    // init callback
    inputIframeSrc.onchange = function () {
      lsComp.conf.iframe_src = this.value;
    };

    // sound input
    const audioComp = goInGame.getComponent(Audio.TYPE);
    if (!audioComp) throw new Error('no audio comp');

    const labelSound = document.createElement('div');
    labelSound.innerHTML = 'Son ID';
    content.appendChild(labelSound);

    // select
    const selectSoundID = document.createElement('select');
    content.appendChild(selectSoundID);

    const assetsManager = gV.getAssetsManager();

    const sounds = assetsManager.conf['sounds'];

    // null option
    const addOption = function (label, value) {
      const option = document.createElement('option');
      option.innerHTML = label;
      option.value = value;
      selectSoundID.appendChild(option);

      // init
      if (lsComp.conf.sound_id == value) {
        selectSoundID.value = value;
      }
    };

    addOption('none', null);

    for (const idSound in sounds) {
      addOption(idSound, idSound);
    }

    selectSoundID.onchange = function () {
      const valueSelected = this.selectedOptions[0].value;
      lsComp.conf.sound_id = valueSelected;

      // update audioComp
      audioComp.reset();
      if (valueSelected) {
        audioComp.addSound(valueSelected, gV.getAssetsManager());
      }
    };
  }
}
