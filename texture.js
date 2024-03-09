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
    textureCanvas.width = width * devicePixelRatio;
    textureCanvas.height = height * devicePixelRatio;
    textureCanvas.style.width = width + 'px';
    textureCanvas.style.height = height + 'px';
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
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
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(x - 1, y - 1);
    context.lineTo(x + 1, y + 1);
    context.stroke();
    // https://css-tricks.com/snippets/javascript/random-hex-color/
    context.strokeStyle = '#' + Math.floor(Math.random()*16777215).toString(16);
    refreshTexture();
  };
  const moveEventListener = (clientX, clientY) => {
    if (drawing) {
      const bounds = textureCanvas.getBoundingClientRect();
      const x = clientX - bounds.left;
      const y = clientY - bounds.top;
      context.lineTo(x, y);
      context.stroke();
      refreshTexture();
    }
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
    event.preventDefault();
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;
    startEventListener(x, y);
  });
  textureCanvas.addEventListener('mousemove', (event) => {
    moveEventListener(event.clientX, event.clientY);
  });
  textureCanvas.addEventListener('touchmove', (event) => {
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
  clearBtn.onclick = () => clearTexture(textureCanvas, refreshTexture);

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

  const textureChangeListener = (u, v) => {
    const bounds = textureCanvas.getBoundingClientRect();
    const x = u * bounds.width;
    const y = v * bounds.height;
    context.lineTo(x, y);
    context.stroke();
    refreshTexture();
  };
  return textureChangeListener;
}

/** Resets the texture image to the defaults. */
function clearTexture(textureCanvas, refreshTexture, width, height) {
  const context = textureCanvas.getContext("2d");
  context.clearRect(0, 0, width, height);

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

  const numLines = width / 8;
  context.lineWidth = 1;
  context.strokeStyle = "rgb(255 255 255 / 50%)";
  context.beginPath();
  for (let i = 0; i <= numLines; i++) {
    const xStep = width / numLines * i;
    const yStep = height / numLines * i;
    context.moveTo(xStep, 0);
    context.lineTo(xStep, height);
    context.stroke();
    context.moveTo(0, yStep);
    context.lineTo(width, yStep);
    context.stroke();
  }
  refreshTexture();
}

export { initializeTextureCanvas };