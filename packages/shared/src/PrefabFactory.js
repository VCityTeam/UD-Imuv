const { Game } = require('@ud-viz/shared');

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
          color: [1, 1, 0],
        },
        ExternalScript: {
          idScripts: ['PostIt'],
          type: 'ExternalScript',
        },
      },
      matrix: [0.2, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 1],
    });
  },
  box3D: () => {
    return new Game.Object3D({
      static: false,
      components: {
        Render: {
          type: 'Render',
          idRenderData: 'cube',
          color: [1, 1, 1],
        },
      },
    });
  },
  avatar: () => {
    return new Game.Object3D({
      name: 'avatar',
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
          idScripts: ['Avatar'],
          type: 'GameScript',
        },
        ExternalScript: {
          idScripts: ['Visible', 'SpriteName', 'TextureFace'],
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
};
