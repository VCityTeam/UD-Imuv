const { Game } = require('@ud-viz/node');
const { GameScript } = require('@ud-imuv/shared');

GameScript.Map = Game.ScriptTemplate.Map; // add @ud-viz/node script template

Game.ThreadProcessRoutine(GameScript);
