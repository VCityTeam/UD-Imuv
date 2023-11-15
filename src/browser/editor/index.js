import { Editor } from '@ud-viz/game_editor';

import { request } from '../utils/index';

request(window.origin + '/verify_admin_token').then((user) => {
  if (!user) {
    alert('only admin can access editor');
  } else {
    request(window.origin + '/pull_gameobjects3D').then((gameObjects3D) => {
      console.log('pull_gameobjects3D ', gameObjects3D);

      const selectGameObject3D = document.createElement('select');
    });

    const editor = new Editor();
  }
});
