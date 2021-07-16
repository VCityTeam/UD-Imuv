/** @format */
import './JSONEditor.css';

import { Components, THREE } from 'ud-viz';
import Type from 'ud-viz/src/Components/SystemUtils/Type';
import JSONUtils from 'ud-viz/src/Components/SystemUtils/JSONUtils';

const OFFSET_LEFT = 20;
const VALUES_TYPE = {
  OBJECT: 'Object',
  STRING: 'String',
  NUMBER: 'Number',
  BOOLEAN: 'Boolean',
};

export class JSONEditorView {
  constructor(parentView, name) {
    //where html is add
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_JSONEditor');

    this.name = name;

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
        input.onchange = function () {
          if (isArray) {
            json.push(this.value);
          } else {
            json[key] = this.value;
          }
        };
      } else if (typeof value == 'boolean') {
        input.type = 'checkbox';
        input.checked = value;
        input.onchange = function () {
          if (isArray) {
            json.push(this.checked);
          } else {
            json[key] = this.checked;
          }
        };
      } else if (typeof value == 'string' || value === null) {
        input.type = 'text';
        input.value = value;
        input.onchange = function () {
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
      removeButton.onclick = function () {
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

      //copy
      const copyButton = document.createElement('div');
      copyButton.classList.add('button_Editor');
      copyButton.innerHTML = 'Copy';
      ui.appendChild(copyButton);

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
      foldButton.onclick = function () {
        hidden = !hidden;

        if (hidden) {
          valuesParent.classList.add('hidden');
        } else {
          valuesParent.classList.remove('hidden');
        }
      };

      copyButton.onclick = function () {
        if (Type.isNumeric(keyParent)) {
          //key
          const newKey = Math.round(parseFloat(keyParent) + 1);
          const copyObject = JSON.parse(JSON.stringify(object));

          JSONUtils.parse(copyObject, function (j, k) {
            if (k == 'uuid') j[k] = THREE.MathUtils.generateUUID();
          });

          parent[newKey] = copyObject;

          result.appendChild(
            createHtmlObject(parent, newKey, copyObject) //TODO remove third param (not sure to keep this object)
          );
          result.classList.remove('hidden');
          _this.onchange();
        }
      };

      removeButton.onclick = function () {
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

      addButton.onclick = function () {
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
      createHtmlObject(null, this.name, this.currentJSON)
    );

    //update callbacks
    this.onchange();
  }

  computeCurrentString() {
    return JSON.stringify(this.currentJSON);
  }

  onJSON(goJson) {
    this.currentJSON = goJson;
    this.updateUI();
  }
}
