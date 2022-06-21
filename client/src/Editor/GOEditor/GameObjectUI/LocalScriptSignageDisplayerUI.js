import { THREE } from 'ud-viz';

export class LocalScriptSignageDisplayerUI {
  constructor(goui, gV) {
    const content = goui.content;
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
        const projects = goui.go.components.LocalScript.conf.projects;
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
      const projects = goui.go.components.LocalScript.conf.projects;
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
          goui.createInputFromVector3(params.position)
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
          .add(goui.go.computeWorldTransform().position);

        sphereP.position.copy(params.position || posOffset);
        gV.orbitControls.target.copy(sphereP.position);
        gV.orbitControls.update();

        gV.attachTCToObject(sphereP);
        transformObject3D.updateMatrixWorld();

        const cloneClearUiEditor = document.createElement('div');
        cloneClearUiEditor.classList.add('ui_Editor');
        goui.goEditor.ui.offsetParent.parentElement.appendChild(
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
            goui.createInputFromVector3(sphereP.position)
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

        const projects = goui.go.components.LocalScript.conf.projects;
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
        goui.goEditor.initPointerUpCallback();
      };

      return modal;
    };

    addNewProjectButton.onclick = function () {
      modal = createModalDiv();
      content.appendChild(modal);
    };
  }
}
