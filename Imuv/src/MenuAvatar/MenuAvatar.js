/** @format */

import './MenuAvatarView.css';

export class MenuAvatarView {
  constructor(webSocketService) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_MenuAvatar');

    //html
    this.webSocketService = webSocketService;

    this.init();
  }

  init() {
    this.initUI();
    this.initCallbacks();
  }

  initUI() {}

  dispose() {
    this.rootHtml.remove();
  }

  initCallbacks() {
    const _this = this;
  }

  html() {
    return this.rootHtml;
  }
}
