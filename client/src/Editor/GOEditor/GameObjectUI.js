import WorldScriptModule from 'ud-viz/src/Game/GameObject/Components/WorldScript';
import { GameObject, World } from 'ud-viz/src/Game/Game';
import { THREE } from 'ud-viz';
import File from 'ud-viz/src/Components/SystemUtils/File';
import { ColliderEditorView } from './ColliderEditor/ColliderEditor';

export class GameObjectUI {
  constructor(go, obj, goEditor) {
    this.go = go;
    this.goEditor = goEditor;
    this.rootElementUI = document.createElement('div');
    this.rootElementUI.classList.add('goUI_GOEditor');

    this.cEV = null;

    this.initBaseUI(go, obj, goEditor);
  }

  dispose() {
    if (this.cEV) this.cEV.dispose();
    this.cEV = null;
    this.rootElementUI.remove();
  }

  initBaseUI(go, obj, goEditor) {
    //UUID
    const uuidLabel = document.createElement('div');
    uuidLabel.innerHTML = go.getUUID();
    this.rootElementUI.appendChild(uuidLabel);

    //Name
    const inputName = document.createElement('input');
    inputName.type = 'text';
    inputName.value = go.getName();
    this.rootElementUI.appendChild(inputName);

    inputName.onchange = function () {
      go.setName(inputName.value);
      goEditor.updateUI();
    };

    //Transfom UI
    const cbOnChange = function () {
      go.setTransformFromObject3D(obj);
    };

    const translateButton = document.createElement('div');
    translateButton.innerHTML = 'Translate';
    translateButton.classList.add('button_Editor');
    this.rootElementUI.appendChild(translateButton);

    translateButton.onclick = function () {
      goEditor.gameView.getTransformControls().setMode('translate');
    };

    const vec3InputPosition = this.createInputFromVector3(
      obj.position,
      cbOnChange
    );

    this.rootElementUI.appendChild(vec3InputPosition);

    const rotateButton = document.createElement('div');
    rotateButton.classList.add('button_Editor');
    rotateButton.innerHTML = 'rotate';
    this.rootElementUI.appendChild(rotateButton);

    rotateButton.onclick = function () {
      goEditor.gameView.getTransformControls().setMode('rotate');
    };

    const vec3InputRotation = this.createInputFromVector3(
      obj.rotation,
      cbOnChange
    );
    this.rootElementUI.appendChild(vec3InputRotation);

    const scaleButton = document.createElement('div');
    scaleButton.classList.add('button_Editor');
    scaleButton.innerHTML = 'scale';
    this.rootElementUI.appendChild(scaleButton);

    scaleButton.onclick = function () {
      goEditor.gameView.getTransformControls().setMode('scale');
    };

    const vec3InputScale = this.createInputFromVector3(obj.scale, cbOnChange);

    this.rootElementUI.appendChild(vec3InputScale);

    //clone
    const cloneButton = document.createElement('div');
    cloneButton.classList.add('button_Editor');
    cloneButton.innerHTML = 'Clone';
    this.rootElementUI.appendChild(cloneButton);

    cloneButton.onclick = function () {
      const clone = GameObject.deepCopy(go);
      goEditor.parentView.addGameObject(clone, function () {
        goEditor.setSelectedGOWithObject3D(
          goEditor.computeObject3D(clone.getUUID())
        );
      });
    };

    this.content = document.createElement('div');
    this.rootElementUI.appendChild(this.content);

    const deleteButton = document.createElement('div');
    deleteButton.classList.add('button_Editor');
    deleteButton.innerHTML = 'Delete';
    this.rootElementUI.appendChild(deleteButton);

    deleteButton.onclick = function () {
      goEditor.setSelectedGOWithObject3D(null);
      go.removeFromParent();
      goEditor.gameView.forceUpdate();
      goEditor.updateUI();
    };

    const ulButtons = document.createElement('ul');
    ulButtons.classList.add('ul_Editor');
    this.rootElementUI.appendChild(ulButtons);

    const colliderButton = document.createElement('li');
    colliderButton.classList.add('li_Editor');
    colliderButton.innerHTML = 'Collider';
    ulButtons.appendChild(colliderButton);

    const rootHtml = this.rootElementUI;

    const _this = this;
    colliderButton.onclick = function () {
      if (!goEditor.getSelectedGO()) {
        console.error('not GO selected');
        return;
      }
      if (_this.cEV) return;
      _this.cEV = new ColliderEditorView({
        goEditor: goEditor,
        rootHtml: rootHtml,
      });

      _this.cEV.setOnClose(
        function () {
          _this.cEV.dispose();
          _this.cEV = null;
          this.initPointerUpCallback();
          this.setSelectedGOWithObject3D(
            this.computeObject3D(this.getSelectedGO().getUUID())
          );
        }.bind(goEditor)
      );
    };
  }

