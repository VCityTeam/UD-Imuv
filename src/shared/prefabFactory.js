const { ID } = require('./constant');
const InteractionZone = require('./gameScript/InteractionZone');
const {
  Object3D,
  RenderComponent,
  ExternalScriptComponent,
} = require('@ud-viz/game_shared');

// TODO
const CONSTANT_TYPE_GO = {
  postit: 'postit',
};

module.exports = {
  postIt: () => {
    return new Object3D({
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
          scriptParams: [{ id: 'post_it_id_ext_script' }],
          type: 'ExternalScript',
        },
      },
      matrix: [0.2, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 1],
    });
  },
  box3D: () => {
    return new Object3D({
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
  avatar: (name = 'default_name') => {
    return new Object3D({
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
        },
        GameScript: {
          scriptParams: [{ id: ID.GAME_SCRIPT.AVATAR }],
          type: 'GameScript',
        },
        ExternalScript: {
          scriptParams: [
            { id: 'visible_id_ext_script' },
            { id: 'sprite_name_id_ext_script' },
            { id: 'texture_face_id_ext_script' },
          ],
          variables: {
            visible: true,
            name: name,
            path_face_texture: './assets/img/avatar/default.jpeg',
          },
          type: 'ExternalScript',
        },
      },
    });
  },
  cityAvatar: (avatar) => {
    if (!avatar.userData.isAvatar)
      throw new Error('first param must be an avatar game object3D');

    const renderComp = avatar.getComponent(RenderComponent.TYPE);
    const externalScriptComp = avatar.getComponent(
      ExternalScriptComponent.TYPE
    );

    return new Object3D({
      name: 'City_avatar',
      static: false,
      userData: {
        isCityAvatar: true,
      },
      components: {
        Render: {
          type: 'Render',
          idRenderData: renderComp.model.idRenderData,
          color: renderComp.model.color,
        },
        ExternalScript: {
          scriptParams: [
            { id: ID.EXTERNAL_SCRIPT.CITY_AVATAR },
            { id: 'sprite_name_id_ext_script' },
            { id: 'texture_face_id_ext_script' },
          ],
          variables: {
            name: externalScriptComp.model.variables.name,
            path_face_texture:
              externalScriptComp.model.variables.path_face_texture,
          },
          type: 'ExternalScript',
        },
      },
    });
  },
  butterflyArea: () => {
    return new Object3D({
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
          scriptParams: [
            { id: 'local_interactions_id_ext_script' },
            { id: 'butterfly_spawner_id_ext_script' },
          ],
          type: 'ExternalScript',
        },
        GameScript: {
          scriptParams: [{ id: InteractionZone.ID_SCRIPT }],
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
    return new Object3D({
      name: 'CameraTour',
      type: 'GameObject',
      static: true,
      components: {
        ExternalScript: {
          scriptParams: [{ id: 'camera_tour_id_ext_script' }],
          variables: {
            camera_transform: [],
          },
          type: 'ExternalScript',
        },
      },
    });
  },
  whiteboardPlane: () => {
    return new Object3D({
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
          scriptParams: [
            { id: 'whiteboard_id_ext_script' },
            { id: 'clickable_id_ext_script' },
          ],
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
    return new Object3D({
      name: 'MiniMap',
      type: 'GameObject',
      static: true,
      components: {
        ExternalScript: {
          scriptParams: [{ id: 'mini_map_id_ext_script' }],
          variables: {
            mini_map_no_teleport: [],
            mini_map_ping: [],
            mini_map_size: 232,
          },
          type: 'ExternalScript',
        },
        GameScript: {
          scriptParams: [{ id: 'mini_map_id_script' }],
          type: 'GameScript',
        },
      },
    });
  },
  image: () => {
    return new Object3D({
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
          scriptParams: [{ id: 'image_id_ext_script' }],
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
    return new Object3D({
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
          scriptParams: [
            { id: 'portal_id_script' },
            { id: 'interaction_zone_id_script' },
          ],
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
          scriptParams: [
            { id: 'rotate_id_ext_script' },
            { id: 'local_interactions_id_ext_script' },
            { id: 'portal_sweep_id_ext_script' },
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
    return new Object3D({
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
          scriptParams: [
            { id: 'local_interactions_id_ext_script' },
            { id: 'jitsi_area_id_ext_script' },
          ],
          variables: {
            jitsi_room_name: 'default',
          },
          type: 'ExternalScript',
        },
        GameScript: {
          scriptParams: [{ id: 'interaction_zone_id_script' }],
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
    return new Object3D({
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
          scriptParams: [
            { id: 'clickable_id_ext_script' },
            { id: 'rotate_id_ext_script' },
            { id: 'display_media_id_ext_script' },
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
