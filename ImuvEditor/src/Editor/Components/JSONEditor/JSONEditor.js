/** @format */

export class JSONEditorView {
  constructor(parentView) {
    //where html is add
    this.rootHtml = document.createElement('div');

    this.currentJSON = null;
  }

  html() {
    return this.rootHtml;
  }

  updateUI() {
    //clean
    while (this.rootHtml.firstChild) {
      this.rootHtml.removeChild(this.rootHtml.firstChild);
    }

    const createHtmlObject = function (objectJson) {
      const result = document.createElement('div');
      result.innerHTML = 'EST';
      return result;
    };

    for (let key in this.currentJSON) {
      const o = this.currentJSON[key];
      this.rootHtml.appendChild(createHtmlObject(o));
    }
  }

  onJSON(goJson) {
    this.currentJSON = goJson;
    this.updateUI();
  }
}
