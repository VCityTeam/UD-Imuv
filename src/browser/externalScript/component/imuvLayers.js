import * as itowns from 'itowns';
import { FEATURE_USER_DATA_KEY } from './constant';

export const elevationConfig = {
  url: 'https://imagerie.data.grandlyon.com/wms/grandlyon',
  name: 'MNT2018_Altitude_2m',
  format: 'image/jpeg',
  layer_name: 'wms_elevation_test',
  colorTextureElevationMinZ: 149,
  colorTextureElevationMaxZ: 622,
};

export const baseMapConfig = {
  url: 'https://wxs.ign.fr/choisirgeoportail/geoportail/r/wms',
  name: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
  version: '1.3.0',
  format: 'image/jpeg',
  layer_name: 'Base_Map',
  maxSubdivisionLevel: 5,
};

export const c3DTilesConfig = [
  {
    id: '3d-tiles-layer-building',
    url: './assets/3DTiles/buildings/tileset.json',
  },
];

/**
 *
 * @param {itowns.View} view
 * @param {itowns.Extent} extent
 */
export const addAllImuvLayers = (view, extent) => {
  view.addLayer(
    new itowns.ColorLayer(baseMapConfig.name, {
      updateStrategy: {
        type: itowns.STRATEGY_DICHOTOMY,
        options: {},
      },
      source: new itowns.WMSSource({
        extent: extent,
        name: baseMapConfig.name,
        url: baseMapConfig.url,
        version: baseMapConfig.version,
        crs: extent.crs,
        format: baseMapConfig.format,
      }),
      transparent: true,
    })
  );

  const isTextureFormat =
    elevationConfig.format == 'image/jpeg' ||
    elevationConfig.format == 'image/png';
  view.addLayer(
    new itowns.ElevationLayer(elevationConfig.layer_name, {
      useColorTextureElevation: isTextureFormat,
      colorTextureElevationMinZ: isTextureFormat
        ? elevationConfig.colorTextureElevationMinZ
        : null,
      colorTextureElevationMaxZ: isTextureFormat
        ? elevationConfig.colorTextureElevationMaxZ
        : null,
      source: new itowns.WMSSource({
        extent: extent,
        url: elevationConfig.url,
        name: elevationConfig.name,
        crs: extent.crs,
        heightMapWidth: 256,
        format: elevationConfig.format,
      }),
    })
  );

  c3DTilesConfig.forEach((layerConfig) => {
    const layer = new itowns.C3DTilesLayer(
      layerConfig['id'],
      {
        style: new itowns.Style({
          fill: {
            color: (feature) => {
              return feature.userData[FEATURE_USER_DATA_KEY.SELECTED_COLOR]
                ? feature.userData[FEATURE_USER_DATA_KEY.SELECTED_COLOR]
                : feature.userData[FEATURE_USER_DATA_KEY.INITIAL_COLOR];
            },
          },
        }),
        name: layerConfig['id'],
        source: new itowns.C3DTilesSource({
          url: layerConfig['url'],
        }),
      },
      view
    );

    layer.addEventListener(
      itowns.C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
      ({ tileContent }) => {
        for (const [, feature] of layer.tilesC3DTileFeatures.get(
          tileContent.tileId
        )) {
          feature.userData[FEATURE_USER_DATA_KEY.INITIAL_COLOR] =
            feature.object3d.material.color.getHex();
        }
      }
    );

    itowns.View.prototype.addLayer.call(view, layer);
  });
};