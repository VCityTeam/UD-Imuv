import { THREE, OrbitControls, TransformControls } from 'ud-viz';
import { GameView } from 'ud-viz/src/Views/Views';

export class EditorGameView extends GameView {
  constructor(params) {
    super(params);

    this.start();
    this.transformControls = null;
    this.orbitControls = null;

    //variables for the selection of object with raycaster
    this.angleOrbitControls = null;
    this.tcDragged = false;

    //raycaster
    this.raycaster = new THREE.Raycaster();

    this.object3DToRaycast = this.object3D;

    this.callbackPointerUp = function () { };
    this.linkedHtmlElementTypeCbPointerUp = null;

    this.initTransformControls();
    this.initOrbitControls();
    this.initListeners();
  }

  initTransformControls() {
    if (this.transformControls) this.transformControls.dispose();

    const canvas = this.getRenderer().domElement;
    canvas.style.zIndex = 1; //patch

    this.transformControls = new TransformControls(this.getCamera(), canvas);

    this.getScene().add(this.transformControls);
  }

  initOrbitControls() {
    //new controls
    if (this.orbitControls) this.orbitControls.dispose();

    this.orbitControls = new OrbitControls(
      this.getCamera(),
      this.getRenderer().domElement
    );

    this.orbitControls.target.copy(this.getExtent().center());
    this.orbitControls.update();
  }

  initListeners() {
    const _this = this;

    //cant handle this callback with our input manager

    //transformControls Listeners
    this.transformControls.addEventListener(
      'dragging-changed',
      function (event) {
        _this.orbitControls.enabled = !event.value;
        if (event.value) {
          _this.tcDragged = true;
        }
      }
    );

    //Listeners in InputManager
    const manager = this.getInputManager();
    const viewerDiv = this.getRootWebGL();
    manager.addMouseInput(
      viewerDiv,
      'pointerdown',
      this.onPointerDownListener.bind(this)
    );

    manager.addMouseInput(
      viewerDiv,
      'pointerup',
      this.onPointerUpListener.bind(this)
    );

    manager.addKeyInput('Escape', 'keydown', this.escListener.bind(this));
  }

  onPointerDownListener() {
    //setAngleOrbitControls
    this.angleOrbitControls = this.computeAngle();
  }

  onPointerUpListener(event) {
    this.callbackPointerUp(event);
  }

  escListener() {
    this.transformControls.detach();
  }

  setCallbackPointerUp(cb = null, type = null) {
    if (!cb) cb = function () { };

    this.callbackPointerUp = cb;

    this.linkedHtmlElementTypeCbPointerUp.innerHTML =
      'CB Pointer UP Type : ' + (type || '');
  }

  /**Attach TransformControls to the result of intersect of a THREE.Raycast(). Return the object attached.*/
  attachTCToObject(object) {
    this.transformControls.detach();
    if (!object) return null;

    this.transformControls.attach(object);
    this.transformControls.updateMatrixWorld();
    return object;
  }

  tryFindGOParent(object) {
    let o = object;
    while (!o.userData.gameObjectUUID) {
      if (!o.parent) {
        return null;
      }
      o = o.parent;
    }
    return o;
  }

  computeAngle() {
    return (
      this.orbitControls.getAzimuthalAngle() +
      this.orbitControls.getPolarAngle()
    );
  }

  throwRay(event, object3D) {
    const canvas = this.getRenderer().domElement;

    //1. sets the mouse position with a coordinate system where the center of the screen is the origin
    const mouse = new THREE.Vector2(
      -1 + (2 * event.offsetX) / canvas.clientWidth,
      1 - (2 * event.offsetY) / canvas.clientHeight
    );

    //2. set the picking ray from the camera position and mouse coordinates
    this.raycaster.setFromCamera(mouse, this.getCamera());

    //3. compute intersections
    const intersects = this.raycaster.intersectObject(object3D, true);

    for (let i = 0; i < intersects.length; i++) {
      if (intersects[i].object.visible) {
        return intersects[i];
      }
    }

    return null;
  }

  hasBeenRotated() {
    return this.angleOrbitControls != this.computeAngle();
  }

  tcHasBeenDragged() {
    const result = this.tcDragged;
    this.tcDragged = false;
    return result;
  }

  getOrbitControls() {
    return this.orbitControls;
  }

  getTransformControls() {
    return this.transformControls;
  }

  setObject3DToRaycast() {
    return this.object3DToRaycast;
  }

  dispose() {
    super.dispose();
    this.orbitControls.dispose();

    this.transformControls.detach();
    this.transformControls.dispose();

    //remove listeners of InputManager
    const manager = this.getInputManager();
    manager.removeInputListener(this.onPointerDownListener);
    manager.removeInputListener(this.onPointerUpListener);
    manager.removeInputListener(this.escListener);
  }
}
