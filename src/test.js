/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

import macro from '@kitware/vtk.js/macros';
import HttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkBoundingBox from '@kitware/vtk.js/Common/DataModel/BoundingBox';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkVolumeController from '@kitware/vtk.js/Interaction/UI/VolumeController';
import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkXMLImageDataReader from '@kitware/vtk.js/IO/XML/XMLImageDataReader';
import vtkFPSMonitor from '@kitware/vtk.js/Interaction/UI/FPSMonitor';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

const style = `
<style>
  .VolumeController-module-container_jKVeO {
  display: flex;
  align-items: stretch;
  flex-direction: column;
  justify-content: space-between;
  position: absolute;
  top: 5px;
  left: 5px;
  background: rgba(128, 128, 128, 0.5);
  border-radius: 5px;
  padding: 2px;
  border: 0.5px solid black;
  box-sizing: border-box;
}

.VolumeController-module-line_GJJCQ {
  display: flex;
  flex-direction: row;
  flex: 1;
  align-items: center;
  justify-content: space-between;
}

.VolumeController-module-button_sGCuW {
  cursor: pointer;
  width: 1rem;
  margin-left: 5px;
  margin-right: 5px;
}

.VolumeController-module-button_sGCuW svg {
  width: 1rem;
  height: 1rem;
}

.VolumeController-module-sliderEntry_dg_ex {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.VolumeController-module-sliderIcon_iSqYC {
  height: 1rem;
}

.VolumeController-module-slider_eX_mC {
  flex: 1;
  min-height: 1rem;
  width: 5px;
}

.VolumeController-module-piecewiseEditor_USwRa {
  flex: 1;
}

.VolumeController-module-select_W6h09 {
  flex: 1;
  border: none;
  background: transparent;
  color: white;
  border: none;
  -moz-appearance: none;
  width: 5px;
}

.VolumeController-module-select_W6h09 select:focus {
  outline: none;
  border: none;
}

.VolumeController-module-presets_xVs5B {
}

.VolumeController-module-shadow_lv7JI {
}

.VolumeController-module-buttonDarkBG_R5ztA {
}

.VolumeController-module-presetsDarkBG_LjcAS {
  color: white;
}

.VolumeController-module-presetsDarkBG_LjcAS option {
  color: black;
}

.VolumeController-module-shadowDarkBG_y76oi {
  color: white;
}

.VolumeController-module-shadowDarkBG_y76oi option {
  color: black;
}

.VolumeController-module-buttonBrightBG_ysc_a {
}

.VolumeController-module-presetsBrightBG_lfpNB {
  color: black;
}

.VolumeController-module-presetsBrightBG_lfpNB option {
  color: white;
}

.VolumeController-module-shadowBrightBG_B_eHB {
  color: black;
}

.VolumeController-module-shadowBrightBG_B_eHB option {
  color: white;
}
  </style>
  <style>
  .FPSMonitor-module-verticalContainer_qRTek {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
  }

  .FPSMonitor-module-horizontalContainer_osn4j {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
  }

  .FPSMonitor-module-leftPane_kt02O {
    flex: none;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
  }

  .FPSMonitor-module-rightPane_H9KH6 {
    flex: 1;
    display: grid;
    grid-template-columns: auto auto;
    grid-auto-rows: 1.5em;
    grid-column-gap: 5px;
    grid-row-gap: 2px;
    padding: 10px;
  }

  .FPSMonitor-module-title_oe8GK {
    flex: 1;
    font-weight: bold;
    padding: 5px 10px 0 10px;
  }

  .FPSMonitor-module-graph_oDNGp {
    flex: none;
    border: solid 1px black;
    margin: 10px ;
    border-radius: 2px;
    overflow: hidden;
  }

  .FPSMonitor-module-label_yxnxx {
    font-weight: bold;
    text-transform: capitalize;
    text-align: right;
    align-self: center;
  }

  .FPSMonitor-module-value_yILm5 {
    font-style: italic;
    text-align: center;
    align-self: center;
  }
  </style>
  <style>
  body {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .VolumeViewer-module-fullScreen_x1QV7 {
    position: absolute;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    overflow: hidden;
    background: black;
    margin: 0;
    padding: 0;
  }

  .VolumeViewer-module-fullParentSize_hci9C {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    overflow: hidden;
  }

  .VolumeViewer-module-bigFileDrop_kl7hv {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    background-image: url(https://kitware.github.io/vtk-js/examples/VolumeViewer/d12fb5393ccf95ded195.jpg);
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    border-radius: 10px;
    width: 50px;
    padding: calc(50vh - 2em) calc(50vw - 25px - 2em);
    cursor: pointer;
  }

  .VolumeViewer-module-selector_y9ZB5 {
    position: absolute;
    top: 5px;
    left: 400px;
    transform: translate(-100%, 0px);
    border: none;
    background: transparent;
    color: white;
    border: none;
  }

  select {
    -moz-appearance: none;
  }

  select option {
    color: black;
  }

  select:focus {
    outline: none;
    border: none;
  }

  .VolumeViewer-module-piecewiseWidget_LHZDd {
    position: absolute;
    top: calc(10px + 1em);
    left: 5px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 5px;
  }

  .VolumeViewer-module-shadow_SrDL1 {
    position: absolute;
    top: 5px;
    left: 5px;
    border: none;
    background: transparent;
    color: white;
    border: none;
  }

  .VolumeViewer-module-progress_dctjE {
    flex: none;
    font-size: 50px;
    color: black;
    z-index: 1;
    background: rgba(128,128,128,.5);
    padding: 20px;
    border-radius: 10px;
    -webkit-user-select: none;
      -moz-user-select: none;
        -ms-user-select: none;
            user-select: none;
  }

  .VolumeViewer-module-fpsMonitor_fD65_ {
    position: absolute;
    bottom: 10px;
    left: 10px;
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 5px;
    border: solid 1px gray;
  }
  </style>
`

