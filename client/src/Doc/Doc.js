import './Doc.css';
import * as showdown from 'showdown';

import signMd from '../../assets/md/Doc/SignDoc.md';

const folderImages = '/assets/img/doc/';
export class DocPage {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_Doc');

    this.toggleShowButton = document.createElement('button');
    this.toggleShowButton.innerHTML = '?';

    this.menuDoc = null;
    this.contentDoc = null;
    this.listMenuDoc = null;

    const converter = new showdown.Converter();
    converter.setOption('tables', true);

    this.initHtml();
    this.addEntry('Sign', converter.makeHtml(signMd.body));
    this.addEntry('nEW', this.toggleShowButton);
  }

  initHtml() {
    this.menuDoc = document.createElement('div');
    this.menuDoc.id = 'menu_Doc';
    this.rootHtml.appendChild(this.menuDoc);

    this.listMenuDoc = document.createElement('ul');
    this.menuDoc.appendChild(this.listMenuDoc);

    this.contentDoc = document.createElement('div');
    this.contentDoc.id = 'content_Doc';
    this.rootHtml.appendChild(this.contentDoc);
  }

  addEntry(titleString, contentString) {
    const title = document.createElement('li');
    title.innerHTML = titleString;
    this.listMenuDoc.appendChild(title);

    const newContentDoc = document.createElement('div');
    newContentDoc.innerHTML = contentString;
    const loc = `${window.location.pathname}`;
    const path = loc.substring(0, loc.lastIndexOf('/'));

    Array.from(newContentDoc.getElementsByTagName('img')).forEach((imageEl) => {
      imageEl.src =
        `${window.location.origin}` +
        path +
        folderImages +
        imageEl.src.substring(imageEl.src.lastIndexOf('/'));
    });

    const contentDoc = this.contentDoc;
    title.onclick = function () {
      contentDoc.innerHTML = newContentDoc.innerHTML;
    };
  }

  setContentHtml() {
    l;
  }

  html() {
    return this.rootHtml;
  }
}
