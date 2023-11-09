const { ID, NAME } = require('./constant');
const InteractionZone = require('./gameScript/InteractionZone');
const {
  Object3D,
  RenderComponent,
  ExternalScriptComponent,
  ColliderComponent,
  GameScriptComponent,
  AudioComponent,
} = require('@ud-viz/game_shared');

// TODO
const CONSTANT_TYPE_GO = {
  postit: 'postit',
};

module.exports = {
  postIt: () => {
    return new Object3D({
      name: NAME.PREFAB_OBJECT.POST_IT,
      userData: {
        typePrefab: CONSTANT_TYPE_GO.postit, // think about that
      },
      static: true,
      components: {
        Render: {
          type: RenderComponent.TYPE,
          idRenderData: ID.RENDER_DATA.QUAD,
          color: [1, 1, 0, 1],
        },
        ExternalScript: {
          scriptParams: [{ id: ID.EXTERNAL_SCRIPT.POST_IT }],
          type: ExternalScriptComponent.TYPE,
        },
      },
      matrix: [0.2, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 1],
    });
  },
  box3D: () => {
    return new Object3D({
      name: NAME.PREFAB_OBJECT.BOX_3D,
      static: false,
      userData: {
        isBox3D: true,
      },
      components: {
        Render: {
          type: RenderComponent.TYPE,
          idRenderData: ID.RENDER_DATA.CUBE,
          color: [1, 1, 1, 1],
        },
      },
    });
  },
  avatar: (name, color, textureFacePath, idRenderData) => {
    idRenderData = idRenderData || 'avatar_petit';
    textureFacePath = textureFacePath || './assets/img/avatar/default.jpeg';
    color = color || [Math.random(), Math.random(), Math.random(), 1];

    return new Object3D({
      name: NAME.PREFAB_OBJECT.AVATAR,
      userData: {
        isAvatar: true,
      },
      components: {
        Collider: {
          type: ColliderComponent.TYPE,
          shapes: [
            {
              type: ColliderComponent.SHAPE_TYPE.CIRCLE,
              center: { x: 0, y: 0 },
              radius: 0.3244298395697931,
            },
          ],
          body: true,
        },
        Render: {
          type: RenderComponent.TYPE,
          idRenderData: idRenderData,
          color: color,
        },
        GameScript: {
          scriptParams: [{ id: ID.GAME_SCRIPT.AVATAR }],
          type: GameScriptComponent.TYPE,
        },
        ExternalScript: {
          scriptParams: [
            { id: ID.EXTERNAL_SCRIPT.VISIBLE },
            { id: ID.EXTERNAL_SCRIPT.SPRITE_NAME },
            { id: ID.EXTERNAL_SCRIPT.TEXTURE_FACE },
          ],
          variables: {
            visible: true,
            name: name,
            path_face_texture: textureFacePath,
          },
          type: ExternalScriptComponent.TYPE,
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
      name: NAME.PREFAB_OBJECT.CITY_AVATAR,
      static: false,
      userData: {
        isCityAvatar: true,
      },
      components: {
        Render: {
          type: RenderComponent.TYPE,
          idRenderData: renderComp.model.idRenderData,
          color: renderComp.model.color,
        },
        ExternalScript: {
          scriptParams: [
            { id: ID.EXTERNAL_SCRIPT.CITY_AVATAR },
            { id: ID.EXTERNAL_SCRIPT.SPRITE_NAME },
            { id: ID.EXTERNAL_SCRIPT.TEXTURE_FACE },
          ],
          variables: {
            name: externalScriptComp.model.variables.name,
            path_face_texture:
              externalScriptComp.model.variables.path_face_texture,
          },
          type: ExternalScriptComponent.TYPE,
        },
      },
    });
  },
  butterflyArea: () => {
    return new Object3D({
      name: NAME.PREFAB_OBJECT.BUTTERFLY_AREA,
      static: true,
      components: {
        Collider: {
          type: ColliderComponent.TYPE,
          shapes: [
            {
              type: ColliderComponent.SHAPE_TYPE.CIRCLE,
              center: { x: 0, y: 0 },
              radius: 10,
            },
          ],
          body: false,
        },
        Render: {
          type: RenderComponent.TYPE,
          idRenderData: ID.RENDER_DATA.TORUS,
          color: [1, 0, 0, 1],
        },
        ExternalScript: {
          scriptParams: [
            { id: ID.EXTERNAL_SCRIPT.LOCAL_INTERACTIONS },
            { id: ID.EXTERNAL_SCRIPT.BUTTERFLY_SPAWNER },
          ],
          type: ExternalScriptComponent.TYPE,
        },
        GameScript: {
          scriptParams: [{ id: InteractionZone.ID_SCRIPT }],
          type: GameScriptComponent.TYPE,
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
      name: NAME.PREFAB_OBJECT.CAMERA_TOUR,
      static: true,
      components: {
        ExternalScript: {
          scriptParams: [{ id: ID.EXTERNAL_SCRIPT.CAMERA_TOUR }],
          variables: {
            camera_transform: [],
          },
          type: ExternalScriptComponent.TYPE,
        },
      },
    });
  },
  whiteboardPlane: () => {
    return new Object3D({
      name: NAME.PREFAB_OBJECT.WHITEBOARD_PLANE,
      static: true,
      components: {
        Render: {
          type: RenderComponent.TYPE,
          idRenderData: null,
          color: [1, 1, 1, 1],
        },
        ExternalScript: {
          scriptParams: [
            { id: ID.EXTERNAL_SCRIPT.WHITEBOARD },
            { id: ID.EXTERNAL_SCRIPT.CLICKABLE },
          ],
          variables: {
            name: 'default_name',
            factorWidth: 3,
            factorHeight: 3,
          },
          type: ExternalScriptComponent.TYPE,
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
      name: NAME.PREFAB_OBJECT.MINI_MAP,
      static: true,
      components: {
        ExternalScript: {
          scriptParams: [{ id: ID.EXTERNAL_SCRIPT.MINI_MAP }],
          variables: {
            mini_map_no_teleport: [],
            mini_map_ping: [],
            mini_map_size: 232,
          },
          type: ExternalScriptComponent.TYPE,
        },
        GameScript: {
          scriptParams: [{ id: ID.GAME_SCRIPT.MINI_MAP }],
          type: GameScriptComponent.TYPE,
        },
      },
    });
  },
  image: () => {
    return new Object3D({
      name: NAME.PREFAB_OBJECT.IMAGE,
      static: true,
      components: {
        Render: {
          type: RenderComponent.TYPE,
          idRenderData: null,
          color: [1, 1, 1, 1],
        },
        ExternalScript: {
          scriptParams: [{ id: ID.EXTERNAL_SCRIPT.IMAGE }],
          variables: {
            path: './assets/img/labex_imu.jpeg',
            factorWidth: 3,
            factorHeight: 3,
            gpsCoord: { lng: null, lat: null, checked: false },
          },
          type: ExternalScriptComponent.TYPE,
        },
        Audio: {
          sounds: [ID.SOUND.PORTAL_IN],
          type: AudioComponent.TYPE,
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
      name: NAME.PREFAB_OBJECT.PORTAL,
      static: true,
      components: {
        Render: {
          type: RenderComponent.TYPE,
          idRenderData: ID.RENDER_DATA.SPIRAL_SPAWN,
          color: [1, 1, 1, 1],
        },
        Collider: {
          type: ColliderComponent.TYPE,
          shapes: [
            {
              type: ColliderComponent.SHAPE_TYPE.CIRCLE,
              center: { x: 0, y: 0 },
              radius: 0.7,
            },
          ],
          body: false,
        },
        GameScript: {
          scriptParams: [
            { id: ID.GAME_SCRIPT.PORTAL },
            { id: ID.GAME_SCRIPT.INTERACTION_ZONE },
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
          type: GameScriptComponent.TYPE,
        },
        ExternalScript: {
          scriptParams: [
            { id: ID.EXTERNAL_SCRIPT.ROTATE },
            { id: ID.EXTERNAL_SCRIPT.LOCAL_INTERACTIONS },
            { id: ID.EXTERNAL_SCRIPT.PORTAL_SWEEP },
          ],
          variables: { speed: 0.001 },
          type: ExternalScriptComponent.TYPE,
        },
        Audio: {
          sounds: [ID.SOUND.PORTAL_IN],
          type: AudioComponent.TYPE,
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
      name: NAME.PREFAB_OBJECT.JITSI_AREA,
      static: true,
      forceSerializeComponents: [ColliderComponent.TYPE],
      components: {
        Collider: {
          type: ColliderComponent.TYPE,
          shapes: [],
          body: false,
        },
        Render: {
          type: RenderComponent.TYPE,
          idRenderData: null,
          color: [0, 0.5, 1, 1],
        },
        ExternalScript: {
          scriptParams: [
            { id: ID.EXTERNAL_SCRIPT.LOCAL_INTERACTIONS },
            { id: ID.EXTERNAL_SCRIPT.JITSI_AREA },
          ],
          variables: {
            jitsi_room_name: 'default',
          },
          type: ExternalScriptComponent.TYPE,
        },
        GameScript: {
          scriptParams: [{ id: ID.EXTERNAL_SCRIPT.INTERACTION_ZONE }],
          type: GameScriptComponent.TYPE,
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
      name: NAME.PREFAB_OBJECT.MOUSE_ICON,
      static: true,
      components: {
        Render: {
          type: RenderComponent.TYPE,
          idRenderData: ID.RENDER_DATA.MOUSE,
          color: [1, 1, 1, 1],
        },
        ExternalScript: {
          scriptParams: [
            { id: ID.EXTERNAL_SCRIPT.CLICKABLE },
            { id: ID.EXTERNAL_SCRIPT.ROTATE },
            { id: ID.EXTERNAL_SCRIPT.DISPLAY_MEDIA },
          ],
          conf: { speed: 0.0005, iframe_src: null, sound_id: null },
          type: ExternalScriptComponent.TYPE,
        },
        Audio: {
          sounds: [],
          conf: {},
          type: AudioComponent.TYPE,
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
