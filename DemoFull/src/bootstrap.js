/** @format */

import { Widgets, Components } from 'udv';
import { BaseDemo } from './ScaffoldHelpers/BaseDemo';
import './style.css';

const baseDemo = new BaseDemo();
baseDemo.appendTo(document.body);
baseDemo.loadConfigFile('./demo-config.json').then(() => {
  // Use the stable server
  baseDemo.addLogos();

  // Initialize iTowns 3D view
  baseDemo.init3DView();
  baseDemo.addBaseMapLayer();
  baseDemo.addElevationLayer();
  baseDemo.setupAndAdd3DTilesLayer();
  baseDemo.update3DView();

  ////// REQUEST SERVICE
  const requestService = new Components.RequestService();

  ////// ABOUT MODULE
  if (baseDemo.config.widgets.aboutWindow) {
    const about = new Widgets.AboutWindow();
    baseDemo.addModuleView('about', about);
  }

  ////// HELP MODULE
  if (baseDemo.config.widgets.helpWindow) {
    const help = new Widgets.HelpWindow();
    baseDemo.addModuleView('help', help);
  }

  ////// AUTHENTICATION MODULE
  if (baseDemo.config.widgets.authenticationView) {
    const authenticationService = new Widgets.Extensions.AuthenticationService(
      requestService,
      baseDemo.config
    );
    const authenticationView = new Widgets.Extensions.AuthenticationView(
      authenticationService
    );
    baseDemo.addModuleView('authentication', authenticationView, {
      type: BaseDemo.AUTHENTICATION_MODULE,
    });
  }

  ////// DOCUMENTS MODULE
  let documentModule = null;
  if (baseDemo.config.widgets.documentModule) {
    documentModule = new Widgets.DocumentModule(
      requestService,
      baseDemo.config
    );
    baseDemo.addModuleView('documents', documentModule.view);

    ////// DOCUMENTS VISUALIZER (to orient the document)
    if (baseDemo.config.widgets.documentVisualizerWindow) {
      const imageOrienter = new Widgets.DocumentVisualizerWindow(
        documentModule,
        baseDemo.view,
        baseDemo.controls
      );

      ////// CONTRIBUTE EXTENSION
      if (baseDemo.config.widgets.contributeModule) {
        const contribute = new Widgets.Extensions.ContributeModule(
          documentModule,
          imageOrienter,
          requestService,
          baseDemo.view,
          baseDemo.controls,
          baseDemo.config
        );
      }
    }

    ////// VALIDATION EXTENSION
    if (baseDemo.config.widgets.documentValidationModule) {
      const validation = new Widgets.Extensions.DocumentValidationModule(
        documentModule,
        requestService,
        baseDemo.config
      );
    }

    ////// DOCUMENT COMMENTS
    if (baseDemo.config.widgets.documentCommentsModule) {
      const documentComments = new Widgets.Extensions.DocumentCommentsModule(
        documentModule,
        requestService,
        baseDemo.config
      );
    }

    ////// GUIDED TOURS MODULE
    if (baseDemo.config.widgets.guidedTourController) {
      const guidedtour = new Widgets.GuidedTourController(
        documentModule,
        requestService,
        baseDemo.config
      );
      baseDemo.addModuleView('guidedTour', guidedtour, {
        name: 'Guided Tours',
      });
    }
  }

  ////// GEOCODING EXTENSION
  if (baseDemo.config.widgets.geocodingView) {
    const geocodingService = new Widgets.Extensions.GeocodingService(
      requestService,
      baseDemo.extent,
      baseDemo.config
    );
    const geocodingView = new Widgets.Extensions.GeocodingView(
      geocodingService,
      baseDemo.controls,
      baseDemo.view
    );
    baseDemo.addModuleView('geocoding', geocodingView, {
      binding: 's',
      name: 'Address Search',
    });
  }

  ////// CITY OBJECTS MODULE
  let cityObjectModule = null;
  if (baseDemo.config.widgets.cityObjectModule) {
    cityObjectModule = new Widgets.CityObjectModule(
      baseDemo.layerManager,
      baseDemo.config
    );
    baseDemo.addModuleView('cityObjects', cityObjectModule.view);
  }

  ////// LINKS MODULES
  if (
    documentModule &&
    cityObjectModule &&
    baseDemo.config.widgets.linkModule
  ) {
    const linkModule = new Widgets.LinkModule(
      documentModule,
      cityObjectModule,
      requestService,
      baseDemo.view,
      baseDemo.controls,
      baseDemo.config
    );
  }

  ////// 3DTILES DEBUG
  if (baseDemo.config.widgets.debug3DTilesWindow) {
    const debug3dTilesWindow = new Widgets.Extensions.Debug3DTilesWindow(
      baseDemo.layerManager
    );
    baseDemo.addModuleView('3dtilesDebug', debug3dTilesWindow, {
      name: '3DTiles Debug',
    });
  }

  ////// CAMERA POSITIONER
  if (baseDemo.config.widgets.cameraPositionerView) {
    const cameraPosition = new Widgets.CameraPositionerView(
      baseDemo.view,
      baseDemo.controls
    );
    baseDemo.addModuleView('cameraPositioner', cameraPosition);
  }

  ////// LAYER CHOICE
  if (baseDemo.config.widgets.layerChoice) {
    const layerChoice = new Widgets.LayerChoice(baseDemo.layerManager);
    baseDemo.addModuleView('layerChoice', layerChoice, {
      name: 'layerChoice',
    });
  }
});
