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
        FOG: 'fog_value',
        ZOOM_FACTOR: 'zoom_factor',
        MOUSE_SENSITIVITY: 'mouse_sensitivity_slider',
        VOLUME: 'volume_value',
        SUN_CHECK: 'sun_value',
        SHADOW_CHECK: 'shadow_value',
        SHADOW_MAP_SIZE: 'shadow_map_size',
        ID: 'settings_id',
      },
      AVATAR: {
        COLOR: 'avatar_color_key',
        TEXTURE_FACE_PATH: 'avatar_texture_face_path_key',
        ID_RENDER_DATA: 'avatar_id_render_data_key',
        ID: 'avatar_id',
      },
    },
    CLASS: {
      AVATAR: 'Avatar',
      SETTINGS: 'Settings',
    },
  },
};
