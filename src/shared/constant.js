module.exports = {
  // specific imuv command
  COMMAND: {
    TELEPORT: 'teleport',
    ESCAPE_CITY_AVATAR: 'escape_city_avatar',
    PING: 'ping',
    EDIT_AVATAR: 'edit_avatar',
  },
  // imuv url event
  URL_PARAMETER: {
    ID_KEY: 'url_parameter_event_id_key',
    EVENT: {
      TELEPORT_AVATAR_GAMEOBJECT3D: {
        // data structure of this event
        ID_VALUE: 'teleport_avatar_gameObject3DUUID', // ID is mandatory
        PARAMS_KEY: {
          POSITION: 'position',
          ROTATION: 'rotation',
          GAMEOBJECT3DUUID: 'gameObject3DUUID',
        },
      },
    },
  },
  // different imuv role
  PARSE: {
    VALUE: {
      ROLE_ADMIN: 'parse_role_admin',
      ROLE_DEFAULT: 'parse_role_default',
      ROLE_GUEST: 'parse_role_guest',
    },
  },
  // game context event
  CONTEXT: {
    EVENT: {
      PORTAL: 'portal',
    },
  },
  // city map data
  CITY_MAP: {
    PATH: './assets/img/citymap.png',
    TOP: 45.81186,
    BOTTOM: 45.70455,
    LEFT: 4.76623,
    RIGHT: 4.90291,
  },
  // different click mode of map
  MAP_CLICK_MODE: {
    DEFAULT: 0,
    TELEPORT: 1,
    PING: 2,
  },
  // db key
  DB: {
    USER: {
      NAME: 'username', // name of the user
      EMAIL: 'email', // email of the user
      PASSWORD: 'password', // pwd of the user
      ROLE: 'role', // role of the user
      AVATAR: 'avatar', // json string of the user gameobject avatar
      SETTINGS: 'settings', // json string of the user settings
    },
  },
  ID: {
    GAME_SCRIPT: {
      AVATAR: 'avatar_id_script',
      CITY_MAP: 'city_map_id_script',
      IMUV_COMMAND_MANAGER: 'my_command_manager_id',
      INTERACTION_ZONE: 'interaction_zone_id_script',
      MINI_MAP: 'mini_map_id_script',
      PORTAL: 'portal_id_script',
      SPAWNER: 'spawner_id_script',
      TELEPORTER: 'teleporter_id_script',
      UI: 'ui_id_script',
    },
    EXTERNAL_SCRIPT: {
      ADD_ITOWNS_LAYER: 'add_itowns_layer_id_ext_script',
      AVATAR_CONTROLLER: 'avatar_controller_id_ext_script',
      BUTTERFLY_SPAWNER: 'butterfly_spawner_id_ext_script',
      BOX_3D_TOOL: 'box3D_tool_id_ext_script',
      CAMERA_TOUR: 'camera_tour_id_ext_script',
      CITY_AVATAR: 'city_avatar_id_script',
      CITY_MAP: 'city_map_id_ext_script',
      CITY_MOCK_UP: 'city_mock_up_id_ext_script',
      CLICKABLE: 'clickable_id_ext_script',
      DISPLAY_MEDIA: 'display_media_id_ext_script',
      GEO_PROJECT: 'geo_project_id_ext_script',
      IMAGE: 'image_id_ext_script',
      ITOWNS_REFINE: 'itowns_refine_id_ext_script',
      JITSI_AREA: 'jitsi_area_id_ext_script',
      JITSI_SCREEN: 'jitsi_screen_id_ext_script',
      LOCAL_INTERACTIONS: 'local_interactions_id_ext_script',
      MINI_MAP: 'mini_map_id_ext_script',
      PLACE_POST_IT: 'place_post_it_id_ext_script',
      PORTAL_SWEEP: 'portal_sweep_id_ext_script',
      POST_IT: 'post_it_id_ext_script',
      ROTATE: 'rotate_id_ext_script',
      SIGNAGE_DISPLAYER: 'signage_displayer_id_ext_script',
      SIGNBOARD: 'signboard_id_ext_script',
      SPRITE_NAME: 'sprite_name_id_ext_script',
      STATIC_OBJECT: 'static_object_id_ext_script',
      SWITCH_ITOWNS: 'switch_itowns_id_ext_script',
      TEXTURE_FACE: 'texture_face_id_ext_script',
      UI: 'ui_id_ext_script',
      VIDEO: 'video_id_ext_script',
      VISIBLE: 'visible_id_ext_script',
      WHITEBOARD: 'whiteboard_id_ext_script',
      ZEPPELIN_CONTROLLER: 'zeppelin_controller_id_ext_script',
      ZEPPELIN_START: 'zeppelin_start_id_ext_script',
    },
    RENDER_DATA: {
      AVATAR_MOYEN: 'avatar_moyen',
      CUBE: 'cube',
      MOUSE: 'mouse',
      SPIRAL_SPAWN: 'spiral_spawn',
      TORUS: 'torus',
      QUAD: 'quad',
    },
    SOUND: {
      OPEN_POPUP: 'open_popup',
      PORTAL_IN: 'portal_in',
    },
  },
  NAME: {
    PREFAB_OBJECT: {
      AVATAR: 'Avatar',
      CAMERA_TOUR: 'Camera_tour',
      BOX_3D: 'Box_3D',
      BUTTERFLY_AREA: 'Butterfly_area',
      CITY_AVATAR: 'City_avatar',
      IMAGE: 'Image',
      JITSI_AREA: 'Jitsi_area',
      MINI_MAP: 'Mini_map',
      MOUSE_ICON: 'Mouse_icon',
      PORTAL: 'Portal',
      POST_IT: 'Post_it',
      WHITEBOARD_PLANE: 'Whiteboard_plane',
    },
  },
};
