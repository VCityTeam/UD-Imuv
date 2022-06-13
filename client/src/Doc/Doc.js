import './Doc.css';
import * as showdown from 'showdown';

import signMd from '../../assets/md/Doc/SignDoc.md';
import commandMd from '../../assets/md/Doc/HowToPlayDoc.md';
import chatMd from '../../assets/md/Doc/ChatDoc.md';
import exhibitRoomMd from '../../assets/md/Doc/ExhibitRoomDoc.md';
import postItMd from '../../assets/md/Doc/PostItDoc.md';
import signageAreaMd from '../../assets/md/Doc/SignageAreaDoc.md';
import underWorldMd from '../../assets/md/Doc/UnderWorldDoc.md';
import widgetsMd from '../../assets/md/Doc/WidgetsDoc.md';
import zeppelinTourMd from '../../assets/md/Doc/ZeppelinTourDoc.md';

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
    this.addEntry('How To Play', converter.makeHtml(commandMd.body));
    this.addEntry('Chat', converter.makeHtml(chatMd.body));
    this.addEntry('Exhibit Room', converter.makeHtml(exhibitRoomMd.body));
    this.addEntry('Post-It', converter.makeHtml(postItMd.body));
    this.addEntry('Signage Area', converter.makeHtml(signageAreaMd.body));
    this.addEntry('Under World', converter.makeHtml(underWorldMd.body));
    this.addEntry('Widgets', converter.makeHtml(widgetsMd.body));
    this.addEntry('Zeppelin Tour', converter.makeHtml(zeppelinTourMd.body));
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
