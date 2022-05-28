/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Volume';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';
import '@kitware/vtk.js/favicon';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkImageMarchingCubes from '@kitware/vtk.js/Filters/General/ImageMarchingCubes';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkColorMaps from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps';

import { vec3, quat, mat4 } from 'gl-matrix';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkImageCroppingWidget from '@kitware/vtk.js/Widgets/Widgets3D/ImageCroppingWidget';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import Widgets3D from '@kitware/vtk.js/Widgets/Widgets3D';
import vtkPiecewiseGaussianWidget from '@kitware/vtk.js/Interaction/Widgets/PiecewiseGaussianWidget';

const __BASE_PATH__ = 'https://kitware.github.io/vtk-js/'
const controlPanel = `
<table>
  <tr>
    <td><label>Load</label></td>
    <td>
    <div class="${style.bigFileDrop}"/><input type="file" accept=".vti" style="display: none;"/>
    </td>
  </tr>
  <tr>
    <td>
      <input id="rendering" type="radio" name="type" value="1"><label>Rendering</label>
    </td>
    <td>
      <input id="rayCasting" type="radio" name="type" value="1"><label>Ray Casting</label>
    </td>
  </tr>
  <tr id="layoutRendering">
    <td><label>Iso value</label></td>
    <td><input class='isoValue' type="range" min="0.0" max="1.0" step="0.05" value="0.0" /></td>
  </tr>
  <tbody id="layoutRayCasting">
    <tr>
      <td><label>pickable</label></td>
      <td><input class='flag' data-name="pickable" type="checkbox" checked /></td>
    </tr>
    <tr>
      <td><label>visibility</label></td>
      <td><input class='flag' data-name="visibility" type="checkbox" checked /></td>
    </tr>
    <tr>
      <td><label>contextVisibility</label></td>
      <td><input class='flag' data-name="contextVisibility" type="checkbox" checked /></td>
    </tr>
    <tr>
      <td><label>handleVisibility</label></td>
      <td><input class='flag' data-name="handleVisibility" type="checkbox" checked /></td>
    </tr>
    <tr>
      <td><label>faceHandlesEnabled</label></td>
      <td><input class='flag' data-name="faceHandlesEnabled" type="checkbox" checked /></td>
    </tr>
    <tr>
      <td><label>edgeHandlesEnabled</label></td>
      <td><input class='flag' data-name="edgeHandlesEnabled" type="checkbox" checked /></td>
    </tr>
    <tr>
      <td><label>cornerHandlesEnabled</label></td>
      <td><input class='flag' data-name="cornerHandlesEnabled" type="checkbox" checked /></td>
    </tr>
    <tr>
      <td colspan="2"><div id="ray-transfer-function"></div></td>
    </tr>
    <tr>
      <td colspan="2">
        <select hidden id="presets-menu">
          <option selected value="Cool to Warm">Cool to Warm</option>
          <option value="Cold and Hot">Cold and Hot</option>
          <option value="Black, Blue and White">Black, Blue and White</option>
          <option value="X Ray">X Ray</option>
          <option value="erdc_rainbow_dark">Edrc Rainbow Dark</option>
        </select>
      </td>
    </tr>
  </tbody>
</table>
`

const rootContainer = document.querySelector(
  '.vtk-js-example-piecewise-gaussian-widget'
);

var srcItem = `${__BASE_PATH__}/data/volume/headsq.vti`
// ----------------------------------------------------------------------------
// Code setup
// ----------------------------------------------------------------------------

async function renderHead() {

  document.body.innerHTML = ""

  function updateIsoValue(e) {
    const isoValue = Number(e.target.value);
    marchingCube.setContourValue(isoValue);
    renderWindow.render();
  }

  const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
    background: [0, 0, 0],
  });
  const renderWindow = fullScreenRenderWindow.getRenderWindow();
  const renderer = fullScreenRenderWindow.getRenderer();
  
  fullScreenRenderWindow.addController(controlPanel);

  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();
  const marchingCube = vtkImageMarchingCubes.newInstance({
    contourValue: 0.0,
    computeNormals: true,
    mergePoints: true,
  });

  actor.setMapper(mapper);
  mapper.setInputConnection(marchingCube.getOutputPort());

  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
marchingCube.setInputConnection(reader.getOutputPort());