let autoInit = true;
const userParams = vtkURLExtract.extractURLParameters();
const fpsMonitor = vtkFPSMonitor.newInstance();

// ----------------------------------------------------------------------------
// Add class to body if iOS device
// ----------------------------------------------------------------------------

const iOS = /iPad|iPhone|iPod/.test(window.navigator.platform);

if (iOS) {
  document.querySelector('body').classList.add('is-ios-device');
}

// ----------------------------------------------------------------------------

function emptyContainer(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

// ----------------------------------------------------------------------------

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// ----------------------------------------------------------------------------

function createViewer(rootContainer, fileContents, options) {
  const background = options.background
    ? options.background.split(',').map((s) => Number(s))
    : [0, 0, 0];
  const containerStyle = options.containerStyle;
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    background,
    rootContainer,
    containerStyle,
  });
  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();
  renderWindow.getInteractor().setDesiredUpdateRate(30);

  const vtiReader = vtkXMLImageDataReader.newInstance();
  vtiReader.parseAsArrayBuffer(fileContents);

  const source = vtiReader.getOutputData(0);
  const mapper = vtkVolumeMapper.newInstance();
  const actor = vtkVolume.newInstance();

  const dataArray =
    source.getPointData().getScalars() || source.getPointData().getArrays()[0];
  const dataRange = dataArray.getRange();

  const lookupTable = vtkColorTransferFunction.newInstance();
  const piecewiseFunction = vtkPiecewiseFunction.newInstance();

  // Pipeline handling
  actor.setMapper(mapper);
  mapper.setInputData(source);
  renderer.addActor(actor);

  // Configuration
  const sampleDistance =
    0.7 *
    Math.sqrt(
      source
        .getSpacing()
        .map((v) => v * v)
        .reduce((a, b) => a + b, 0)
    );
  mapper.setSampleDistance(sampleDistance);
  actor.getProperty().setRGBTransferFunction(0, lookupTable);
  actor.getProperty().setScalarOpacity(0, piecewiseFunction);
  // actor.getProperty().setInterpolationTypeToFastLinear();
  actor.getProperty().setInterpolationTypeToLinear();

  // For better looking volume rendering
  // - distance in world coordinates a scalar opacity of 1.0
  actor
    .getProperty()
    .setScalarOpacityUnitDistance(
      0,
      vtkBoundingBox.getDiagonalLength(source.getBounds()) /
        Math.max(...source.getDimensions())
    );
  // - control how we emphasize surface boundaries
  //  => max should be around the average gradient magnitude for the
  //     volume or maybe average plus one std dev of the gradient magnitude
  //     (adjusted for spacing, this is a world coordinate gradient, not a
  //     pixel gradient)
  //  => max hack: (dataRange[1] - dataRange[0]) * 0.05
  actor.getProperty().setGradientOpacityMinimumValue(0, 0);
  actor
    .getProperty()
    .setGradientOpacityMaximumValue(0, (dataRange[1] - dataRange[0]) * 0.05);
  // - Use shading based on gradient
  actor.getProperty().setShade(true);
  actor.getProperty().setUseGradientOpacity(0, true);
  // - generic good default
  actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
  actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
  actor.getProperty().setAmbient(0.2);
  actor.getProperty().setDiffuse(0.7);
  actor.getProperty().setSpecular(0.3);
  actor.getProperty().setSpecularPower(8.0);

  // Control UI
  const controllerWidget = vtkVolumeController.newInstance({
    size: [400, 150],
    rescaleColorMap: true,
  });
  const isBackgroundDark = background[0] + background[1] + background[2] < 1.5;
  controllerWidget.setContainer(rootContainer);
  controllerWidget.setupContent(renderWindow, actor, isBackgroundDark);

  // setUpContent above sets the size to the container.
  // We need to set the size after that.
  // controllerWidget.setExpanded(false);

  fullScreenRenderer.setResizeCallback(({ width, height }) => {
    // 2px padding + 2x1px boder + 5px edge = 14
    if (width > 414) {
      controllerWidget.setSize(400, 150);
    } else {
      controllerWidget.setSize(width - 14, 150);
    }
    controllerWidget.render();
    fpsMonitor.update();
  });

  // First render
  renderer.resetCamera();
  renderWindow.render();

  global.pipeline = {
    actor,
    renderer,
    renderWindow,
    lookupTable,
    mapper,
    source,
    piecewiseFunction,
    fullScreenRenderer,
  };

  if (userParams.fps) {
    const fpsElm = fpsMonitor.getFpsMonitorContainer();
    fpsElm.classList.add(style.fpsMonitor);
    fpsMonitor.setRenderWindow(renderWindow);
    fpsMonitor.setContainer(rootContainer);
    fpsMonitor.update();
  }
}

