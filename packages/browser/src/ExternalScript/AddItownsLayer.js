import {
  Game,
  add3DTilesLayers,
  addElevationLayer,
  addBaseMapLayer,
  loadMultipleJSON,
} from '@ud-viz/browser';

export class AddItownsLayer extends Game.External.ScriptBase {
  init() {
    // TODO path should be in variables
    loadMultipleJSON([
      './assets/config/3DTilesLayer.json',
      './assets/config/elevationLayer.json',
      './assets/config/baseMapLayer.json',
    ]).then((configs) => {
      console.log(configs);

      addBaseMapLayer(
        configs['baseMapLayer'],
        this.context.frame3D.itownsView,
        this.context.userData.extent
      );

      addElevationLayer(
        configs['elevationLayer'],
        this.context.frame3D.itownsView,
        this.context.userData.extent
      );

      add3DTilesLayers(
        configs['3DTilesLayer'],
        this.context.frame3D.layerManager,
        this.context.frame3D.itownsView
      );
    });
  }

  static get ID_SCRIPT() {
    return 'add_itowns_layer_id_ext_script';
  }
}
