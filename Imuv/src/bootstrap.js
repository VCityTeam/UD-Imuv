/** @format */

import { GameApp } from './GameApp';
import { ReceptionView } from './Reception/Reception';

const reception = new ReceptionView();
document.body.appendChild(reception.html());

// const app = new GameApp();
// app.start('./assets/config/config.json');
