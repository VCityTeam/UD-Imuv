/**@format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

const CITY_MAP_SIZE = 500;
const CITY_AVATAR_SIZE_MIN = 15;
const CITY_AVATAR_SIZE_MAX = 25;
const CITY_MAP_CMD_ID = 'city_map_cmd_id';

module.exports = class CityMap {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;

    this.rootHtml = document.createElement('div');

    this.canvas = document.createElement('canvas');
    this.canvas.width = CITY_MAP_SIZE;
    this.canvas.height = CITY_MAP_SIZE;
    this.rootHtml.appendChild(this.canvas);

    this.imageCityMap = document.createElement('img');

    this.currentDt = 0;

    this.currentZoom = 1;

    //buffer
    this.clampX = 0;
    this.clampY = 0;

    const _this = this;
    this.canvas.onwheel = function (event) {
      const newZoom = _this.currentZoom - event.wheelDelta * 0.0002;
      _this.setCurrentZoom(newZoom);
    };

    this.displayMap = false;

    this.pings = [];

    this.mapClickMode = null;
  }

  /**
   * Map interface
   * @param {*} mode
   */
  setClickMode(mode) {
    this.clickMode = mode;

    if (mode == this.mapClickMode.DEFAULT) {
      this.setCursorPointer(false);
    } else if (mode == this.mapClickMode.PING) {
      this.setCursorPointer(true);
    } else if (mode == this.mapClickMode.TELEPORT) {
      this.setCursorPointer(true);
    }
  }

  /**
   * Map interface
   * @param {*} value
   */
  setDisplayMap(value) {
    this.displayMap = value;
  }

  /**
   * Map interface
   * @returns
   */
  getRootHtml() {
    return this.rootHtml;
  }

  fetchUserCityAvatar(localContext) {
    //init
    const avatarGO = localContext
      .getRootGameObject()
      .find(localContext.getGameView().getUserData('avatarUUID'));
    return avatarGO.findByName('city_avatar');
  }

  init() {
    const cityMapGO = arguments[0];

    const localContext = arguments[1];
    const _this = this;
    const manager = localContext.getGameView().getInputManager();
    const gameView = localContext.getGameView();
    const userID = gameView.getUserData('userID');
    const ImuvConstants = localContext.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];

    this.mapClickMode = ImuvConstants.MAP_CLICK_MODE;

    //init src
    this.imageCityMap.src = ImuvConstants.CITY_MAP.PATH;

    manager.addMouseCommand(CITY_MAP_CMD_ID, 'click', function () {
      const event = this.event('click');

      if (event.target != _this.canvas) return null;
      const x = event.pageX;
      const y = event.pageY;

      const rect = event.target.getBoundingClientRect();
      const ratioX = (x - rect.left) / (rect.right - rect.left);
      const ratioY = (y - rect.top) / (rect.bottom - rect.top);

      const coord = _this.pixelToCoord(ratioX, ratioY, ImuvConstants);

      const userCityAvatar = _this.fetchUserCityAvatar(localContext);

      if (_this.clickMode === _this.mapClickMode.DEFAULT) {
        //nothing
        _this.setClickMode(_this.mapClickMode.DEFAULT);

        return null;
      } else if (_this.clickMode === _this.mapClickMode.TELEPORT) {
        _this.setClickMode(_this.mapClickMode.DEFAULT);

        const position = _this.coordToLocalPosition(coord, localContext);

        return new udviz.Game.Command({
          type: udviz.Game.Command.TYPE.TELEPORT,
          data: {
            position: position,
            cityAvatarUUID: userCityAvatar.getUUID(),
          },
          userID: userID,
          gameObjectUUID: cityMapGO.getUUID(),
        });
      } else if (_this.clickMode === _this.mapClickMode.PING) {
        _this.setClickMode(_this.mapClickMode.DEFAULT);

        return new udviz.Game.Command({
          type: udviz.Game.Command.TYPE.PING_MINI_MAP,
          data: {
            coord: coord,
            color: _this.fetchCityAvatarColor(userCityAvatar),
          },
          userID: userID,
          gameObjectUUID: cityMapGO.getUUID(),
        });
      }
    });
  }

  onOutdated() {
    const _this = this;
    this.conf.city_map_ping.forEach(function (data) {
      const ping = new Ping({
        coord: data.coord,
        color: data.color,
      });
      _this.pings.push(ping);
    });
  }

  setCursorPointer(value) {
    if (value) {
      this.canvas.style.cursor = 'pointer';
    } else {
      this.canvas.style.cursor = 'auto';
    }
  }

  //zoom is clamp between 0->1
  setCurrentZoom(value) {
    this.currentZoom = Math.min(1, Math.max(0.02, value));
  }

  pixelToCoord(ratioX, ratioY, ImuvConstants) {
    const sizeSrc =
      Math.min(this.imageCityMap.width, this.imageCityMap.height) *
      this.currentZoom;

    const pixelSrcX = sizeSrc * ratioX + this.clampX;
    const pixelSrcY = sizeSrc * ratioY + this.clampY;

    const lng =
      ImuvConstants.CITY_MAP.LEFT +
      (pixelSrcX *
        (ImuvConstants.CITY_MAP.RIGHT - ImuvConstants.CITY_MAP.LEFT)) /
        this.imageCityMap.width;
    const lat =
      ImuvConstants.CITY_MAP.TOP -
      (pixelSrcY *
        (ImuvConstants.CITY_MAP.TOP - ImuvConstants.CITY_MAP.BOTTOM)) /
        this.imageCityMap.height;

    return [lng, lat];
  }

  coordToPixel(lng, lat, ImuvConstants) {
    const sizeSrc =
      Math.min(this.imageCityMap.width, this.imageCityMap.height) *
      this.currentZoom;

    const pixelSrcX =
      ((lng - ImuvConstants.CITY_MAP.LEFT) * this.imageCityMap.width) /
      (ImuvConstants.CITY_MAP.RIGHT - ImuvConstants.CITY_MAP.LEFT);

    const pixelSrcY =
      (-(lat - ImuvConstants.CITY_MAP.TOP) * this.imageCityMap.height) /
      (ImuvConstants.CITY_MAP.TOP - ImuvConstants.CITY_MAP.BOTTOM);

    const ratioX = (pixelSrcX - this.clampX) / sizeSrc;
    const ratioY = (pixelSrcY - this.clampY) / sizeSrc;

    return [ratioX * CITY_MAP_SIZE, ratioY * CITY_MAP_SIZE];
  }

  coordToLocalPosition(coord, localContext) {
    //project
    const [x, y] = udviz.Game.proj4
      .default(localContext.getGameView().projection)
      .forward(coord);

    //compute local
    const wTParent = this.fetchUserCityAvatar(localContext)
      .getParent()
      .computeWorldTransform();
    const ref = localContext.getGameView().getObject3D().position;

    return {
      x: x - wTParent.position.x - ref.x,
      y: y - wTParent.position.y - ref.y,
    };
  }

  tick() {
    if (this.displayMap) {
      this.drawCityMap(arguments[1]);
    }
  }

  fetchCityAvatarColor(cityAvatarGO) {
    const avatarColor = cityAvatarGO.getComponent('Render').color;
    return (
      'rgb(' +
      avatarColor.r * 255 +
      ',' +
      avatarColor.g * 255 +
      ',' +
      avatarColor.b * 255 +
      ')'
    );
  }

  cityAvatarToGeoData(cityAvatarGO, gameView) {
    const wT = cityAvatarGO.computeWorldTransform();
    const ref = gameView.getObject3D().position;
    const worldPos = new udviz.THREE.Vector3(
      wT.position.x,
      wT.position.y,
      0
    ).add(ref);
    const [lng, lat] = udviz.Game.proj4
      .default(gameView.projection)
      .inverse([worldPos.x, worldPos.y]);

    return [lng, lat, wT.rotation];
  }

  drawCityMap(localContext) {
    const ctx = this.canvas.getContext('2d');

    //draw citymap
    const ImuvConstants = localContext.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];

    const sizeSrc =
      Math.min(this.imageCityMap.width, this.imageCityMap.height) *
      this.currentZoom;

    //compute lng lat of user city avatar
    const userCityAvatar = this.fetchUserCityAvatar(localContext);
    const [lng, lat, rotation] = this.cityAvatarToGeoData(
      userCityAvatar,
      localContext.getGameView()
    );

    const pixelSrcX =
      (this.imageCityMap.width * (lng - ImuvConstants.CITY_MAP.LEFT)) /
      (ImuvConstants.CITY_MAP.RIGHT - ImuvConstants.CITY_MAP.LEFT);

    const pixelSrcY =
      this.imageCityMap.height *
      (1 -
        (lat - ImuvConstants.CITY_MAP.BOTTOM) /
          (ImuvConstants.CITY_MAP.TOP - ImuvConstants.CITY_MAP.BOTTOM));

    const clampX = Math.min(
      Math.max(0, pixelSrcX - sizeSrc * 0.5),
      this.imageCityMap.width - sizeSrc
    );

    const clampY = Math.min(
      Math.max(0, pixelSrcY - sizeSrc * 0.5),
      this.imageCityMap.height - sizeSrc
    );

    //bufferize
    this.clampX = clampX;
    this.clampY = clampY;

    ctx.drawImage(
      this.imageCityMap,
      clampX,
      clampY,
      sizeSrc,
      sizeSrc,
      0,
      0,
      CITY_MAP_SIZE,
      CITY_MAP_SIZE
    );

    //draw city avatars
    const _this = this;

    this.currentDt += localContext.getDt() * 0.002;
    const userAvatarSize =
      CITY_AVATAR_SIZE_MIN +
      (CITY_AVATAR_SIZE_MAX - CITY_AVATAR_SIZE_MIN) *
        Math.abs(Math.cos(this.currentDt));

    const drawCityAvatar = function (cityAvatarGO, size) {
      const [lngCityAvatar, latCityAvatar, rotationAvatar] =
        _this.cityAvatarToGeoData(cityAvatarGO, localContext.getGameView());

      const rotationValue = -rotationAvatar.z - Math.PI;
      const cos = Math.cos(rotationValue);
      const sin = Math.sin(rotationValue);

      const xRot = function (x, y) {
        return x * cos - y * sin;
      };

      const yRot = function (x, y) {
        return y * cos + x * sin;
      };

      const [cityAvatarPosX, cityAvatarPosY] = _this.coordToPixel(
        lngCityAvatar,
        latCityAvatar,
        ImuvConstants
      );

      const ratioTriangle = 0.6;
      ctx.beginPath();
      ctx.moveTo(
        cityAvatarPosX + xRot(-size * 0.5, -size * ratioTriangle),
        cityAvatarPosY + yRot(-size * 0.5, -size * ratioTriangle)
      );
      ctx.lineTo(
        cityAvatarPosX + xRot(size * 0.5, -size * ratioTriangle),
        cityAvatarPosY + yRot(size * 0.5, -size * ratioTriangle)
      );
      ctx.lineTo(
        cityAvatarPosX + xRot(0, size * ratioTriangle),
        cityAvatarPosY + yRot(0, size * ratioTriangle)
      );
      ctx.closePath();
      ctx.fillStyle = _this.fetchCityAvatarColor(cityAvatarGO);
      ctx.fill();
    };

    //draw all city avatar
    localContext.getRootGameObject().traverse(function (child) {
      const ls = child.fetchLocalScripts();
      if (ls && ls['city_avatar']) {
        if (child == userCityAvatar) {
          drawCityAvatar(child, userAvatarSize);
        } else {
          drawCityAvatar(child, CITY_AVATAR_SIZE_MIN);
        }
        return false;
      }

      return false;
    });

    //draw pings
    for (let i = this.pings.length - 1; i >= 0; i--) {
      const ping = this.pings[i];

      const [lngPing, latPing] = ping.getCoord();

      const [x, y] = this.coordToPixel(lngPing, latPing, ImuvConstants);

      if (ping.draw(ctx, localContext.getDt(), x, y)) {
        //end remove it
        this.pings.splice(i, 1);
      }
    }

    //feedbacks clickable
    if (this.canvas.style.cursor == 'pointer') {
      const brightnessValue =
        100 + (105 - 100) * Math.abs(Math.cos(this.currentDt));
      ctx.filter = 'brightness(' + brightnessValue + '%)';
    } else {
      ctx.filter = 'brightness(100%)';
    }
  }
};

class Ping {
  constructor(params) {
    this.coord = params.coord;
    this.color = params.color;

    this.duration = params.duration || 2000;
    this.maxSize = params.maxSize || 20;
    this.currentTime = 0;
  }

  getCoord() {
    return this.coord;
  }

  draw(context2D, dt, x, y) {
    this.currentTime += dt;

    //draw context2D
    const radius = (this.maxSize * this.currentTime) / this.duration;
    context2D.beginPath();
    context2D.lineWidth = 3;
    context2D.strokeStyle = this.color;
    context2D.arc(x, y, radius, 0, 2 * Math.PI);
    context2D.stroke();

    if (this.currentTime >= this.duration) {
      return true;
    } else {
      return false;
    }
  }
}
