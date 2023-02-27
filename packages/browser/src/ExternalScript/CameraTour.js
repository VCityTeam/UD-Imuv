import { ExternalGame, THREE } from '@ud-viz/browser';

const TRAVELING_DURATION = 1500;

export class CameraTour extends ExternalGame.ScriptBase {
  init() {
    const avatarController =
      this.context.findExternalScriptWithID('AvatarController');
    const cameraManager =
      this.context.findExternalScriptWithID('CameraManager');
    const scriptUI = this.context.findExternalScriptWithID('UI');
    const menuTour = new MenuTour(this.context, this.variables, this.object3D);

    scriptUI.addTool(
      './assets/img/ui/icon_tour_images.png',
      'Tour Images',
      (resolve, reject, onClose) => {
        if (cameraManager.currentMovement) {
          resolve(false); //cant open/close menu while camera is moving
          return;
        }

        if (onClose) {
          cameraManager.moveToAvatar().then(() => {
            avatarController.setAvatarControllerMode(true);
            resolve(true); // success
          });
        } else {
          avatarController.setAvatarControllerMode(false);
          menuTour.travelToCurrentIndex().then(function (success) {
            resolve(success);
          });
        }
      },
      menuTour
    );
  }
}

class MenuTour {
  constructor(context, variables, object3D) {
    this.context = context;
    this.variables = variables;

    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('contextual_menu');

    const title = document.createElement('h1');
    title.innerHTML = object3D.name;
    this.rootHtml.appendChild(title);

    //init state camera
    if (this.variables.camera_transforms.length <= 0) return;

    this.currentIndex = 0;
    this.isTraveling = false;

    //slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = this.variables.camera_transforms.length - 1;
    slider.step = 1;
    slider.value = this.currentIndex;
    this.rootHtml.appendChild(slider);

    //next previous
    const parentPreviousNext = document.createElement('div');
    this.rootHtml.appendChild(parentPreviousNext);

    const previousButton = document.createElement('button');
    previousButton.classList.add('button-imuv');
    previousButton.innerHTML = '<';
    parentPreviousNext.appendChild(previousButton);

    const nextButton = document.createElement('button');
    nextButton.classList.add('button-imuv');
    nextButton.innerHTML = '>';
    parentPreviousNext.appendChild(nextButton);

    //cb

    previousButton.onclick = () => {
      const oldIndex = this.currentIndex;
      this.setCurrentIndex(Math.max(this.currentIndex - 1, 0));

      this.travelToCurrentIndex().then((success) => {
        if (success) {
          slider.value = this.currentIndex;
        } else {
          this.setCurrentIndex(oldIndex);
        }
      });
    };

    nextButton.onclick = () => {
      const oldIndex = this.currentIndex;

      this.setCurrentIndex(
        Math.min(
          this.currentIndex + 1,
          this.variables.camera_transforms.length - 1
        )
      );

      this.travelToCurrentIndex().then((success) => {
        if (success) {
          slider.value = this.currentIndex;
        } else {
          this.setCurrentIndex(oldIndex);
        }
      });
    };

    slider.onchange = () => {
      const oldIndex = this.currentIndex;
      this.setCurrentIndex(slider.value);

      this.travelToCurrentIndex().then((success) => {
        if (!success) {
          this.setCurrentIndex(oldIndex);
        }
      });
    };
  }

  setCurrentIndex(value) {
    this.currentIndex = parseInt(value);
  }

  travelToCurrentIndex() {
    return new Promise((resolve) => {
      if (this.isTraveling) {
        console.warn('already traveling');
        resolve(false);
        return;
      }

      this.isTraveling = true;

      const cameraManager =
        this.context.findExternalScriptWithID('CameraManager');

      const destPos = new THREE.Vector3().fromArray(
        this.variables.camera_transforms[this.currentIndex].position
      );
      const destQuat = new THREE.Quaternion().fromArray(
        this.variables.camera_transforms[this.currentIndex].quaternion
      );

      // dest transform is in game referential
      destPos.add(this.context.object3D.position);

      cameraManager
        .moveToTransform(destPos, destQuat, TRAVELING_DURATION)
        .then(() => {
          this.isTraveling = false;
          resolve(true);
        });
    });
  }

  html() {
    return this.rootHtml;
  }

  dispose() {
    this.rootHtml.remove();
  }
}
