module.exports = {
  //imuv url event
  URL_PARAMETER: {
    ID_KEY: 'url_parameter_event_id_key',
    EVENT: {
      TELEPORT_AVATAR_WORLD: {
        //data structure of this event
        ID_VALUE: 'teleport_avatar_world_ID', //ID is mandatory
        PARAMS_KEY: {
          POSITION: 'position',
          ROTATION: 'rotation',
          WORLDUUID: 'worldUUID',
        },
      },
    },
  },
  //different imuv role
  USER: {
    ROLE: {
      ADMIN: 'admin',
      GUEST: 'guest',
      DEFAULT: 'default',
    },
  },
  //world imuv event
  WORLD: {
    EVENT: {
      PORTAL: 'portal',
    },
  },
  /**
   * Define the type of message of a websocket communication between client and imuv server
   */
  WEBSOCKET: {
    MSG_TYPES: {
      //client => server
      SAVE_SETTINGS: 'save_settings', //save client settings on server
      SAVE_AVATAR: 'save_avatar', //save client avatar on server
      QUERY_AVATAR: 'query_avatar', //ask server to send avatar json
      ADD_GAMEOBJECT: 'add_gameobject', //add a go in world
      COMMANDS: 'cmds', //commands to apply to a world
      SIGN_UP: 'sign_up', //sign up
      SIGN_IN: 'sign_in', //sign in
      READY_TO_RECEIVE_STATE: 'ready_to_receive_state', //client game is ready to receive the join_world
      SAVE_WORLDS: 'save_worlds', //save new worlds on server
      CREATE_BBB_ROOM: 'create_bbb_room', //query bbb url
      EDIT_CONF_COMPONENT: 'edit_conf_comp', //modify conf of a go component
      //server => client
      JOIN_WORLD: 'join_world', //first complete worldstate when joining a world
      WORLDSTATE_DIFF: 'worldstate_diff', //diff of worldstate
      SERVER_ALERT: 'server_alert', //alert client with a message
      SIGN_UP_SUCCESS: 'sign_up_success', //sign up
      SIGNED: 'signed', //client is signed in imuv server
      ON_BBB_URL: 'on_bbb_url', //return a bbb url
      ON_AVATAR: 'on_avatar', //return avatar json
    },
  },
  //city map data
  CITY_MAP: {
    PATH: './assets/img/citymap.png',
    TOP: 45.81186,
    BOTTOM: 45.70455,
    LEFT: 4.76623,
    RIGHT: 4.90291,
  },
  //db key
  DB: {
    USER: {
      NAME: 'username', //name of the user
      EMAIL: 'email', //email of the user
      PASSWORD: 'password', //pwd of the user
      ROLE: 'role', //role of the user
      AVATAR: 'avatar', //json string of the user gameobject avatar
      SETTINGS: 'settings', //json string of the user settings
    },
  },
  JITSI: {
    PUBLIC_URL: JITSI_PUBLIC_URL,
  },
  WBO: {
    PUBLIC_URL: WBO_PUBLIC_URL,
  },
};
