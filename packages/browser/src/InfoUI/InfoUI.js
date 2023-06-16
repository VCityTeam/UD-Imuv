import { CommitInfo } from './CommitInfo/CommitInfo';
import { DocPage } from './Doc/DocPage';
import { loadJSON } from '@ud-viz/browser';

import './InfoUI.css';

export class InfoUI {
  constructor() {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('root_InfoUI');

    this.commitInfo = null;
    this.docPage = null;
  }

  load(path) {
    return new Promise((resolve) => {
      loadJSON(path).then((commitJson) => {
        this.commitInfo = new CommitInfo(commitJson);
        this.domElement.appendChild(this.commitInfo.html());
        resolve();
      });

      this.docPage = new DocPage();
      this.domElement.appendChild(this.docPage.html());
      document.body.appendChild(this.docPage.getParentElementDoc());
    });
  }

  html() {
    return this.domElement;
  }
}