  createInputFromVector3(vec3, cbSetFunc = null) {
    const inputVector3 = document.createElement('div');

    for (let iInput = 0; iInput < 3; iInput++) {
      let component = iInput === 0 ? vec3.x : iInput === 1 ? vec3.y : vec3.z;
      const componentElement = document.createElement('input');
      componentElement.type = 'number';
      componentElement.value = component;
      componentElement.step = 0.1;
      inputVector3.appendChild(componentElement);

      componentElement.onchange = function () {
        const value = parseFloat(componentElement.value);
        vec3.set(
          iInput === 0 ? value : vec3.x,
          iInput === 1 ? value : vec3.y,
          iInput === 2 ? value : vec3.z
        );
        if (cbSetFunc) cbSetFunc();
      };
    }

    return inputVector3;
  }

  getRootElementUI() {
    return this.rootElementUI;
  }

  appendLSImageUI(gV) {
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    this.content.appendChild(imageInput);

    const go = this.go;
    imageInput.onchange = function (e) {
      File.readSingleFileAsDataUrl(e, function (data) {
        const url = data.target.result;
        go.components.LocalScript.conf.path = url;
        gV.forceUpdate();
      });
    };
  }

  appendLSSignageDisplayerUI(gV) {
    const _this = this;
    const content = this.content;
    const addNewProjectButton = document.createElement('button');
    addNewProjectButton.innerHTML = 'Add New Project';
    content.appendChild(addNewProjectButton);

    const projectsUl = document.createElement('ul');
    content.appendChild(projectsUl);
    const projectHtml = function (project) {
      const projectLi = document.createElement('li');
      projectLi.innerHTML =
        project.title + ' ' + project.url + ' ' + project.position;

      const modifyButton = document.createElement('button');
      modifyButton.innerHTML = 'Modify';

      modifyButton.onclick = function () {
        modal = createModalDiv({
          title: project.title,
          url: project.url,
          position: new THREE.Vector3(
            project.position[0],
            project.position[1],
            project.position[2]
          ),
          uuid: project.uuid,
        });

        content.appendChild(modal);
      };

      projectLi.appendChild(modifyButton);

      const deleteButton = document.createElement('button');
      deleteButton.innerHTML = 'Delete';

      deleteButton.onclick = function () {
        const projects = _this.go.components.LocalScript.conf.projects;
        for (let i = 0; i < projects.length; i++) {
          const p = projects[i];
          if (p.uuid === project.uuid) {
            projects.splice(i, 1);
          }
        }
        projectLi.remove();
      };

      projectLi.appendChild(deleteButton);
      return projectLi;
    };
    const fillProjectsUl = function () {
      projectsUl.innerHTML = '';
      const projects = _this.go.components.LocalScript.conf.projects;
      projects.forEach(function (p) {
        projectsUl.appendChild(projectHtml(p));
      });
    };
    fillProjectsUl();

    let modal = null;
    const createModalDiv = function (params = {}) {
      modal = document.createElement('div');
      modal.classList.add('modal');

      const modalContent = document.createElement('div');
      modalContent.classList.add('modal_content');
      modal.appendChild(modalContent);

      const labelNewProject = document.createElement('p');
      labelNewProject.innerHTML = 'Infos project';
      modalContent.appendChild(labelNewProject);

      const titleNewProject = document.createElement('input');
      titleNewProject.value = params.title || '';
      titleNewProject.type = 'text';
      titleNewProject.placeholder = 'Titre';
      modalContent.appendChild(titleNewProject);

      const url = document.createElement('input');
      url.value = params.url || '';
      url.type = 'url';
      url.placeholder = 'https://example.com';
      url.pattern = 'https://.*';
      url.size = '30';
      url.attributes['required'] = 'required';
      modalContent.appendChild(url);

      const buttonAddTransform = document.createElement('button');
      buttonAddTransform.innerHTML = 'Add BillBoard Transform';
      modalContent.appendChild(buttonAddTransform);

      const transformElement = document.createElement('div');
      transformElement.innerHTML = '';
      modalContent.appendChild(transformElement);
      if (params.position) {
        transformElement.appendChild(
          _this.createInputFromVector3(params.position)
        );
        buttonAddTransform.innerHTML = 'Modify BillBoard Transform';
      }

      buttonAddTransform.onclick = function () {
        modal.hidden = true;
        const transformObject3D = new THREE.Object3D();
        transformObject3D.name = 'TransformObject';
        gV.getScene().add(transformObject3D);
        gV.setCallbackPointerUp(null);

        const geometry = new THREE.SphereGeometry(5, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const sphereP = new THREE.Mesh(geometry, material);
        transformObject3D.add(sphereP);
        const posOffset = gV
          .getObject3D()
          .position.clone()
          .add(_this.go.computeWorldTransform().position);

        sphereP.position.copy(params.position || posOffset);
        gV.orbitControls.target.copy(sphereP.position);
        gV.orbitControls.update();

        gV.attachTCToObject(sphereP);
        transformObject3D.updateMatrixWorld();

        const cloneClearUiEditor = document.createElement('div');
        cloneClearUiEditor.classList.add('ui_Editor');
        _this.goEditor.ui.offsetParent.parentElement.appendChild(
          cloneClearUiEditor
        );

        const validateButton = document.createElement('button');
        validateButton.innerHTML = 'VALIDATE';
        validateButton.classList = 'validate_button';
        cloneClearUiEditor.appendChild(validateButton);
        validateButton.onclick = function () {
          modal.hidden = false;
          transformElement.innerHTML = '';
          transformElement.appendChild(
            _this.createInputFromVector3(sphereP.position)
          );

          transformObject3D.removeFromParent();
          cloneClearUiEditor.remove();
        };
      };

      const buttonCreateNewProject = document.createElement('button');
      buttonCreateNewProject.innerHTML = 'Create';
      modalContent.appendChild(buttonCreateNewProject);

      buttonCreateNewProject.onclick = function () {
        let x, y, z;
        const firstEl = transformElement.firstElementChild;
        if (firstEl) {
          x = parseFloat(firstEl.children[0].value);
          y = parseFloat(firstEl.children[1].value);
          z = parseFloat(firstEl.children[2].value);
        }
        const validVector3 = isNaN(x) || isNaN(y) || isNaN(z);

        const isValidURL = function (string) {
          let url;

          try {
            url = new URL(string);
          } catch (_) {
            return false;
          }

          return url.protocol === 'http:' || url.protocol === 'https:';
        };

        if (!titleNewProject.value || !isValidURL(url.value) || validVector3) {
          alert('Fields are not correct');
          return;
        }

        const projects = _this.go.components.LocalScript.conf.projects;
        if (params.uuid) {
          projects.forEach(function (p) {
            if (p.uuid === params.uuid) {
              p.title = titleNewProject.value;
              p.url = url.value;
              p.position = [x, y, z];
            }
          });
        } else {
          projects.push({
            title: titleNewProject.value,
            url: url.value,
            position: [x, y, z],
            uuid: THREE.MathUtils.generateUUID(),
          });
        }
        fillProjectsUl();
      };

      const buttonClose = document.createElement('button');
      buttonClose.innerHTML = 'Close';
      modalContent.appendChild(buttonClose);

      buttonClose.onclick = function () {
        modal.remove();
        modal = null;
        _this.goEditor.initPointerUpCallback();
      };

      return modal;
    };

    addNewProjectButton.onclick = function () {
      modal = createModalDiv();
      content.appendChild(modal);
    };
  }

  appendWSPortalUI(wS, gV) {
    const portalInput = document.createElement('div');

    //spawn rot input
    const refSpawnRot = wS['portal'].conf.spawnRotation;
    if (!refSpawnRot) throw new Error('no spawn rotation');

    const labelSpawnRot = document.createElement('div');
    labelSpawnRot.innerHTML = 'Portal spawn rotation';
    portalInput.appendChild(labelSpawnRot);

    portalInput.appendChild(this.createInputFromVector3(refSpawnRot));

    //world uuid
    const worldsJSON = gV.getAssetsManager().getWorldsJSON();
    const wCxt = gV.getInterpolator().getWorldContext();
    const currentWorld = wCxt.getWorld();
    //replace current world json because it can be modified
    for (let index = 0; index < worldsJSON.length; index++) {
      const json = worldsJSON[index];
      if (json.uuid == currentWorld.getUUID()) {
        //found
        const newContent = currentWorld.toJSON();
        worldsJSON[index] = newContent;
        break;
      }
    }

    const labelWorlds = document.createElement('div');
    labelWorlds.innerHTML = 'World Destination';
    portalInput.appendChild(labelWorlds);

    const selectPortal = document.createElement('select');
    portalInput.appendChild(selectPortal);

    const createPortalsOptions = function (optGrp, wjson) {
      const worldPortal = new World(wjson);
      worldPortal.getGameObject().traverse(function (child) {
        const wS = child.getComponent(WorldScriptModule.TYPE);
        if (wS && wS.idScripts.includes('portal')) {
          const optionPortal = document.createElement('option');
          optionPortal.value = child.uuid;
          optionPortal.innerHTML = child.name;
          optGrp.appendChild(optionPortal);
        }
      });
    };

    const unsetOptionPortal = document.createElement('option');
    unsetOptionPortal.value = 'null';
    unsetOptionPortal.innerHTML = 'None';
    selectPortal.appendChild(unsetOptionPortal);

    //Fill selectPortal Htmlelements
    worldsJSON.forEach(function (wjson) {
      const optGroup = document.createElement('optgroup');
      optGroup.title = wjson.uuid;
      optGroup.label = wjson.name;
      selectPortal.appendChild(optGroup);
      createPortalsOptions(optGroup, wjson);
    });

    selectPortal.onchange = function () {
      const options = selectPortal.getElementsByTagName('option');
      const iSelect = selectPortal.selectedIndex;
      const optionSelected = options[iSelect];

      wS['portal'].conf.worldDestUUID =
        iSelect !== 0 ? optionSelected.parentElement.title : null;
      wS['portal'].conf.portalUUID = selectPortal.value;
    };

    //select right value
    const currentPortalValue = wS['portal'].conf.portalUUID;
    const options = selectPortal.getElementsByTagName('option');
    for (var i = 0; i < options.length; i++) {
      if (options[i].value == currentPortalValue) {
        options[i].selected = true;
        selectPortal.dispatchEvent(new Event('change'));
        break;
      }
    }

    this.content.appendChild(portalInput);
  }

  appendWSTeleporterUI(wS) {
    const teleporterInput = document.createElement('div');
    const refDestinationTransform = wS['teleporter'].conf.destinationTransform;
    if (!refDestinationTransform) throw new Error('no dest transform');

    const labelDesT = document.createElement('div');
    labelDesT.innerHTML = 'Teleporter destination transform';
    teleporterInput.appendChild(labelDesT);

    const labelPosition = document.createElement('div');
    labelPosition.innerHTML = 'position';
    labelPosition.appendChild(
      this.createInputFromVector3(refDestinationTransform.position)
    );

    const labelRotation = document.createElement('div');
    labelRotation.innerHTML = 'rotation';
    labelRotation.appendChild(
      this.createInputFromVector3(refDestinationTransform.rotation)
    );

    teleporterInput.appendChild(labelPosition);
    this.content.appendChild(teleporterInput);
  }
}
