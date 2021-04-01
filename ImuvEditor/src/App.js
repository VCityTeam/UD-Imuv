/** @format */

import { Editor } from './Editor/Editor.js';
import { jquery, Game } from 'ud-viz';

export class App {
  constructor() {
    this.editor = null;

    window.UDVDebugger = new Game.UDVDebugger(document.body);
  }

  start(path) {
    const _this = this;
    this.loadConfigFile(path).then(function (config) {
      _this.editor = new Editor(config);
      _this.editor.load().then(function () {
        document.body.appendChild(_this.editor.html());
      });
    });
  }

  loadConfigFile(filePath) {
    return new Promise((resolve, reject) => {
      jquery.ajax({
        type: 'GET',
        url: filePath,
        datatype: 'json',
        success: (data) => {
          resolve(data);
        },
        error: (e) => {
          console.error(e);
          reject();
        },
      });
    });
  }
}
