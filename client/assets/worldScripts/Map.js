/** @format */

module.exports = class Map {
  constructor(conf) {
    this.conf = conf;
    this.heightmapSize = null; //size of the heightmap
    this.heightValues = []; //values extract from heightmap
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
        _this.heightmapSize = { width: img.width, height: img.height };

        const hMin = conf.heightmap_geometry.heightmap_min;
        const hMax = conf.heightmap_geometry.heightmap_max;

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
          _this.heightmapSize = size;
          let png = new PNG();
          png.end(buffer);
          png.on('parsed', function (imgDataHeight) {
            const hMin = conf.heightmap_geometry.heightmap_min;
            const hMax = conf.heightmap_geometry.heightmap_max;
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

  updateElevation(gameObject) {
    const getHeightValue = function (conf, x, y, size, values) {
      //console.log(data)
      const bbox = conf.heightmap_geometry.bounding_box;

      const pixelWorldUnit = {
        width: (bbox.max.x - bbox.min.x) / size.width,
        height: (bbox.max.y - bbox.min.y) / size.height,
      };

      const coordHeightmap = {
        x: x / pixelWorldUnit.width,
        y: (bbox.max.y - bbox.min.y - y) / pixelWorldUnit.height, //y is inverse
      };

      const indexMin = {
        i: Math.floor(coordHeightmap.x),
        j: Math.floor(coordHeightmap.y),
      };

      const getPixelHeight = function (i, j, weight) {
        //clamp
        let out = false;
        if (i >= size.width) {
          // console.log('out of bound X >');
          out = true;
        } else if (i < 0) {
          // console.log('out of bound X <');
          out = true;
        } else if (j >= size.height) {
          // console.log('out of bound Y >');
          out = true;
        } else if (j < 0) {
          // console.log('out of bound Y <');
          out = true;
        }

        let result;
        if (out) {
          result = -1; //if negative means out
        } else {
          result = values[i + j * size.width];
          if (Math.abs(result - conf.heightmap_geometry.heightmap_min) < 0.0001)
            result = -1; //negative => out
        }
        return weight * result;
      };

      return getPixelHeight(indexMin.i, indexMin.j, 1);
    };

    const elevation = getHeightValue(
      this.conf,
      gameObject.getPosition().x,
      gameObject.getPosition().y,
      this.heightmapSize,
      this.heightValues
    );

    if (elevation > 0) {
      gameObject.getPosition().z = elevation;
      return true;
    } else {
      return false;
    }
  }
};
