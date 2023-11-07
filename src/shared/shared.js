// shared API is expose here so it's clearer for node what code can be used
module.exports = {
  constant: require('./constant'),
  gameScript: {
    Avatar: require('./gameScript/Avatar'),
    CityAvatarNotAllowArea: require('./gameScript/CityAvatarNotAllowArea'),
    CityMap: require('./gameScript/CityMap'),
    InteractionZone: require('./gameScript/InteractionZone'),
    MiniMap: require('./gameScript/MiniMap'),
    Portal: require('./gameScript/Portal'),
    Spawner: require('./gameScript/Spawner'),
    Teleporter: require('./gameScript/Teleporter'),
    UI: require('./gameScript/UI'),
    ImuvCommandManager: require('./gameScript/ImuvCommandManager'),
  },
  prefabFactory: require('./prefabFactory'),
};
