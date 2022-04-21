import './CommitInfo.css';

export class CommitInfo {
  constructor(json) {
    this.commitHash = json.commitHash;
    this.commitUrl = json.commitUrl;
    this.rootHtml = document.createElement('div');

    this.iniUI();
  }

  iniUI() {
    const commitInfo = document.createElement('p');
    commitInfo.id = 'commitInfo';
    commitInfo.innerHTML = this.commitUrl;
    this.rootHtml.appendChild(commitInfo);
  }

  html() {
    return this.rootHtml;
  }
}
