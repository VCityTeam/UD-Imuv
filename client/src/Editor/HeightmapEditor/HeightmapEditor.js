/** @format */

import { THREE } from 'ud-viz';

import './HeightmapEditor.css';

export class HeightmapEditorView {
  constructor(params) {
    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_HeightmapEditor');
    params.parentUIHtml.appendChild(this.ui);

    this.closeButton = null;
    this.computeButton = null;
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

  updatePlanes() {
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

    const center = this.gameView.getExtent().center();

    //position
    this.planeBottom.position.set(center.x, center.y, this.bottomPlaneAlt);
    this.planeTop.position.set(center.x, center.y, this.topPlaneAlt);

    const scene = this.gameView.getItownsView().scene;
    scene.add(this.planeTop);
    scene.add(this.planeBottom);

    this.renderHeightmap();
  }

  update3DView(visible) {
    //if visible = true on  init visible = false on dispose
    this.applyHeightmapVisibility(visible);

    const scene = this.gameView.getItownsView().scene;

    if (visible) {
      const obj = this.gameView.getObject3D();
      const bb = new THREE.Box3().setFromObject(obj);

      //init bottom and top alt and size
      this.topPlaneAlt = bb.max.z;
      this.bottomPlaneAlt = bb.min.z;
      this.planeSize = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y);

      this.updatePlanes();
    } else {
      scene.remove(this.planeTop);
      scene.remove(this.planeBottom);
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
    this.cameraHeightmap.position.copy(this.planeTop.position);
    this.cameraHeightmap.top = this.planeSize * 0.5;
    this.cameraHeightmap.bottom = -this.planeSize * 0.5;
    this.cameraHeightmap.right = this.planeSize * 0.5;
    this.cameraHeightmap.left = -this.planeSize * 0.5;
    this.cameraHeightmap.updateProjectionMatrix();

    const scene = this.gameView.getItownsView().scene;

    this.heightmapMaterial.uniforms.max.value = this.planeTop.position.z;
    this.heightmapMaterial.uniforms.min.value = this.planeBottom.position.z;

    scene.overrideMaterial = this.heightmapMaterial;
    this.rendererHeightmap.render(scene, this.cameraHeightmap);
    scene.overrideMaterial = null;
  }

  dispose() {
    this.ui.remove();
    this.update3DView(false);
  }

  initUI() {
    this.canvasPreview.classList.add('preview_HeightmapEditor');
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

    this.computeButton = document.createElement('div');
    this.computeButton.classList.add('button_Editor');
    this.computeButton.innerHTML = 'Compute heightmap';
    this.ui.appendChild(this.computeButton);

    this.closeButton = document.createElement('div');
    this.closeButton.classList.add('button_Editor');
    this.closeButton.innerHTML = 'Exit heightmap edition';
    this.ui.appendChild(this.closeButton);
  }

  initCallbacks() {
    const _this = this;

    this.computeButton.onclick = this.renderHeightmap.bind(this);

    this.bottomInput.onchange = function () {
      _this.bottomPlaneAlt = this.value;
      _this.updatePlanes();
    };

    this.topInput.onchange = function () {
      _this.topPlaneAlt = this.value;
      _this.updatePlanes();
    };

    this.sizeInput.onchange = function () {
      _this.planeSize = this.value;
      _this.updatePlanes();
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
