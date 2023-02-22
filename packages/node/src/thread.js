const { Data } = require('@ud-viz/shared');
const { Game } = require('@ud-viz/node');
const { GameScript } = require('@ud-imuv/shared');
const NodeGameScript = require('./GameScript/GameScript');

Data.objectOverWrite(GameScript, NodeGameScript); // add specific node script

Game.ThreadProcessRoutine(GameScript);