// ${__BASE_PATH__}/data/volume/headsq.vti
  reader.setUrl(srcItem, { loadData: true })
  .then(() => {
    const data = reader.getOutputData();
    const dataRange = data.getPointData().getScalars().getRange();
    const firstIsoValue = (dataRange[0] + dataRange[1]) / 3;

    const el = document.querySelector('.isoValue');
    el.setAttribute('min', dataRange[0]);
    el.setAttribute('max', dataRange[1]);
    el.setAttribute('value', firstIsoValue);
    el.addEventListener('input', updateIsoValue);

    marchingCube.setContourValue(firstIsoValue);
    renderer.addActor(actor);
    renderer.getActiveCamera().set({ position: [1, 1, 0], viewUp: [0, 0, -1] });
    renderer.resetCamera();
    renderWindow.render();
  });
  
  global.fullScreen = fullScreenRenderWindow;
  global.actor = actor;
  global.mapper = mapper;
  global.marchingCube = marchingCube;

  document.getElementById('layoutRendering').style.visibility = 'visible';
  document.getElementById('layoutRayCasting').style.visibility = 'collapse';
  document.getElementById('ray-transfer-function').style.visibility = 'collapse';
  document.getElementById('presets-menu').style.visibility = 'collapse';

  document.getElementById('rendering').checked = "checked"

  document.getElementById('rendering').addEventListener('change', function () {
    renderHead();
  });  

  document.getElementById('rayCasting').addEventListener('change', function () {
    rayCastingChest();
  });

  loadFile.onchange = evt => {
    const [file] = loadFile.files
    if (file) {
      srcItem = URL.createObjectURL(file)
      // reader.setUrl(srcItem);
    }
  }
}

