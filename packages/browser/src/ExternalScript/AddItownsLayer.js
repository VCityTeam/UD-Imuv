import {
  ExternalGame,
  FileUtil,
  add3DTilesLayers,
  addElevationLayer,
  addBaseMapLayer,
} from '@ud-viz/browser';

export class AddItownsLayer extends ExternalGame.ScriptBase {
  init() {
    // TODO path should be in variables
    FileUtil.loadMultipleJSON([
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
}
