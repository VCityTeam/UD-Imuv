import './Doc.css';
import * as showdown from 'showdown';

import openingMd from '../../assets/md/Doc/Opening.md';
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
    this.rootHtml.id = 'root_Doc';
    this.rootHtml.classList.add('hidden_Doc');

    this.toggleShowButton = document.createElement('a');
    this.toggleShowButton.innerHTML = '?';
    this.toggleShowButton.id = 'toggle_Shower_Doc';

    const rootHtml = this.rootHtml;

    this.toggleShowButton.onclick = function () {
      if (getComputedStyle(rootHtml).display != 'none') {
        rootHtml.classList.add('hidden_Doc');
      } else {
        rootHtml.classList.remove('hidden_Doc');
      }
    };

    this.menuDoc = null;
    this.contentDoc = null;
    this.listMenuDoc = null;

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
    return this.rootHtml;
  }
}
