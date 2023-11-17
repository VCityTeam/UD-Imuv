import { ScriptBase } from '@ud-viz/game_browser';
import { ID } from '../../shared/constant';
import { addAllImuvLayers } from './component/imuvLayers';
export class AddItownsLayer extends ScriptBase {
  init() {
    addAllImuvLayers(
      this.context.frame3D.itownsView,
      this.context.userData.extent
    );
  }

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.ADD_ITOWNS_LAYER;
  }
}
