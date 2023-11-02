import * as proj4 from 'proj4';
import * as THREE from 'three';
import { ScriptBase } from '@ud-viz/game_browser';
import { Command, RenderComponent } from '@ud-viz/game_shared';

import { MAP_CLICK_MODE, CITY_MAP, COMMAND } from '../../shared/constant';

const CITY_MAP_SIZE = 500;
const CITY_AVATAR_SIZE_MIN = 15;
const CITY_AVATAR_SIZE_MAX = 25;
const CITY_MAP_CMD_ID = 'city_map_cmd_id';

export class CityMap extends ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.domElement = document.createElement('div');

    this.canvas = document.createElement('canvas');
    this.canvas.width = CITY_MAP_SIZE;
    this.canvas.height = CITY_MAP_SIZE;
    this.domElement.appendChild(this.canvas);

    this.imageCityMap = document.createElement('img');

    this.currentDt = 0;

    this.currentZoom = 1;

    // buffer
    this.clampX = 0;
    this.clampY = 0;

    this.canvas.onwheel = (event) => {
      const newZoom = this.currentZoom - event.wheelDelta * 0.0002;
      this.setCurrentZoom(newZoom);
    };

    this.displayMap = false;

    this.pings = [];
  }

  /**
   * Map interface
   * @param {*} mode
   */
  setClickMode(mode) {
    this.clickMode = mode;

    if (mode == MAP_CLICK_MODE.DEFAULT) {
      this.setCursorPointer(false);
    } else if (mode == MAP_CLICK_MODE.PING) {
      this.setCursorPointer(true);
    } else if (mode == MAP_CLICK_MODE.TELEPORT) {
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
   * Map interface TODO create an abstract class
   * @returns
   */
  getDomElement() {
    return this.domElement;
  }

  fetchUserCityAvatar() {
    return this.context.object3D
      .getObjectByProperty('uuid', this.context.userData.avatar.uuid)
      .getObjectByProperty('name', 'city_avatar'); // TODO use isCityAvatar flag in userData
  }

  init() {
    // init src
    this.imageCityMap.src = CITY_MAP.PATH;

    this.context.inputManager.addMouseCommand(
      CITY_MAP_CMD_ID,
      'click',
      (event) => {
        if (event.target != this.canvas) return null;
        const x = event.pageX;
        const y = event.pageY;

        const rect = event.target.getBoundingClientRect();
        const ratioX = (x - rect.left) / (rect.right - rect.left);
        const ratioY = (y - rect.top) / (rect.bottom - rect.top);

        const coord = this.pixelToCoord(ratioX, ratioY);

        const userCityAvatar = this.fetchUserCityAvatar();

        if (this.clickMode === MAP_CLICK_MODE.DEFAULT) {
          // nothing
          this.setClickMode(MAP_CLICK_MODE.DEFAULT);
          return null;
        } else if (this.clickMode === MAP_CLICK_MODE.TELEPORT) {
          this.setClickMode(MAP_CLICK_MODE.DEFAULT);
          return new Command({
            type: COMMAND.TELEPORT,
            data: {
              object3DUUID: this.object3D.uuid,
              position: this.coordToLocalPosition(coord),
              cityAvatarUUID: userCityAvatar.uuid,
            },
          });
        } else if (this.clickMode === MAP_CLICK_MODE.PING) {
          this.setClickMode(MAP_CLICK_MODE.DEFAULT);

          return new Command({
            type: COMMAND.PING,
            data: {
              object3DUUID: this.object3D.uuid,
              coord: coord,
              color: this.fetchCityAvatarColor(userCityAvatar),
            },
          });
        }
      }
    );
  }

  onOutdated() {
    this.variables.city_map_ping.forEach(function (data) {
      const ping = new Ping({
        coord: data.coord,
        color: data.color,
      });
      this.pings.push(ping);
    });
  }

  setCursorPointer(value) {
    if (value) {
      this.canvas.style.cursor = 'pointer';
    } else {
      this.canvas.style.cursor = 'auto';
    }
  }

  // zoom is clamp between 0->1
  setCurrentZoom(value) {
    this.currentZoom = Math.min(1, Math.max(0.02, value));
  }

  pixelToCoord(ratioX, ratioY) {
    const sizeSrc =
      Math.min(this.imageCityMap.width, this.imageCityMap.height) *
      this.currentZoom;

    const pixelSrcX = sizeSrc * ratioX + this.clampX;
    const pixelSrcY = sizeSrc * ratioY + this.clampY;

    const lng =
      CITY_MAP.LEFT +
      (pixelSrcX * (CITY_MAP.RIGHT - CITY_MAP.LEFT)) / this.imageCityMap.width;
    const lat =
      CITY_MAP.TOP -
      (pixelSrcY * (CITY_MAP.TOP - CITY_MAP.BOTTOM)) / this.imageCityMap.height;

    return [lng, lat];
  }

  coordToPixel(lng, lat) {
    const sizeSrc =
      Math.min(this.imageCityMap.width, this.imageCityMap.height) *
      this.currentZoom;

    const pixelSrcX =
      ((lng - CITY_MAP.LEFT) * this.imageCityMap.width) /
      (CITY_MAP.RIGHT - CITY_MAP.LEFT);

    const pixelSrcY =
      (-(lat - CITY_MAP.TOP) * this.imageCityMap.height) /
      (CITY_MAP.TOP - CITY_MAP.BOTTOM);

    const ratioX = (pixelSrcX - this.clampX) / sizeSrc;
    const ratioY = (pixelSrcY - this.clampY) / sizeSrc;

    return [ratioX * CITY_MAP_SIZE, ratioY * CITY_MAP_SIZE];
  }

  coordToLocalPosition(coord) {
    // project
    const [x, y] = proj4
      .default(this.context.userData.extent.crs)
      .forward(coord);

    // compute local
    const parent = this.fetchUserCityAvatar().parent;
    const gamePositionParent = new THREE.Vector3();
    parent.matrixWorld.decompose(gamePositionParent);
    gamePositionParent.sub(this.context.object3D.position);

    console.log('not sure if well reimplemented');

    return {
      x: x - gamePositionParent.x,
      y: y - gamePositionParent.y,
    };
  }

  tick() {
    if (this.displayMap) {
      this.drawCityMap();
    }
  }

  fetchCityAvatarColor(cityAvatar) {
    const avatarColor = cityAvatar
      .getComponent(RenderComponent.TYPE)
      .getModel()
      .getColor();
    return (
      'rgb(' +
      avatarColor[0] * 255 +
      ',' +
      avatarColor[1] * 255 +
      ',' +
      avatarColor[2] * 255 +
      ')'
    );
  }

  cityAvatarToGeoData(cityAvatarGO) {
    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Vector3();
    cityAvatarGO.matrixWorld.decompose(worldPosition, worldQuaternion);

    const [lng, lat] = proj4
      .default(this.context.userData.extent.crs)
      .inverse([worldPosition.x, worldPosition.y]);

    return [lng, lat, new THREE.Euler().setFromQuaternion(worldQuaternion)];
  }

  drawCityMap() {
    const ctx = this.canvas.getContext('2d');

    const sizeSrc =
      Math.min(this.imageCityMap.width, this.imageCityMap.height) *
      this.currentZoom;

    // compute lng lat of user city avatar
    const userCityAvatar = this.fetchUserCityAvatar();
    const [lng, lat] = this.cityAvatarToGeoData(userCityAvatar);

    const pixelSrcX =
      (this.imageCityMap.width * (lng - CITY_MAP.LEFT)) /
      (CITY_MAP.RIGHT - CITY_MAP.LEFT);

    const pixelSrcY =
      this.imageCityMap.height *
      (1 - (lat - CITY_MAP.BOTTOM) / (CITY_MAP.TOP - CITY_MAP.BOTTOM));

    const clampX = Math.min(
      Math.max(0, pixelSrcX - sizeSrc * 0.5),
      this.imageCityMap.width - sizeSrc
    );

    const clampY = Math.min(
      Math.max(0, pixelSrcY - sizeSrc * 0.5),
      this.imageCityMap.height - sizeSrc
    );

    // bufferize
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

    // draw city avatars

    this.currentDt += this.context.dt * 0.002;
    const userAvatarSize =
      CITY_AVATAR_SIZE_MIN +
      (CITY_AVATAR_SIZE_MAX - CITY_AVATAR_SIZE_MIN) *
        Math.abs(Math.cos(this.currentDt));

    const drawCityAvatar = function (cityAvatarGO, size) {
      const [lngCityAvatar, latCityAvatar, rotationAvatar] =
        this.cityAvatarToGeoData(cityAvatarGO);

      const rotationValue = -rotationAvatar.z - Math.PI;
      const cos = Math.cos(rotationValue);
      const sin = Math.sin(rotationValue);

      const xRot = function (x, y) {
        return x * cos - y * sin;
      };

      const yRot = function (x, y) {
        return y * cos + x * sin;
      };

      const [cityAvatarPosX, cityAvatarPosY] = this.coordToPixel(
        lngCityAvatar,
        latCityAvatar
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
      ctx.fillStyle = this.fetchCityAvatarColor(cityAvatarGO);
      ctx.fill();
    };

    // draw all city avatar
    this.context.object3D.traverse((child) => {
      if (!child.isCityAvatar) return;
      if (child == userCityAvatar) {
        drawCityAvatar(child, userAvatarSize);
      } else {
        drawCityAvatar(child, CITY_AVATAR_SIZE_MIN);
      }
    });

    // draw pings
    for (let i = this.pings.length - 1; i >= 0; i--) {
      const ping = this.pings[i];

      const [lngPing, latPing] = ping.getCoord();

      const [x, y] = this.coordToPixel(lngPing, latPing);

      if (ping.draw(ctx, this.context.dt, x, y)) {
        // end remove it
        this.pings.splice(i, 1);
      }
    }

    // feedbacks clickable
    if (this.canvas.style.cursor == 'pointer') {
      const brightnessValue =
        100 + (105 - 100) * Math.abs(Math.cos(this.currentDt));
      ctx.filter = 'brightness(' + brightnessValue + '%)';
    } else {
      ctx.filter = 'brightness(100%)';
    }
  }

  static get ID_SCRIPT() {
    return 'city_map_id_ext_script';
  }
}

// TODO could write in component since minimap is using it as well
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

    // draw context2D
    const radius = (this.maxSize * this.currentTime) / this.duration;
    context2D.beginPath();
    context2D.lineWidth = 3;
    context2D.strokeStyle = this.color;
    context2D.arc(x, y, radius, 0, 2 * Math.PI);
    context2D.stroke();

    if (this.currentTime >= this.duration) {
      return true;
    }
    return false;
  }
}
