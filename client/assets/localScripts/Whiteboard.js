const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

const INIT_CONF = {
  factorHeight: 3,
  factorWidth: 3,
  iframe_src: null,
};

const DEFAULT_IMG_SRC =
  'https://upload.wikimedia.org/wikipedia/commons/3/31/White_paper.jpg';

module.exports = class Whiteboard {
  constructor(conf, udvizBundle) {
    console.log('Whiteboard constructor');
    this.conf = conf;

    udviz = udvizBundle;
    Game = udviz.Game;

    this.imagePlane = null;
    this.mapImg = null;

    this.conf = Object.assign(this.conf, INIT_CONF);
  }

  init() {
    this.go = arguments[0];
    this.gV = arguments[1].getGameView();
    if (!this.go) return;

    this.wboPort = 5001;
    this.conf.iframe_src =
      window.location.protocol +
      '//' +
      window.location.hostname +
      ':' +
      this.wboPort +
      '/boards/' +
      this.go.uuid;

    this.drawOnWhiteboard();
    this.getImageFromWhitebophir();
  }

  drawOnWhiteboard(url = DEFAULT_IMG_SRC) {
    //image
    if (this.imagePlane && this.imagePlane.parent) {
      this.imagePlane.parent.remove(this.imagePlane);
    }

    const onLoad = function (texture) {
      const image = texture.image;
      const ratio = image.width / image.height;
      const material = new Game.THREE.MeshBasicMaterial({ map: texture });
      const geometry = new Game.THREE.PlaneGeometry(
        ratio > 1 ? this.conf.factorWidth : this.conf.factorWidth * ratio,
        ratio < 1 ? this.conf.factorHeight : this.conf.factorHeight / ratio,
        32
      );
      this.imagePlane = new Game.THREE.Mesh(geometry, material);
      const r = this.go.getComponent(Game.Render.TYPE);
      r.addObject3D(this.imagePlane);
    };

    this.texture = new Game.THREE.TextureLoader().load(url, onLoad.bind(this));
  }

  getImageFromWhitebophir() {
    /* Creating an iframe element and setting its source to the url of the whiteboard. */
    const tempIframe = document.createElement('iframe');
    tempIframe.style.display = 'none';
    tempIframe.sandbox = 'allow-scripts allow-same-origin';
    this.gV.appendToUI(tempIframe);
    tempIframe.onload = function (event) {
      console.log(tempIframe.contentWindow.document);
    };
    tempIframe.src = this.conf.iframe_src;
    // const drawCanvaFromJSON = (json) => {
    //   debugger;
    //   const canvas = document.createElement('canvas');
    //   canvas.width = json.width;
    //   canvas.height = json.height;
    //   const ctx = canvas.getContext('2d');
    //   ctx.fillStyle = json.backgroundColor;
    //   ctx.fillRect(0, 0, canvas.width, canvas.height);
    //   json.drawings.forEach((drawing) => {
    //     ctx.strokeStyle = drawing.color;
    //     ctx.lineWidth = drawing.size;
    //     ctx.beginPath();
    //     drawing.points.forEach((point, i) => {
    //       if (i === 0) {
    //         ctx.moveTo(point.x, point.y);
    //       } else {
    //         ctx.lineTo(point.x, point.y);
    //       }
    //     });
    //     ctx.stroke();
    //   });
    //   return canvas;
    // };

    // const xhr = new XMLHttpRequest();

    // xhr.open('GET', '../wbo-boards/board-' + this.go.uuid + '.json');
    // const _this = this;
    // xhr.onload = function () {
    //   _this.createSVG(JSON.parse(this.response));
    //   drawCanvaFromJSON(JSON.parse(this.response));
    // };
    // xhr.send();

    // // console.log(tempIframe.getElementById('canvas'));

    // // tempIframe.parentElement.remove(tempIframe);
  }

  createSVG(json) {
    debugger;
    function htmlspecialchars(str) {
      //Hum, hum... Could do better
      if (typeof str !== 'string') return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function renderPath(el, pathstring) {
      return (
        '<path ' +
        'id="' +
        htmlspecialchars(el.id || 'l') +
        '" ' +
        'stroke-width="' +
        (el.size | 0) +
        '" ' +
        'stroke="' +
        htmlspecialchars(el.color || '#000') +
        '" ' +
        'd="' +
        pathstring +
        '" ' +
        '/>'
      );
    }

    const Tools = {
      Text: function (el) {
        return (
          '<text ' +
          'id="' +
          htmlspecialchars(el.id || 't') +
          '" ' +
          'x="' +
          (el.x | 0) +
          '" ' +
          'y="' +
          (el.y | 0) +
          '" ' +
          'font-size="' +
          (el.size | 0) +
          '" ' +
          'fill="' +
          htmlspecialchars(el.color || '#000') +
          '" ' +
          '>' +
          htmlspecialchars(el.txt || '') +
          '</text>'
        );
      },
      Pencil: function (el) {
        if (!el._children) return '';
        let pathstring = '';
        switch (el._children.length) {
          case 1:
            pathstring =
              'M' +
              el._children[0].x +
              ' ' +
              el._children[0].y +
              'L' +
              el._children[0].x +
              ' ' +
              el._children[0].y;
            break;
          default:
            pathstring =
              'M' + el._children[0].x + ' ' + el._children[0].y + 'L';
            for (let i = 1; i < el._children.length; i++) {
              pathstring += +el._children[i].x + ' ' + +el._children[i].y + ' ';
            }
        }

        return renderPath(el, pathstring);
      },
      Rectangle: function (el) {
        const pathstring =
          'M' +
          el.x +
          ' ' +
          el.y +
          'L' +
          el.x +
          ' ' +
          el.y2 +
          'L' +
          el.x2 +
          ' ' +
          el.y2 +
          'L' +
          el.x2 +
          ' ' +
          el.y +
          'L' +
          el.x +
          ' ' +
          el.y;
        return renderPath(el, pathstring);
      },
      'Straight line': function (el) {
        const pathstring = 'M' + el.x + ' ' + el.y + 'L' + el.x2 + ' ' + el.y2;
        return renderPath(el, pathstring);
      },
    };

    function toSVG(obj) {
      const margin = 500,
        maxelems = 1e4;
      let elements = '',
        i = 0,
        w = 500,
        h = 500;
      let elems = Object.values(obj);
      while (elems.length > 0) {
        if (++i > maxelems) break;
        const elem = elems.pop();
        elems = elems.concat(elem._children || []);
        if (elem.x && elem.x + margin > w) w = elem.x + margin;
        if (elem.y && elem.y + margin > h) h = elem.y + margin;
        const renderFun = Tools[elem.tool];
        if (renderFun) elements += renderFun(elem);
      }

      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="' +
        w +
        '" height="' +
        h +
        '">' +
        '<defs><style type="text/css"><![CDATA[' +
        'text {font-family:"Arial"}' +
        'path {fill:none;stroke-linecap:round;stroke-linejoin:round;}' +
        ']]></style></defs>' +
        elements +
        '</svg>';
      return svg;
    }

    return toSVG(json);
  }

  onOutdated() {}

  tick() {}
};
