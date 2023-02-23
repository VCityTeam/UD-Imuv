const { Data } = require('@ud-viz/shared');
const { Game } = require('@ud-viz/node');
const { GameScript } = require('@ud-imuv/shared');

Data.objectOverWrite(GameScript, Game.ScriptTemplate); // add @ud-viz/node script template

Game.ThreadProcessRoutine(GameScript);