// ----------------------------------------------------------------------------

export function load(container, options) {
  autoInit = false;
  emptyContainer(container);

  if (options.file) {
    if (options.ext === 'vti') {
      const reader = new FileReader();
      reader.onload = function onLoad(e) {
        createViewer(container, reader.result, options);
      };
      reader.readAsArrayBuffer(options.file);
    } else {
      console.error('Unkown file...');
    }
  } else if (options.fileURL) {
    const progressContainer = document.createElement('div');
    progressContainer.setAttribute('class', style.progress);
    container.appendChild(progressContainer);

    const progressCallback = (progressEvent) => {
      if (progressEvent.lengthComputable) {
        const percent = Math.floor(
          (100 * progressEvent.loaded) / progressEvent.total
        );
        progressContainer.innerHTML = `Loading ${percent}%`;
      } else {
        progressContainer.innerHTML = macro.formatBytesToProperUnit(
          progressEvent.loaded
        );
      }
    };

    HttpDataAccessHelper.fetchBinary(options.fileURL, {
      progressCallback,
    }).then((binary) => {
      container.removeChild(progressContainer);
      createViewer(container, binary, options);
    });
  }
}

export function initLocalFileLoader(container) {
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = container || exampleContainer || rootBody;

  const fileContainer = document.createElement('div');
  fileContainer.innerHTML = `<div class="${style.bigFileDrop}"/><input type="file" accept=".vti" style="display: none;"/>`;
  myContainer.appendChild(fileContainer);

  const fileInput = fileContainer.querySelector('input');

  function handleFile(e) {
    preventDefaults(e);
    const dataTransfer = e.dataTransfer;
    const files = e.target.files || dataTransfer.files;
    if (files.length === 1) {
      myContainer.removeChild(fileContainer);
      const ext = files[0].name.split('.').slice(-1)[0];
      const options = { file: files[0], ext, ...userParams };
      load(myContainer, options);
    }
  }

  fileInput.addEventListener('change', handleFile);
  fileContainer.addEventListener('drop', handleFile);
  fileContainer.addEventListener('click', (e) => fileInput.click());
  fileContainer.addEventListener('dragover', preventDefaults);
}

// Look at URL an see if we should load a file
// ?fileURL=https://data.kitware.com/api/v1/item/59cdbb588d777f31ac63de08/download
if (userParams.fileURL) {
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = exampleContainer || rootBody;
  load(myContainer, userParams);
}

const viewerContainers = document.querySelectorAll('.vtkjs-volume-viewer');
let nbViewers = viewerContainers.length;
while (nbViewers--) {
  const viewerContainer = viewerContainers[nbViewers];
  const fileURL = viewerContainer.dataset.url;
  const options = {
    containerStyle: { height: '100%' },
    ...userParams,
    fileURL,
  };
  load(viewerContainer, options);
}

// Auto setup if no method get called within 100ms
setTimeout(() => {
  if (autoInit) {
    initLocalFileLoader();
  }
}, 100);
