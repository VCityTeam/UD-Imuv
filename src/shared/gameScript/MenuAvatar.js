const {
  ScriptBase,
  RenderComponent,
  ExternalScriptComponent,
} = require('@ud-viz/game_shared');
const { COMMAND } = require('../constant');

module.exports = class MenuAvatar extends ScriptBase {
  tick() {
    this.applyCommandCallbackOf(COMMAND.EDIT_AVATAR, (data) =>
      MenuAvatar.editAvatar(this.object3D, data)
    );
  }

  static editAvatar(avatar, data) {
    const renderComp = avatar.getComponent(RenderComponent.TYPE);

    if (data.idRenderData) {
      renderComp.model.idRenderData = data.idRenderData;
      avatar.setOutdated(true);
    }

    if (data.color) {
      renderComp.model.color = data.color;
      avatar.setOutdated(true);
    }

    if (data.textureFacePath) {
      const extScriptComp = avatar.getComponent(ExternalScriptComponent.TYPE);
      extScriptComp.model.variables.path_face_texture = data.textureFacePath;
      avatar.setOutdated(true);
    }
  }

  static get ID_SCRIPT() {
    return 'menu_avatar_game_script_id';
  }
};
