/** @format */

import { THREE } from 'ud-viz';
import GameObjectModule from 'ud-viz/src/Game/GameObject/GameObject';
import { computeMapGO } from '../../Components/EditorUtility';

import './HeightmapEditor.css';

const HEIGHTMAP_SIZE = 1024;

export class HeightmapEditorView {
  constructor(params) {
    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_HeightmapEditor');
    params.parentUIHtml.appendChild(this.ui);

    this.closeButton = null;
    this.bindButton = null;
    this.canvasPreview = document.createElement('canvas');
    this.topInput = null;
    this.bottomInput = null;
    this.sizeInput = null;

    this.assetsManager = params.assetsManager;

    this.gameView = params.gameView;

    this.parentView = params.parentView;

    //params to set heightmap screenshot (model)
    this.topPlaneAlt = 10;
    this.bottomPlaneAlt = 0;
    this.planeSize = 100;

    //three object
    this.planeTop = null;
    this.planeBottom = null;
    this.parentPlanes = new THREE.Object3D();
    this.parentPlanes.name = 'Parent Heightmap Object3D';

    //renderer heightmap
    this.rendererHeightmap = new THREE.WebGLRenderer({
      canvas: this.canvasPreview,
    });
    //camera heightmap
    this.cameraHeightmap = new THREE.OrthographicCamera(
      1,
      1,
      1,
      1,
      0.001,
      1000
    );
    //shader
    this.heightmapMaterial = new THREE.ShaderMaterial({
      uniforms: {
        min: { value: null },
        max: { value: null },
      },

      vertexShader: [
        'varying float viewZ;',

        'void main() {',

        ' viewZ = -(modelViewMatrix * vec4(position.xyz, 1.)).z;',

        '	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

        '}',
      ].join('\n'),

      fragmentShader: [
        'varying float viewZ;',
        'uniform float min;',
        'uniform float max;',

        'void main() {',

        '	float heightValue = 1.0 - (viewZ)/(max - min);',
        '	heightValue = clamp(heightValue, 0.0, 1.0);',
        '	gl_FragColor = vec4( vec3(heightValue) , 1 );',

        '}',
      ].join('\n'),
    });

    this.initUI();
    this.initCallbacks();
    this.update3DView(true);
  }

