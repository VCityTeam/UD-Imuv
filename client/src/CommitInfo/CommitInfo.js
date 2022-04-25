import './CommitInfo.css';

export class CommitInfo {
  constructor(json) {
    this.commitHash = json.commitHash;
    this.commitUrl = json.commitUrl;
    this.commitAbbrevHash = json.commitAbbrevHash;
    this.rootHtml = document.createElement('div');
    this.rootHtml.id = 'commitInfo';

    this.iniUI();
  }

  iniUI() {
    const commitInfo = document.createElement('a');
    commitInfo.innerHTML = '< ' + this.commitAbbrevHash + ' >';
    commitInfo.href = this.commitUrl;
    commitInfo.target = '_blank';
    this.rootHtml.appendChild(commitInfo);
  }

  html() {
    return this.rootHtml;
  }
}