async function rayCastingChest() {

  document.body.innerHTML = ""

  const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
    background: [0, 0, 0],
  });
  const renderWindow = fullScreenRenderWindow.getRenderWindow();
  const renderer = fullScreenRenderWindow.getRenderer();
  const apiRenderWindow = fullScreenRenderWindow.getApiSpecificRenderWindow();
  
  fullScreenRenderWindow.addController(controlPanel);
  // ----------------------------------------------------------------------------
  // 2D overlay rendering
  // ----------------------------------------------------------------------------

  const overlaySize = 15;
  const overlayBorder = 2;
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.width = `${overlaySize}px`;
  overlay.style.height = `${overlaySize}px`;
  overlay.style.border = `solid ${overlayBorder}px red`;
  overlay.style.borderRadius = '50%';
  overlay.style.left = '-100px';
  overlay.style.pointerEvents = 'none';
  document.querySelector('body').appendChild(overlay);

  const widgetContainer = document.createElement('div');
  widgetContainer.style.position = 'absolute';
  widgetContainer.style.top = 'calc(340px + 1em)';
  widgetContainer.style.left = '5px';
  widgetContainer.style.background = 'rgba(255, 255, 255, 0.3)';
  // widgetContainer.style.visibility = "hidden"
  document.querySelector('body').appendChild(widgetContainer);
  //actor.setVisibility(false);
  //widget.set({"visibility":false});

  const labelContainer = document.createElement('div');
  labelContainer.style.position = 'absolute';
  labelContainer.style.top = '5px';
  labelContainer.style.left = '5px';
  labelContainer.style.width = '100%';
  labelContainer.style.color = 'white';
  labelContainer.style.textAlign = 'center';
  labelContainer.style.userSelect = 'none';
  labelContainer.style.cursor = 'pointer';
  document.querySelector('body').appendChild(labelContainer);
  let presetIndex = 1;
  const globalDataRange = [0, 255];
  const lookupTable = vtkColorTransferFunction.newInstance();
  
  // ----------------------------------------------------------------------------
  // Widget manager
  // ----------------------------------------------------------------------------

  const widgetManager = vtkWidgetManager.newInstance();
  widgetManager.setRenderer(renderer);

  const widget = vtkImageCroppingWidget.newInstance();

  function widgetRegistration(e) {
    const action = e ? e.currentTarget.dataset.action : 'addWidget';
    const viewWidget = widgetManager[action](widget);
    if (viewWidget) {
      viewWidget.setDisplayCallback((coords) => {
        overlay.style.left = '-100px';
        if (coords) {
          const [w, h] = apiRenderWindow.getSize();
          overlay.style.left = `${Math.round(
            (coords[0][0] / w) * window.innerWidth -
              overlaySize * 0.5 -
              overlayBorder
          )}px`;
          overlay.style.top = `${Math.round(
            ((h - coords[0][1]) / h) * window.innerHeight -
              overlaySize * 0.5 -
              overlayBorder
          )}px`;
        }
      });

      renderer.resetCamera();
      renderer.resetCameraClippingRange();
    }
    widgetManager.enablePicking();
    renderWindow.render();
  }

  // Initial widget register
  widgetRegistration();

  // ----------------------------------------------------------------------------
  // Volume rendering
  // ----------------------------------------------------------------------------

  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

  const actor = vtkVolume.newInstance();
  const mapper = vtkVolumeMapper.newInstance();
  mapper.setSampleDistance(1.1);
  actor.setMapper(mapper);

  // create color and opacity transfer functions
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
  ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
  ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
  ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(0.0, 0.0);
  ofun.addPoint(255.0, 1.0);
  actor.getProperty().setRGBTransferFunction(0, ctfun);
  actor.getProperty().setScalarOpacity(0, ofun);
  actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
  actor.getProperty().setInterpolationTypeToLinear();
  actor.getProperty().setUseGradientOpacity(0, true);
  actor.getProperty().setGradientOpacityMinimumValue(0, 2);
  actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
  actor.getProperty().setGradientOpacityMaximumValue(0, 20);
  actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
  actor.getProperty().setShade(true);
  actor.getProperty().setAmbient(0.2);
  actor.getProperty().setDiffuse(0.7);
  actor.getProperty().setSpecular(0.3);
  actor.getProperty().setSpecularPower(8.0);

  mapper.setInputConnection(reader.getOutputPort());

  // -----------------------------------------------------------
  // Get data
  // -----------------------------------------------------------

  function getCroppingPlanes(imageData, ijkPlanes) {
    const rotation = quat.create();
    mat4.getRotation(rotation, imageData.getIndexToWorld());

    const rotateVec = (vec) => {
      const out = [0, 0, 0];
      vec3.transformQuat(out, vec, rotation);
      return out;
    };

    const [iMin, iMax, jMin, jMax, kMin, kMax] = ijkPlanes;
    const origin = imageData.indexToWorld([iMin, jMin, kMin]);
    // opposite corner from origin
    const corner = imageData.indexToWorld([iMax, jMax, kMax]);
    return [
      // X min/max
      vtkPlane.newInstance({ normal: rotateVec([1, 0, 0]), origin }),
      vtkPlane.newInstance({ normal: rotateVec([-1, 0, 0]), origin: corner }),
      // Y min/max
      vtkPlane.newInstance({ normal: rotateVec([0, 1, 0]), origin }),
      vtkPlane.newInstance({ normal: rotateVec([0, -1, 0]), origin: corner }),
      // X min/max
      vtkPlane.newInstance({ normal: rotateVec([0, 0, 1]), origin }),
      vtkPlane.newInstance({ normal: rotateVec([0, 0, -1]), origin: corner }),
    ];
  }

  const widget1 = vtkPiecewiseGaussianWidget.newInstance({
    numberOfBins: 256,
    size: [400, 150],
  });

  widget1.updateStyle({
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    histogramColor: 'rgba(100, 100, 100, 0.5)',
    strokeColor: 'rgb(0, 0, 0)',
    activeColor: 'rgb(255, 255, 255)',
    handleColor: 'rgb(50, 150, 50)',
    buttonDisableFillColor: 'rgba(255, 255, 255, 0.5)',
    buttonDisableStrokeColor: 'rgba(0, 0, 0, 0.5)',
    buttonStrokeColor: 'rgba(0, 0, 0, 1)',
    buttonFillColor: 'rgba(255, 255, 255, 1)',
    strokeWidth: 2,
    activeStrokeWidth: 3,
    buttonStrokeWidth: 1.5,
    handleWidth: 3,
    iconSize: 20, // Can be 0 if you want to remove buttons (dblClick for (+) / rightClick for (-))
    padding: 10,
  });


  fullScreenRenderWindow.setResizeCallback(({ width, height }) => {
    widget1.setSize(Math.min(450, width - 10), 150);
  });

  const piecewiseFunction = vtkPiecewiseFunction.newInstance();

  // 
  reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`).then(() => {
    
      reader.loadData().then(() => {
      const image = reader.getOutputData();
      const dataArray = image.getPointData().getScalars();
      const dataRange = dataArray.getRange();
      globalDataRange[0] = dataRange[0];
      globalDataRange[1] = dataRange[1];

      function changePreset(delta = 1) {
        presetIndex =
          (presetIndex + delta + vtkColorMaps.rgbPresetNames.length) %
          vtkColorMaps.rgbPresetNames.length;
        lookupTable.applyColorMap(
          vtkColorMaps.getPresetByName(vtkColorMaps.rgbPresetNames[presetIndex])
        );
        lookupTable.setMappingRange(...globalDataRange);
        lookupTable.updateRange();
        labelContainer.innerHTML = vtkColorMaps.rgbPresetNames[presetIndex];
      }
      let intervalID = null;
    

      // Automatic switch to next preset every 5s
        if (!rootContainer) {
          intervalID = setInterval(changePreset, 5000);
        }
        widget1.setDataArray(dataArray.getData());
        widget1.applyOpacity(piecewiseFunction);
    
        widget1.setColorTransferFunction(lookupTable);
        lookupTable.onModified(() => {
          widget1.render();
          renderWindow.render();
        });

      // update crop widget
      widget.copyImageDataDescription(image);
      const cropState = widget.getWidgetState().getCroppingPlanes();
      cropState.onModified(() => {
        const planes = getCroppingPlanes(image, cropState.getPlanes());
        mapper.removeAllClippingPlanes();
        planes.forEach((plane) => {
          mapper.addClippingPlane(plane);
        });
        mapper.modified();
      });

      // add volume to renderer
      renderer.addVolume(actor);
      renderer.resetCamera();
      renderer.resetCameraClippingRange();
      renderWindow.render();
    });
  });

  // -----------------------------------------------------------
  // UI control handling
  // -----------------------------------------------------------
  
  function updateFlag(e) {
    const value = !!e.target.checked;
    const name = e.currentTarget.dataset.name;
    widget.set({ [name]: value }); // can be called on either viewWidget or parentWidget

    widgetManager.enablePicking();
    renderWindow.render();
  }

  const elems = document.querySelectorAll('.flag');
  for (let i = 0; i < elems.length; i++) {
    elems[i].addEventListener('change', updateFlag);
  }

  const buttons = document.querySelectorAll('button');
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', widgetRegistration);
  }

  actor.getProperty().setRGBTransferFunction(0, lookupTable);
  actor.getProperty().setScalarOpacity(0, piecewiseFunction);
  actor.getProperty().setInterpolationTypeToFastLinear();

  // ----------------------------------------------------------------------------
  // Default setting Piecewise function widget
  // ----------------------------------------------------------------------------

  widget1.addGaussian(0.425, 0.5, 0.2, 0.3, 0.2);
  widget1.addGaussian(0.75, 1, 0.3, 0, 0);

  widget1.setContainer(widgetContainer);
  widget1.bindMouseListeners();

  widget1.onAnimation((start) => {
    if (start) {
      renderWindow.getInteractor().requestAnimation(widget1);
    } else {
      renderWindow.getInteractor().cancelAnimation(widget1);
    }
  });

  widget1.onOpacityChange(() => {
    widget1.applyOpacity(piecewiseFunction);
    if (!renderWindow.getInteractor().isAnimating()) {
      renderWindow.render();
    }
  });

  document.getElementById('layoutRendering').style.visibility = 'collapse';
  document.getElementById('layoutRayCasting').style.visibility = 'visible';
  document.getElementById('ray-transfer-function').style.visibility = 'visible';
  document.getElementById('presets-menu').style.visibility = 'visible';
  document.getElementById('rayCasting').checked = "checked"

  document.getElementById('rendering').addEventListener('change', function () {
    renderHead();
  });  

  document.getElementById('rayCasting').addEventListener('change', function () {
    rayCastingChest();
  });

  loadFile.onchange = evt => {
    const [file] = loadFile.files
    if (file) {
      srcItem = `${__BASE_PATH__}/data/volume/${file.name}`
      console.log(srcItem)
      // reader.setUrl(srcItem);
      // renderWindow.render();
    }
  }

  global.widget1 = widget1;
}

async function start(){
  renderHead()
  rayCastingChest()
}

start();

