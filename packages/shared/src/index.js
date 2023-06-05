module.exports = {
  Constant: require('./Constant'),
  GameScript: {
    Avatar: require('./GameScript/Avatar'),
    CityAvatar: require('./GameScript/CityAvatar'),
    CityAvatarNotAllowArea: require('./GameScript/CityAvatarNotAllowArea'),
    CityMap: require('./GameScript/CityMap'),
    InteractionZone: require('./GameScript/InteractionZone'),
    MiniMap: require('./GameScript/MiniMap'),
    Portal: require('./GameScript/Portal'),
    Spawner: require('./GameScript/Spawner'),
    Teleporter: require('./GameScript/Teleporter'),
    UI: require('./GameScript/UI'),
    NativeCommandManager:
      require('@ud-viz/shared').Game.ScriptTemplate.NativeCommandManager,
  },
  PrefabFactory: require('./PrefabFactory'),
};
