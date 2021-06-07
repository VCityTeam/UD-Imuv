/** @format */

import { Editor } from './Editor/Editor.js';
import { Game, Components } from 'ud-viz';


export class App {
  constructor() {
    this.editor = null;

    //DEBUG
    window.UDVDebugger = new Game.UDVDebugger(document.body);
  }

  start(path) {
    const _this = this;
    Components.SystemUtils.File.loadJSON(path).then(function (config) {
      _this.editor = new Editor(config);
      _this.editor.load().then(function () {
        document.body.appendChild(_this.editor.html());
      });
    });
  }
}
