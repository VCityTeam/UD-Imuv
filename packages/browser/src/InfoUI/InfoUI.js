import { CommitInfo } from './CommitInfo/CommitInfo';
import { DocPage } from './Doc/DocPage';
import { FileUtil } from '@ud-viz/browser';

import './InfoUI.css';

export class InfoUI {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_InfoUI');

    this.commitInfo = null;
    this.docPage = null;
  }

  load(path) {
    const _this = this;

    return new Promise((resolve) => {
      FileUtil.loadJSON(path).then((commitJson) => {
        _this.commitInfo = new CommitInfo(commitJson);
        _this.rootHtml.appendChild(_this.commitInfo.html());
        resolve();
      });

      _this.docPage = new DocPage();
      _this.rootHtml.appendChild(_this.docPage.html());
      document.body.appendChild(_this.docPage.getParentElementDoc());
    });
  }

  html() {
    return this.rootHtml;
  }
}
