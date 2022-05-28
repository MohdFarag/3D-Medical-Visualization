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

import { vec3, quat, mat4 } from 'gl-matrix';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkImageCroppingWidget from '@kitware/vtk.js/Widgets/Widgets3D/ImageCroppingWidget';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

const __BASE_PATH__ = 'https://kitware.github.io/vtk-js/'
const controlPanel = `
<table>
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
          <select id="presets-menu">
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


// ----------------------------------------------------------------------------
// Code setup
// ----------------------------------------------------------------------------

async function renderHead() {

  function updateIsoValue(e) {
    const isoValue = Number(e.target.value);
    marchingCube.setContourValue(isoValue);
    renderWindow.render();
  }

  document.body.innerHTML = ""

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
  reader.setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`, { loadData: true })
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

  reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`).then(() => {
    reader.loadData().then(() => {
      const image = reader.getOutputData();

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
}

async function start(){
  renderHead()
  rayCastingChest()
}

start();