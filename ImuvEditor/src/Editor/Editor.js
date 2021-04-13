/** @format */

import './Editor.css';
import { GOEditorView } from './GOEditor/GOEditorView';
import { WorldEditorView } from './WorldEditor/WorldEditorView';
import { Game } from 'ud-viz';

export class Editor {
  constructor(config) {
    this.config = config;

    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_Editor');

    //assets
    this.assetsManager = new Game.Components.AssetsManager();

    //views
    this.goView = new GOEditorView(config, this.assetsManager);
    this.worldView = new WorldEditorView(config, this.assetsManager);

    //id current world
    this.currentWorld = null;

    //html
    this.switchView = null;
  }

  initUI() {
    const parentUI = document.createElement('div');
    parentUI.classList.add('parentUI_Editor');
    this.rootHtml.appendChild(parentUI);

    //flex parent
    const parentFlex = document.createElement('div');
    parentFlex.style.display = 'flex';//TODO in css
    parentUI.appendChild(parentFlex);

    //switch view
    const switchView = document.createElement('div');
    switchView.classList.add('button_Editor');
    switchView.innerHTML = 'Switch Editor View';
    parentFlex.appendChild(switchView);
    this.switchView = switchView;

  }

  initCallbacks() {
    const _this = this;

    //callbacks
    let wView = true;
    this.rootHtml.appendChild(this.worldView.html());
    this.switchView.onclick = function () {
      wView = !wView;
      if (wView) {
        _this.goView.setPause(true);
        _this.rootHtml.removeChild(_this.goView.html());

        _this.worldView.setPause(false);
        _this.rootHtml.appendChild(_this.worldView.html());
      } else {
        _this.worldView.setPause(true);
        _this.rootHtml.removeChild(_this.worldView.html());

        _this.goView.setPause(false);
        _this.rootHtml.appendChild(_this.goView.html());
      }
      window.dispatchEvent(new Event('resize'));
    };
  }

  load() {
    const _this = this;
    return new Promise((resolve, reject) => {
      _this.assetsManager
        .loadFromConfig(_this.config.assetsManager)
        .then(_this.goView.load.bind(_this.goView))
        .then(_this.worldView.load.bind(_this.worldView))
        .then(function () {
          _this.initUI();
          _this.initCallbacks();

          resolve();
        });
    });
  }

  html() {
    return this.rootHtml;
  }
}
