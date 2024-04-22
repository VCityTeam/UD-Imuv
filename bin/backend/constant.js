module.exports = {
  THREAD: {
    EVENT: {
      PORTAL: 'portal_imuv_event',
      SPAWN: 'spawn_imuv_event',
      EDIT_AVATAR: 'edit_avatar_message',
    },
  },
  PARSE: {
    KEY: {
      NAME: 'username', // must be this value for Parse to signUp
      PASSWORD: 'password', // must be this value for Parse to signUp
      USER_ID: 'user_id',
      ROLE: 'key_role',
      SETTINGS: {
        FOG: 'fogValue',
        ZOOM_FACTOR: 'zoomFactor',
        MOUSE_SENSITIVITY: 'mouseSensitivitySlider',
        VOLUME: 'volumeValue',
        SUN_CHECK: 'sunValue',
        SHADOW_CHECK: 'shadowValue',
        SHADOW_MAP_SIZE: 'shadowMapSize',
        ID: 'settings_id',
      },

      AVATAR_COLOR: 'avatar_color_key',
      AVATAR_TEXTURE_FACE_PATH: 'avatar_texture_face_path_key',
      AVATAR_ID_RENDER_DATA: 'avatar_id_render_data_key',
    },
    CLASS: {
      SETTINGS: 'Settings',
    },
  },
};
