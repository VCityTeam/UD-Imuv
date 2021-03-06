/** @format */

const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

const OFFSET_ELEVATION = 0.2;

module.exports = class Map {
  constructor(conf, GameBundle) {
    this.conf = conf;
    this.heightmapSize = 0; //size of the heightmap
    this.heightValues = []; //values extract from heightmap
    Game = GameBundle;
  }

  loadLocal() {
    const _this = this;
    return new Promise((resolve, reject) => {
      const gameObject = arguments[0];
      const conf = this.conf;

      const img = document.createElement('img');
      img.src = conf.heightmap_path;

      //callback of the img
      img.onload = function () {
        _this.heightmapSize = img.width;
        if (img.width != img.height)
          throw new Error('heightmap must be square image');

        const hMin = conf.heightmap_geometry.min;
        const hMax = conf.heightmap_geometry.max;

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0);
        const imgDataHeight = ctx.getImageData(
          0,
          0,
          img.width,
          img.height
        ).data;

        for (let index = 0; index < imgDataHeight.length; index += 4) {
          let heightValue = imgDataHeight[index] / 255;
          heightValue = heightValue * (hMax - hMin) + hMin;
          _this.heightValues.push(heightValue);
        }
        resolve();
      };

      img.onerror = reject;
    });
  }

  loadServer() {
    const modules = arguments[3];
    return new Promise((resolve, reject) => {
      const gameObject = arguments[0];
      const gm = modules.gm;
      const PNG = modules.PNG;

      const conf = this.conf;

      //recompute dynamically path
      let path = conf.heightmap_path;
      const index = path.indexOf('/assets');
      path = '../client/' + path.slice(index);
      const heightmap = gm(path);
      const _this = this;

      //TODO check if gm is well installed

      heightmap.toBuffer('png', function (err, buffer) {
        if (err) {
          throw new Error(
            'Check your installation of gm/imageMagick binary !! ' + err
          );
        }
        heightmap.size(function (err, size) {
          if (err) {
            throw new Error('size ' + err);
          }
          _this.heightmapSize = size.width;
          if (size.width != size.height)
            throw new Error('heightmap must be square image');

          const png = new PNG();
          png.end(buffer);
          png.on('parsed', function (imgDataHeight) {
            const hMin = conf.heightmap_geometry.min;
            const hMax = conf.heightmap_geometry.max;
            for (let index = 0; index < imgDataHeight.length; index += 4) {
              let heightValue = imgDataHeight[index] / 255;
              heightValue = heightValue * (hMax - hMin) + hMin;
              _this.heightValues.push(heightValue);
            }
            resolve();
          });
        });
      });
    });
  }

  load() {
    const isServerSide = arguments[2];
    if (!isServerSide) {
      return this.loadLocal.apply(this, arguments);
    } else {
      return this.loadServer.apply(this, arguments);
    }
  }

  getHeightValue(x, y, size = this.heightmapSize, values = this.heightValues) {
    //TODO heightmap are square
    const pixelWorldUnit = {
      width: this.conf.heightmap_geometry.size / size,
      height: this.conf.heightmap_geometry.size / size,
    };

    const center = size / 2;

    const coordHeightmap = {
      x: x / pixelWorldUnit.width + center,
      y: -y / pixelWorldUnit.height + center,
    };

    // console.log(coordHeightmap);

    const indexMin = {
      i: Math.floor(coordHeightmap.x),
      j: Math.floor(coordHeightmap.y),
    };

    const hMin = this.conf.heightmap_geometry.min;

    const getPixelHeight = function (i, j, weight) {
      //clamp
      let out = false;
      if (i >= size) {
        // console.log('out of bound X >');
        out = true;
      } else if (i < 0) {
        // console.log('out of bound X <');
        out = true;
      } else if (j >= size) {
        // console.log('out of bound Y >');
        out = true;
      } else if (j < 0) {
        // console.log('out of bound Y <');
        out = true;
      }

      let result;
      if (out) {
        result = NaN; //if NaN means out
      } else {
        result = values[i + j * size];
        if (Math.abs(result - hMin) < 0.00001) result = NaN; //nan => out
      }
      return weight * result;
    };

    return getPixelHeight(indexMin.i, indexMin.j, 1);
  }

  updateElevation(gameObject) {
    let elevation = this.getHeightValue(
      gameObject.getPosition().x,
      gameObject.getPosition().y
    );

    if (!isNaN(elevation)) {
      gameObject.getPosition().z = OFFSET_ELEVATION + elevation;
      return true;
    } else {
      return false;
    }
  }

  tick() {
    const gameObject = arguments[0];
    const worldContext = arguments[1];
    const cmds = worldContext.getCommands();
    const teleportCmds = [];

    const root = gameObject.computeRoot();
    let lsMiniMap = null;
    let goMiniMap = null;
    root.traverse(function (go) {
      const lS = go.getComponent(Game.LocalScript.TYPE);
      if (lS && lS.idScripts.includes('mini_map')) {
        lsMiniMap = lS;
        goMiniMap = go;
        return true;
      }
    });

    if (!lsMiniMap) return; //world with map (worldscript) without mini_map (localscript)

    /* Clearing the array of text that is displayed when a teleport command is rejected. */
    lsMiniMap.conf.mini_map_no_teleport.length = 0;

    for (let i = cmds.length - 1; i >= 0; i--) {
      const cmd = cmds[i];
      if (cmd.getType() == Game.Command.TYPE.TELEPORT) {
        teleportCmds.push(cmd);
        cmds.splice(i, 1);
      }
    }

    const _this = this;
    teleportCmds.forEach((tpCmd) => {
      const data = tpCmd.getData();
      const result = _this.getHeightValue(data.position.x, data.position.y);
      if (isNaN(result)) {
        lsMiniMap.conf.mini_map_no_teleport.push(data);
        goMiniMap.setOutdated(true);
      } else {
        const avatarUUID = data.avatarUUID;
        const newPosition = data.position;

        const avatar = worldContext.getWorld().getGameObject().find(avatarUUID);

        if (!avatar) {
          console.warn('no avatar with UUID', avatarUUID);
        }

        avatar.setPosition(newPosition);
      }
    });
  }
};
