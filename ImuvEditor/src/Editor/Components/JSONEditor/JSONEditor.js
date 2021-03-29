/** @format */

import './JSONEditor.css';

const OFFSET_LEFT = 20;
const VALUES_TYPE = {
  STRING: 'String',
  NUMBER: 'Number',
  BOOLEAN: 'Boolean',
  OBJECT: 'Object',
};

export class JSONEditorView {
  constructor(parentView) {
    //where html is add
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_JSONEditor');

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

    const createHtmlValue = function (key, value) {
      const result = document.createElement('div');

      //label
      const label = document.createElement('div');
      label.innerHTML = key + ': ';
      result.appendChild(label);

      //value
      let input;
      if (typeof value == 'string' || value === null) {
        input = document.createElement('input');
        input.type = 'text';
        input.value = value;
      } else if (typeof value == 'boolean') {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = value;
      } else if (typeof value == 'number') {
        input = document.createElement('input');
        input.type = 'number';
        input.value = value;
      } else {
        input = document.createElement('div');
        input.innerHTML = 'default';
      }

      result.appendChild(input);
      result.classList.add('object_JSONEditor');

      const removeButton = document.createElement('div');
      removeButton.classList.add('button_Editor');
      removeButton.innerHTML = 'remove';
      result.appendChild(removeButton);

      //callbacks
      removeButton.onclick = function (event) {
        result.remove();
      };

      return result;
    };

    const createHtmlObject = function (keyParent, object, offsetLeft = 0) {
      const result = document.createElement('div');

      //INITUI

      const ui = document.createElement('div');
      ui.classList.add('ui_object_JSONEditor');
      result.appendChild(ui);

      //fold/unfold
      const foldButton = document.createElement('div');
      foldButton.innerHTML = keyParent;
      foldButton.classList.add('button_Editor');
      ui.appendChild(foldButton);

      //add value
      const selectValueAdd = document.createElement('select');
      ui.appendChild(selectValueAdd);

      const addOption = {};
      for (let type in VALUES_TYPE) {
        const add = document.createElement('option');
        add.value = VALUES_TYPE[type];
        add.innerHTML = VALUES_TYPE[type];
        selectValueAdd.appendChild(add);
        addOption[type] = add;
      }

      //remove
      const removeButton = document.createElement('div');
      removeButton.classList.add('button_Editor');
      removeButton.innerHTML = 'remove';
      ui.appendChild(removeButton);

      const valuesParent = document.createElement('div');
      valuesParent.classList.add('hidden');
      valuesParent.style.marginLeft = offsetLeft + 'px';
      result.appendChild(valuesParent);

      //key value
      for (let key in object) {
        const o = object[key];

        if (o instanceof Object) {
          valuesParent.appendChild(
            createHtmlObject(key, o, offsetLeft + OFFSET_LEFT)
          );
        } else {
          valuesParent.appendChild(createHtmlValue(key, o));
        }
      }

      //INITCALLBACKS
      let hidden = true;
      foldButton.onclick = function (event) {
        hidden = !hidden;

        if (hidden) {
          valuesParent.classList.add('hidden');
        } else {
          valuesParent.classList.remove('hidden');
        }
      };

      removeButton.onclick = function (event) {
        result.remove();
      };

      return result;
    };

    this.rootHtml.appendChild(createHtmlObject('GameObject', this.currentJSON));
  }

  onJSON(goJson) {
    this.currentJSON = goJson;
    this.updateUI();
  }
}