  updateModel() {
    //remove old ones
    if (this.planeTop && this.planeTop.parent) {
      this.planeTop.parent.remove(this.planeTop);
    }
    if (this.planeBottom && this.planeBottom.parent) {
      this.planeBottom.parent.remove(this.planeBottom);
    }

    const planGeometry = new THREE.PlaneGeometry(
      this.planeSize,
      this.planeSize
    );
    const matPlan = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      color: 0x00000,
    });

    this.planeTop = new THREE.Mesh(planGeometry, matPlan);
    this.planeBottom = new THREE.Mesh(planGeometry, matPlan);

    const mapGO = computeMapGO(this.gameView);

    const mapObject3D = GameObjectModule.findObject3D(
      mapGO.getUUID(),
      this.gameView.getObject3D(),
      false
    );

    const center = mapGO.computeWorldTransform().position; //in game world ref

    //position
    this.planeBottom.position.set(center.x, center.y, this.bottomPlaneAlt);
    this.planeTop.position.set(center.x, center.y, this.topPlaneAlt);

    //create a parent clone
    mapObject3D.getWorldPosition(this.parentPlanes.position);

    this.parentPlanes.add(this.planeTop);
    this.parentPlanes.add(this.planeBottom);

    this.renderHeightmap();
  }

  update3DView(visible) {
    //if visible = true on  init visible = false on dispose
    this.applyHeightmapVisibility(visible);

    const scene = this.gameView.getScene();

    if (visible) {
      const obj = this.gameView.getObject3D();
      const bb = new THREE.Box3().setFromObject(obj);

      //init bottom and top alt and size
      const delta = 10;
      this.topPlaneAlt = delta;
      this.bottomPlaneAlt = -delta;
      this.planeSize = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y);

      this.updateModel();
      scene.add(this.parentPlanes);
    } else {
      scene.remove(this.parentPlanes);
    }

    this.updateUI();
  }

  applyHeightmapVisibility(value) {
    //remove visibility with tag
    const obj = this.gameView.getObject3D();
    obj.traverse(function (child) {
      if (!value) {
        child.visible = true;
        return;
      }

      if (child.name.includes('HM')) {
        child.visible = true;
      } else if (child.material) {
        child.visible = false;
      }
    });
  }

  renderHeightmap() {
    this.rendererHeightmap.setSize(HEIGHTMAP_SIZE, HEIGHTMAP_SIZE);

    //detech transform so its not appearing on the heightmap image
    this.parentView.getGOEditorView().transformControls.detach();

    this.planeTop.getWorldPosition(this.cameraHeightmap.position);
    this.cameraHeightmap.top = this.planeSize * 0.5;
    this.cameraHeightmap.bottom = -this.planeSize * 0.5;
    this.cameraHeightmap.right = this.planeSize * 0.5;
    this.cameraHeightmap.left = -this.planeSize * 0.5;
    this.cameraHeightmap.updateProjectionMatrix();

    const scene = this.gameView.getScene();

    this.heightmapMaterial.uniforms.max.value = this.topPlaneAlt;
    this.heightmapMaterial.uniforms.min.value = this.bottomPlaneAlt;

    scene.overrideMaterial = this.heightmapMaterial;
    this.rendererHeightmap.render(scene, this.cameraHeightmap);
    scene.overrideMaterial = null;
  }

  dispose() {
    this.ui.remove();
    this.update3DView(false);
  }

  initUI() {
    this.canvasPreview.classList.add('canvas_Editor');
    this.ui.appendChild(this.canvasPreview);

    const labelTop = document.createElement('div');
    labelTop.innerHTML = 'top alt';
    this.ui.appendChild(labelTop);

    this.topInput = document.createElement('input');
    this.topInput.type = 'number';
    this.ui.appendChild(this.topInput);

    const labelbottom = document.createElement('div');
    labelbottom.innerHTML = 'bottom alt';
    this.ui.appendChild(labelbottom);

    this.bottomInput = document.createElement('input');
    this.bottomInput.type = 'number';
    this.ui.appendChild(this.bottomInput);

    const labelsize = document.createElement('div');
    labelsize.innerHTML = 'size';
    this.ui.appendChild(labelsize);

    this.sizeInput = document.createElement('input');
    this.sizeInput.type = 'number';
    this.ui.appendChild(this.sizeInput);

    this.bindButton = document.createElement('div');
    this.bindButton.classList.add('button_Editor');
    this.bindButton.innerHTML = 'Compute heightmap';
    this.ui.appendChild(this.bindButton);

    this.closeButton = document.createElement('div');
    this.closeButton.classList.add('button_Editor');
    this.closeButton.innerHTML = 'Exit heightmap edition';
    this.ui.appendChild(this.closeButton);
  }

  initCallbacks() {
    const _this = this;

    this.bindButton.onclick = function () {
      _this.renderHeightmap(); //useless since model update launch render but robust
      const url = _this.canvasPreview.toDataURL('image/png');

      //get mapgo
      const mapGO = computeMapGO(_this.gameView);
      const mapScript = mapGO.fetchWorldScripts()['map'];

      //bind
      mapScript.conf.heightmap_path = url;
      mapScript.conf.heightmap_geometry = {
        max: parseInt(_this.topPlaneAlt),
        min: parseInt(_this.bottomPlaneAlt),
        size: parseInt(_this.planeSize),
      };
    };

    this.bottomInput.onchange = function () {
      _this.bottomPlaneAlt = this.value;
      _this.updateModel();
    };

    this.topInput.onchange = function () {
      _this.topPlaneAlt = this.value;
      _this.updateModel();
    };

    this.sizeInput.onchange = function () {
      _this.planeSize = this.value;
      _this.updateModel();
    };
  }

  updateUI() {
    this.sizeInput.value = this.planeSize;
    this.topInput.value = this.topPlaneAlt;
    this.bottomInput.value = this.bottomPlaneAlt;
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }
}
