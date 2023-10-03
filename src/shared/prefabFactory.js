const { Game } = require('@ud-viz/shared');
const Avatar = require('./GameScript/Avatar');
const InteractionZone = require('./GameScript/InteractionZone');

// TODO
const CONSTANT_TYPE_GO = {
  postit: 'postit',
};

module.exports = {
  postIt: () => {
    return new Game.Object3D({
      name: 'Post_it',
      userData: {
        typePrefab: CONSTANT_TYPE_GO.postit, // think about that
      },
      static: true,
      components: {
        Render: {
          type: 'Render',
          idRenderData: 'quad',
          color: [1, 1, 0, 1],
        },
        ExternalScript: {
          idScripts: ['post_it_id_ext_script'],
          type: 'ExternalScript',
        },
      },
      matrix: [0.2, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 1],
    });
  },
  box3D: () => {
    return new Game.Object3D({
      name: 'Box_3D',
      static: false,
      userData: {
        isBox3D: true,
      },
      components: {
        Render: {
          type: 'Render',
          idRenderData: 'cube',
          color: [1, 1, 1, 1],
        },
      },
    });
  },
  avatar: () => {
    return new Game.Object3D({
      name: 'Avatar',
      userData: {
        isAvatar: true,
      },
      components: {
        Collider: {
          type: 'Collider',
          shapes: [
            {
              type: 'Circle',
              center: { x: 0, y: 0 },
              radius: 0.3244298395697931,
            },
          ],
          body: true,
        },
        Render: {
          type: 'Render',
          idRenderData: 'avatar_moyen',
          name: 'avatar_name',
        },
        GameScript: {
          idScripts: [Avatar.ID_SCRIPT],
          type: 'GameScript',
        },
        ExternalScript: {
          idScripts: [
            'visible_id_ext_script',
            'sprite_name_id_ext_script',
            'texture_face_id_ext_script',
          ],
          variables: {
            visible: true,
            name: 'default_name',
            path_face_texture: './assets/img/avatar/default.jpeg',
          },
          type: 'ExternalScript',
        },
      },
    });
  },
  butterflyArea: () => {
    return new Game.Object3D({
      name: 'ButterflyArea',
      type: 'GameObject',
      static: true,
      components: {
        Collider: {
          type: 'Collider',
          shapes: [
            {
              type: 'Circle',
              center: { x: 0, y: 0 },
              radius: 10,
            },
          ],
          body: false,
        },
        Render: {
          type: 'Render',
          idRenderData: 'torus',
          color: [1, 0, 0, 1],
        },
        ExternalScript: {
          idScripts: [
            'local_interactions_id_ext_script',
            'butterfly_spawner_id_ext_script',
          ],
          type: 'ExternalScript',
        },
        GameScript: {
          idScripts: [InteractionZone.ID_SCRIPT],
          type: 'GameScript',
        },
      },
      children: [],
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0, 'ZXY'],
        scale: [1, 1, 1],
      },
    });
  },
  cameraTour: () => {
    return new Game.Object3D({
      name: 'CameraTour',
      type: 'GameObject',
      static: true,
      components: {
        ExternalScript: {
          idScripts: ['camera_tour_id_ext_script'],
          variables: {
            camera_transform: [],
          },
          type: 'ExternalScript',
        },
      },
    });
  },
  whiteboardPlane: () => {
    return new Game.Object3D({
      name: 'WhiteboardPlane',
      type: 'GameObject',
      static: true,
      components: {
        Render: {
          type: 'Render',
          idRenderData: null,
          color: [1, 1, 1, 1],
        },
        ExternalScript: {
          idScripts: ['whiteboard_id_ext_script', 'clickable_id_ext_script'],
          variables: {
            name: 'default_name',
            factorWidth: 3,
            factorHeight: 3,
          },
          type: 'ExternalScript',
        },
      },
      transform: {
        position: [0, 0, 0],
        rotation: [1.57, 0, 0, 'ZXY'],
        scale: [1, 1, 1],
      },
    });
  },
  miniMap: () => {
    return new Game.Object3D({
      name: 'MiniMap',
      type: 'GameObject',
      static: true,
      components: {
        ExternalScript: {
          idScripts: ['mini_map_id_ext_script'],
          variables: {
            mini_map_no_teleport: [],
            mini_map_ping: [],
            mini_map_size: 232,
          },
          type: 'ExternalScript',
        },
        GameScript: {
          idScripts: ['mini_map_id_script'],
          type: 'GameScript',
        },
      },
    });
  },
  image: () => {
    return new Game.Object3D({
      name: 'Image',
      type: 'GameObject',
      static: true,
      components: {
        Render: {
          type: 'Render',
          idRenderData: null,
          color: [1, 1, 1, 1],
        },
        ExternalScript: {
          idScripts: ['image_id_ext_script'],
          variables: {
            path: './assets/img/labex_imu.jpeg',
            factorWidth: 3,
            factorHeight: 3,
            gpsCoord: { lng: null, lat: null, checked: false },
          },
          type: 'ExternalScript',
        },
        Audio: {
          sounds: ['open_popup'],
          type: 'Audio',
        },
      },
      transform: {
        position: [0, 0, 0],
        rotation: [1.5707, 1.5707, 0],
        scale: [1, 1, 1],
      },
      userData: { isImage: true },
    });
  },
  portal: () => {
    return new Game.Object3D({
      name: 'Portal',
      type: 'GameObject',
      static: true,
      components: {
        Render: {
          type: 'Render',
          idRenderData: 'spiral_spawn',
          color: [1, 1, 1, 1],
        },
        Collider: {
          type: 'Collider',
          shapes: [
            {
              type: 'Circle',
              center: { x: 0, y: 0 },
              radius: 0.7,
            },
          ],
          body: false,
        },
        GameScript: {
          idScripts: ['portal_id_script', 'interaction_zone_id_script'],
          variables: {
            gameObjectDestUUID: null,
            portalUUID: null,
            spawnRotation: {
              x: 0,
              y: 0,
              z: 0,
            },
            delay: 1000,
          },
          type: 'GameScript',
        },
        ExternalScript: {
          idScripts: [
            'rotate_id_ext_script',
            'local_interactions_id_ext_script',
            'portal_sweep_id_ext_script',
          ],
          variables: { speed: 0.001 },
          type: 'ExternalScript',
        },
        Audio: {
          sounds: ['portal_in'],
          type: 'Audio',
        },
      },
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0, 'ZXY'],
        scale: [0.6, 0.6, 1],
      },
      userData: { isPortal: true },
    });
  },
  jitsiArea: () => {
    return new Game.Object3D({
      name: 'JitsiArea',
      type: 'GameObject',
      static: true,
      forceSerializeComponents: ['Collider'],
      components: {
        Collider: {
          type: 'Collider',
          shapes: [],
          body: false,
        },
        Render: {
          type: 'Render',
          idRenderData: null,
          color: [0, 0.5, 1, 1],
        },
        ExternalScript: {
          idScripts: [
            'local_interactions_id_ext_script',
            'jitsi_area_id_ext_script',
          ],
          variables: {
            jitsi_room_name: 'default',
          },
          type: 'ExternalScript',
        },
        GameScript: {
          idScripts: ['interaction_zone_id_script'],
          type: 'GameScript',
        },
      },
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0, 'ZXY'],
        scale: [1, 1, 1],
      },
    });
  },
  mouseIcon: () => {
    return new Game.Object3D({
      name: 'MouseIcon',
      type: 'GameObject',
      static: true,
      components: {
        Render: {
          type: 'Render',
          idRenderData: 'mouse',
          color: [1, 1, 1, 1],
        },
        ExternalScript: {
          idScripts: [
            'clickable_id_ext_script',
            'rotate_id_ext_script',
            'display_media_id_ext_script',
          ],
          conf: { speed: 0.0005, iframe_src: null, sound_id: null },
          type: 'ExternalScript',
        },
        Audio: {
          sounds: [],
          conf: {},
          type: 'Audio',
        },
      },
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    });
  },
};
