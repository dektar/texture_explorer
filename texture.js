import { stopSonification2d, stopSonification3d } from "./sonification.js";

// Sets up the canvas used for the texture. Takes a callback to be called
// whenever the texture needs to be refreshed.
// Also sets up the input elements' listeners.
function initializeTextureCanvas(refreshTextureCallback) {
  const textureCanvas = document.querySelector("#texturecanvas");
  const context = textureCanvas.getContext("2d");

  // Deal with high-resolution screens, https://jsfiddle.net/a8bj5fgj/7/.
  const devicePixelRatio = window.devicePixelRatio || 1;
  let width = textureCanvas.width;
  let height = textureCanvas.height;
  if (devicePixelRatio !== 1) {
    console.log('You have a high-density screen, I should do something here, which might also make browser zoom work properly.');
    // textureCanvas.width = width * devicePixelRatio;
    // textureCanvas.height = height * devicePixelRatio;
    // textureCanvas.style.width = width + 'px';
    // textureCanvas.style.height = height + 'px';
    // context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  context.imageSmoothingEnabled = false;

  const refreshTexture = () => {
    const rotation = document.getElementById("rotation").value;
    const scale = document.getElementById("scale").value / 100.;
    const useNearestNeighbor = document.getElementById("nearestNeighbor").checked;
    refreshTextureCallback(useNearestNeighbor, rotation, scale);
  }

  clearTexture(textureCanvas, refreshTexture, width, height);

  let drawing = false;

  // Mouse movement event listeners.
  const startEventListener = (clientX, clientY) => {
    const bounds = textureCanvas.getBoundingClientRect();
    const x = clientX - bounds.left;
    const y = clientY - bounds.top;
    drawing = true;
    if (document.getElementById('baseTextureType').value !== 'sonificationBase') {
      // https://css-tricks.com/snippets/javascript/random-hex-color/
      context.strokeStyle = '#' + Math.floor(Math.random()*16777215).toString(16);
      context.lineWidth = 3;
    }
    context.beginPath();
    context.moveTo(x - 1, y - 1);
    context.lineTo(x + 1, y + 1);
    context.stroke();
    refreshTexture();
  };
  const moveEventListener = (clientX, clientY) => {
    const bounds = textureCanvas.getBoundingClientRect();
    const x = clientX - bounds.left;
    const y = clientY - bounds.top;
    context.lineTo(x, y);
    context.stroke();
    refreshTexture(); 
  };
  const upEventListener = () => {
    drawing = false;
    refreshTexture();
  };

  // Set up mouse and touch listeners on the texture canvas.
  textureCanvas.addEventListener('mousedown', (event) => {
    startEventListener(event.clientX, event.clientY);
  });
  textureCanvas.addEventListener('touchstart', (event) => {
    if (drawing) {
      return;
    }
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;
    startEventListener(x, y);
  });
  textureCanvas.addEventListener('mousemove', (event) => {
    if (!drawing) {
      return;
    }
    moveEventListener(event.clientX, event.clientY);
  });
  textureCanvas.addEventListener('touchmove', (event) => {
    if (event.touches.length != 1) {
      return;
    }
    if (!drawing) {
      return;
    }
    event.preventDefault();
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;
    moveEventListener(x, y);
  });
  textureCanvas.addEventListener('mouseup', upEventListener);
  textureCanvas.addEventListener('touchend', upEventListener);

  // Set up GUI.

  // Set up "clear" button.
  const clearBtn = document.getElementById("clear");
  clearBtn.onclick = () => clearTexture(textureCanvas, refreshTexture, width, height);

  // Nearest neighbor checkbox.
  const nearestNeighborBtn = document.getElementById("nearestNeighbor");
  nearestNeighborBtn.addEventListener("change", () => {
    refreshTexture();
  });

  const rotationSlider = document.getElementById("rotation");
  rotationSlider.addEventListener("input", () => {
    refreshTexture();
  });

  const scaleSlider = document.getElementById("scale");
  scaleSlider.addEventListener("input", () => {
    refreshTexture();
  });

  // This is used to do drawing when the mouse is moved over the 3D canvas.
  // It takes the (u,v) coordinate and maps it to the screen,
  // then draws a pixel / stroke at that point in the texture space.
  const drawAtTextureUV = (u, v, isStart) => {
    const bounds = textureCanvas.getBoundingClientRect();
    const x = u * bounds.width;
    const y = v * bounds.height;

    if (isStart) {
      if (document.getElementById('baseTextureType').value !== 'sonificationBase') {
        // https://css-tricks.com/snippets/javascript/random-hex-color/
        context.strokeStyle = '#' + Math.floor(Math.random()*16777215).toString(16);
        context.lineWidth = 3;
      }
      context.beginPath();
      context.moveTo(x - 1, y - 1);
      context.lineTo(x + 1, y + 1);
    } else {
      context.lineTo(x, y);
    }
    context.stroke();
    refreshTexture();
  };

  return drawAtTextureUV;
}

/** Resets the texture image to the defaults. */
function clearTexture(textureCanvas, refreshTexture, width, height) {
  const context = textureCanvas.getContext("2d");
  context.clearRect(0, 0, width, height);

  const baseTextureType = document.getElementById('baseTextureType').value;
  if (baseTextureType === 'sonificationBase') {
    document.getElementById('sonify3d').removeAttribute('disabled');
    document.getElementById('sonify2d').removeAttribute('disabled');
    context.strokeStyle = "rgb(255 0 0)";
    context.lineWidth = 10;
    context.beginPath();
    context.moveTo(0, 2 * height / 3);
    context.lineTo(width, 2 * height / 3);
    context.stroke();
    refreshTexture();
    return;
  } else {
    document.getElementById('sonify3d').setAttribute('disabled', true);
    document.getElementById('sonify2d').setAttribute('disabled', true);
    stopSonification3d();
    stopSonification2d();
  }

  if (baseTextureType === 'grey') {
    context.fillStyle = 'rgb(220 220 220)';
    context.fillRect(0, 0, width, height);
    refreshTexture();
    return;
  }
  if (baseTextureType === 'cat') {
    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0);
      refreshTexture();
    }
    image.src = 'cat.png';
    return;
  }
  let numLines = width / 8;
  context.lineWidth = 2;
  if (baseTextureType === "uv_grid") {
    numLines = width / 32;
    context.lineWidth = 4;
    context.strokeStyle = "rgb(150 150 150)";
  } else if (baseTextureType === 'gradient') {
    const defaultFillStyle = context.fillStyle;
    let gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgb(255 0 0 / 75%)");
    gradient.addColorStop(1, "rgb(0 0 255 / 75%)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    gradient = context.createLinearGradient(0, height, width, 0);
    gradient.addColorStop(0, "rgb(255 255 255 / 0%)");
    gradient.addColorStop(1, "rgb(0 255 0 / 75%)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.fillStyle = defaultFillStyle;
    context.strokeStyle = "rgb(250 250 250 / 42%)";
  } else if (baseTextureType === "grid") {
    context.strokeStyle = "rgb(220 220 220)";
  }

  context.beginPath();
  for (let i = 0; i <= numLines; i++) {
    const xStep = width / numLines * i;
    const yStep = height / numLines * i;
    context.moveTo(xStep, 0);
    context.lineTo(xStep, height);
    context.moveTo(0, yStep);
    context.lineTo(width, yStep);
  }
  context.stroke();

  if (baseTextureType == 'uv_grid') {
    context.strokeStyle = "rgb(0 0 0)";
    context.lineWidth = 8;
    context.font = '64px sans-serif';
    context.textAlign = 'right';
    context.fillText('u', width - 12, height - 32);
    context.textAlign = 'left';
    context.fillText('v', 24, 64);
    context.beginPath();
    context.moveTo(12, 12);
    context.lineTo(12, height - 12);
    context.lineTo(width - 12, height - 12);
    context.stroke();
  }
  refreshTexture();
}

export { initializeTextureCanvas };