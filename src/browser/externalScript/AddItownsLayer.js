import { ScriptBase } from '@ud-viz/game_browser';
import { loadMultipleJSON } from '@ud-viz/utils_browser';
import * as itowns from 'itowns';
import { CONSTANT } from './component/constant';

export class AddItownsLayer extends ScriptBase {
  init() {
    // TODO path should be in variables
    loadMultipleJSON([
      './assets/config/3DTilesLayer.json',
      './assets/config/elevationLayer.json',
      './assets/config/baseMapLayer.json',
    ]).then((configs) => {
      console.log(configs);

      this.context.frame3D.itownsView.addLayer(
        new itowns.ColorLayer(configs.baseMapLayer, {
          updateStrategy: {
            type: itowns.STRATEGY_DICHOTOMY,
            options: {},
          },
          source: new itowns.WMSSource({
            extent: this.context.userData.extent,
            name: configs.baseMapLayer.name,
            url: configs.baseMapLayer.url,
            version: configs.baseMapLayer.version,
            crs: this.context.userData.extent.crs,
            format: configs.baseMapLayer.format,
          }),
          transparent: true,
        })
      );

      const isTextureFormat =
        configs.elevationLayer.format == 'image/jpeg' ||
        configs.elevationLayer.format == 'image/png';
      this.context.frame3D.itownsView.addLayer(
        new itowns.ElevationLayer(configs.elevationLayer.layer_name, {
          useColorTextureElevation: isTextureFormat,
          colorTextureElevationMinZ: isTextureFormat
            ? configs.elevationLayer.colorTextureElevationMinZ
            : null,
          colorTextureElevationMaxZ: isTextureFormat
            ? configs.elevationLayer.colorTextureElevationMaxZ
            : null,
          source: new itowns.WMSSource({
            extent: this.context.userData.extent,
            url: configs.elevationLayer.url,
            name: configs.elevationLayer.name,
            crs: this.context.userData.extent.crs,
            heightMapWidth: 256,
            format: configs.elevationLayer.format,
          }),
        })
      );

      this.c3DTilesStyle = new itowns.Style({
        fill: {
          color: (feature) => {
            return feature.userData.selectedColor
              ? feature.userData.selectedColor
              : 'white';
          },
        },
      });

      configs['3DTilesLayer'].forEach((layerConfig) => {
        itowns.View.prototype.addLayer.call(
          this.context.frame3D.itownsView,
          new itowns.C3DTilesLayer(
            layerConfig['id'],
            {
              style: this.c3DTilesStyle,
              name: layerConfig['id'],
              source: new itowns.C3DTilesSource({
                url: layerConfig['url'],
              }),
            },
            this.context.frame3D.itownsView
          )
        );
      });

      window.dispatchEvent(new Event(CONSTANT.EVENT.ITOWNS_LAYER_ADDED));
    });
  }

  static get ID_SCRIPT() {
    return 'add_itowns_layer_id_ext_script';
  }
}
