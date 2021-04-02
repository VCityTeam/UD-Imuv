/** @format */
import './JSONEditor.css';

import { Components } from 'ud-viz';

const OFFSET_LEFT = 40;
const VALUES_TYPE = {
  OBJECT: 'Object',
  STRING: 'String',
  NUMBER: 'Number',
  BOOLEAN: 'Boolean',
};

export class JSONEditorView {
  constructor(parentView) {
    //where html is add
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_JSONEditor');

    this.currentJSON = null;

    this.onchange = null;
  }

  html() {
    return this.rootHtml;
  }

  onChange(cb) {
    this.onchange = cb;
  }

  addListener(el, key) {
    const _this = this;
    const old = el[key];
    el[key] = function () {
      old.apply(el, arguments);
      if (_this.onchange) _this.onchange();
    };
  }

  updateUI() {
    const _this = this;

    //clean
    while (this.rootHtml.firstChild) {
      this.rootHtml.removeChild(this.rootHtml.firstChild);
    }

    const createHtmlValue = function (json, key) {
      const value = json[key];

      const result = document.createElement('div');

      //label
      const label = document.createElement('div');
      label.innerHTML = key + ': ';
      result.appendChild(label);

      //value
      const input = document.createElement('input');
      const isArray = json instanceof Array;
      if (Components.SystemUtils.Type.isNumeric(value)) {
        input.type = 'number';
        input.value = parseFloat(value);
        input.onchange = function (event) {
          if (isArray) {
            json.push(this.value);
          } else {
            json[key] = this.value;
          }
        };
      } else if (typeof value == 'boolean') {
        input.type = 'checkbox';
        input.checked = value;
        input.onchange = function (event) {
          if (isArray) {
            json.push(this.checked);
          } else {
            json[key] = this.checked;
          }
        };
      } else if (typeof value == 'string' || value === null) {
        input.type = 'text';
        input.value = value;
        input.onchange = function (event) {
          if (isArray) {
            json.push(this.value);
          } else {
            json[key] = this.value;
          }
        };
      } else {
        input.innerHTML = 'default';
      }

      _this.addListener(input, 'onchange');

      result.appendChild(input);
      result.classList.add('object_JSONEditor');

      const removeButton = document.createElement('div');
      removeButton.classList.add('button_Editor');
      removeButton.innerHTML = 'remove';
      result.appendChild(removeButton);

      //callbacks
      removeButton.onclick = function (event) {
        delete json[key];
        _this.onchange();
        result.remove(); //remove ui
      };

      return result;
    };

    const createHtmlObject = function (parent, keyParent, object) {
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

      for (let type in VALUES_TYPE) {
        const add = document.createElement('option');
        add.value = VALUES_TYPE[type];
        add.innerHTML = VALUES_TYPE[type];
        selectValueAdd.appendChild(add);
      }

      //add
      const addButton = document.createElement('div');
      addButton.classList.add('button_Editor');
      addButton.innerHTML = 'add';
      ui.appendChild(addButton);

      //remove
      const removeButton = document.createElement('div');
      removeButton.classList.add('button_Editor');
      removeButton.innerHTML = 'remove';
      ui.appendChild(removeButton);

      const valuesParent = document.createElement('div');
      valuesParent.classList.add('hidden');
      valuesParent.style.marginLeft = OFFSET_LEFT + 'px';
      result.appendChild(valuesParent);

      //key value
      for (let key in object) {
        const o = object[key];

        if (o instanceof Object) {
          valuesParent.appendChild(createHtmlObject(object, key, o));
        } else {
          valuesParent.appendChild(createHtmlValue(object, key));
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
        if (parent) {
          if (parent instanceof Array) {
            parent.splice(keyParent, 1);
          } else {
            delete parent[keyParent];
          }
        } else {
          _this.currentJSON = null;
        }
        _this.onchange();
        result.remove();
      };

      addButton.onclick = function (event) {
        const type = selectValueAdd.selectedOptions[0].value;

        const msgKey = 'Key ?';
        const key = window.prompt(msgKey);
        if (object[key] != undefined || key == null) {
          return;
        }

        switch (type) {
          case VALUES_TYPE.STRING:
            object[key] = '';
            valuesParent.appendChild(createHtmlValue(object, key));
            break;
          case VALUES_TYPE.NUMBER:
            object[key] = 0;
            valuesParent.appendChild(createHtmlValue(object, key));
            break;
          case VALUES_TYPE.BOOLEAN:
            object[key] = true;
            valuesParent.appendChild(createHtmlValue(object, key));
            break;
          case VALUES_TYPE.OBJECT:
            object[key] = {};
            valuesParent.appendChild(
              createHtmlObject(object, key, object[key]) //TODO remove third param
            );
            break;
          default:
            console.error('error');
        }
        valuesParent.classList.remove('hidden');
        _this.onchange();
      };

      return result;
    };

    //update html
    this.rootHtml.appendChild(
      createHtmlObject(null, 'GameObject', this.currentJSON)
    );

    //update callbacks
    this.onchange();
  }

  computeCurrentString() {
    const parseIndex = function (json) {
      if (!(json instanceof Object)) return json;

      let isArray = json instanceof Array;

      if (!isArray) {
        for (let key in json) {
          isArray = true;
          if (isNaN(key)) {
            isArray = false;
            break;
          }
        }
      }

      if (isArray) {
        const parsedJson = [];
        for (let index in json) {
          if (!json[index]) continue;
          parsedJson.push(json[index]);
        }
        json = parsedJson;
      }

      for (let key in json) {
        json[key] = parseIndex(json[key]);
      }

      return json;
    };

    const deepCopy = JSON.parse(JSON.stringify(this.currentJSON));

    return JSON.stringify(parseIndex(deepCopy));
  }

  onJSON(goJson) {
    this.currentJSON = goJson;
    this.updateUI();
  }
}
