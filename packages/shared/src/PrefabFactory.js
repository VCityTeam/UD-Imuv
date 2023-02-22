const { Game } = require('@ud-viz/shared');

module.exports = {
  postIt: () => {
    return new Game.Object3D({
      name: 'Post_it',
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
};
