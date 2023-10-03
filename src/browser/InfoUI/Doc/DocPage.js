import './DocPage.css';
import * as showdown from 'showdown';

import openingMd from './md/Opening.md';
import signMd from './md/SignDoc.md';
import commandMd from './md/HowToPlayDoc.md';
import chatMd from './md/ChatDoc.md';
import exhibitRoomMd from './md/ExhibitRoomDoc.md';
import postItMd from './md/PostItDoc.md';
import signageAreaMd from './md/SignageAreaDoc.md';
import underWorldMd from './md/UnderWorldDoc.md';
import widgetsMd from './md/WidgetsDoc.md';
import zeppelinTourMd from './md/ZeppelinTourDoc.md';

const folderImages = '/assets/img/doc/';

export class DocPage {
  constructor() {
    this.domElement = document.createElement('div');

    this.toggleShowButton = document.createElement('a');
    this.toggleShowButton.title = 'Help';
    this.toggleShowButton.style.backgroundImage =
      'url(./assets/img/ui/help_icon_white.png)';
    this.domElement.appendChild(this.toggleShowButton);

    this.parentElementDoc = document.createElement('div');
    this.parentElementDoc.id = 'parentElementDoc_Doc';
    this.parentElementDoc.classList.add('hidden_Doc');
    this.menuDoc = null;
    this.contentDoc = null;
    this.listMenuDoc = null;

    const _this = this;
    this.toggleShowButton.onclick = function () {
      if (getComputedStyle(_this.parentElementDoc).display != 'none') {
        _this.parentElementDoc.classList.add('hidden_Doc');
      } else {
        _this.parentElementDoc.classList.remove('hidden_Doc');
      }
    };

    const converter = new showdown.Converter();
    converter.setOption('tables', true);

    this.initHtml();
    this.addEntry('Bienvenue', converter.makeHtml(openingMd.body), true);
    this.addEntry('Compte', converter.makeHtml(signMd.body));
    this.addEntry('Comment jouer ?', converter.makeHtml(commandMd.body));
    this.addEntry('Chat', converter.makeHtml(chatMd.body));
    this.addEntry("Salle d'exposition", converter.makeHtml(exhibitRoomMd.body));
    this.addEntry('Post-It', converter.makeHtml(postItMd.body));
    this.addEntry("Zone d'observation", converter.makeHtml(signageAreaMd.body));
    this.addEntry(
      'Sauter dans la ville !',
      converter.makeHtml(underWorldMd.body)
    );
    this.addEntry('Les widgets', converter.makeHtml(widgetsMd.body));
    this.addEntry('Zeppelin Tour', converter.makeHtml(zeppelinTourMd.body));
  }

  getParentElementDoc() {
    return this.parentElementDoc;
  }

  initHtml() {
    this.menuDoc = document.createElement('div');
    this.menuDoc.id = 'menu_Doc';
    this.parentElementDoc.appendChild(this.menuDoc);

    this.listMenuDoc = document.createElement('ul');
    this.menuDoc.appendChild(this.listMenuDoc);

    this.contentDoc = document.createElement('div');
    this.contentDoc.id = 'content_Doc';
    this.parentElementDoc.appendChild(this.contentDoc);
  }

  addEntry(titleString, contentString, opening = false) {
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
    if (opening) {
      contentDoc.innerHTML = newContentDoc.innerHTML;
    }
  }

  html() {
    return this.domElement;
  }
}
