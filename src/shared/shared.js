// shared API is expose here so it's clearer for node what code can be used
module.exports = {
  constant: require('./constant'),
  gameScript: {
    MenuAvatar: require('./gameScript/MenuAvatar'),
    Avatar: require('./gameScript/Avatar'),
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
