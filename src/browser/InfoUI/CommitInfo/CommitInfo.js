export class CommitInfo {
  constructor(json) {
    this.commitHash = json.commitHash;
    this.commitUrl = json.commitUrl;
    this.commitAbbrevHash = json.commitAbbrevHash;
    this.domElement = document.createElement('div');

    this.iniUI();
  }

  iniUI() {
    const commitInfo = document.createElement('a');
    commitInfo.style.backgroundImage =
      'url(./assets/img/ui/code_icon_white.png)';
    commitInfo.title = '< ' + this.commitAbbrevHash + ' >';
    commitInfo.href = this.commitUrl;
    commitInfo.target = '_blank';
    this.domElement.appendChild(commitInfo);
  }

  html() {
    return this.domElement;
  }
}
