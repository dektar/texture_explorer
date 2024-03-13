// This whole file is hacky and needs to be refactored!

function initializeSonificationListeners() {
  const sonify3DBtn = document.getElementById('sonify3d');
  sonify3DBtn.onclick = () => {
    toggleSonification3d();
  }
  const sonify2DBtn = document.getElementById('sonify2d');
  sonify2DBtn.onclick = () => {
    toggleSonification2d();
  }
}

let oscillator3d = null;
let oscillator2d = null;

function toggleSonification3d() {
  if (oscillator3d !== null) {
    stopSonification3d();
    return;
  }
  // create web audio api context
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // create Oscillator node
  oscillator3d = audioCtx.createOscillator();
  oscillator3d.type = "sine";
  const canvas = document.querySelector('#glcanvas');
  let glContext = canvas.getContext('webgl');
  const numChannels = 4;
  const pixels = new Uint8Array(
    glContext.drawingBufferWidth * glContext.drawingBufferHeight * numChannels,
  );
  glContext.readPixels(
    0,
    0,
    glContext.drawingBufferWidth, // 640
    glContext.drawingBufferHeight,  // 480
    glContext.RGBA,
    glContext.UNSIGNED_BYTE,
    pixels,
  );
  const duration = 0.005;
  let foundAnyPixels = false;
  // I did take CS149 and I apologize for this terribly inefficient loop.
  for (let i = 0; i < glContext.drawingBufferWidth; i++) {
    let foundInColumn = false;
    for (let j = glContext.drawingBufferHeight - 1; j >= 0; j--) {
      let index = (glContext.drawingBufferWidth * j + i) * numChannels;
      if (pixels[index] === 255 && pixels[index + 1] == 0 && pixels[index + 2] == 0) {
        foundInColumn = true;
        // Height j determines pitch.
        // Width i determines time.
        oscillator3d.frequency.setValueAtTime(150 + 1.5 * j, audioCtx.currentTime + duration * i); // value in hertz
        break;
      }
    }
    if (!foundInColumn) {
      oscillator3d.frequency.setValueAtTime(0, audioCtx.currentTime + duration * i);
    } else {
      foundAnyPixels = true;
    }
  }
  if (!foundAnyPixels) {
    oscillator3d = null;
    stopSonification3d();
    return;
  }
  oscillator3d.connect(audioCtx.destination);
  oscillator3d.start();
  oscillator3d.stop(audioCtx.currentTime + (canvas.width + 1) * duration);
  oscillator3d.onended = () => {
    stopSonification3d();
  }
  document.getElementById('sonify3d').value = 'Stop';
}

function toggleSonification2d() {
  if (oscillator2d !== null) {
    stopSonification2d();
    return;
  }
  // create web audio api context
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // create Oscillator node
  oscillator2d = audioCtx.createOscillator();
  oscillator2d.type = "sine";
  const canvas = document.querySelector('#texturecanvas');
  const context = canvas.getContext("2d");
  const numChannels = 4;
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const duration = 0.005;
  let foundAnyPixels = false;
  // I did take CS149 and I apologize for this terribly inefficient loop.
  for (let i = 0; i < canvas.width; i++) {
    let foundInColumn = false;
    for (let j = 0; j < canvas.height; j++) {
      let index = (canvas.width * j + i) * numChannels;
      if (pixels[index] === 255 && pixels[index + 1] == 0 && pixels[index + 2] == 0) {
        foundInColumn = true;
        // Height j determines pitch.
        // Width i determines time.
        oscillator2d.frequency.setValueAtTime(900 - 1.5 * j, audioCtx.currentTime + duration * i); // value in hertz
        break;
      }
    }
    if (!foundInColumn) {
      oscillator2d.frequency.setValueAtTime(0, audioCtx.currentTime + duration * i);
    } else {
      foundAnyPixels = true;
    }
  }
  if (!foundAnyPixels) {
    oscillator2d = null;
    stopSonification2d();
    return;
  }
  oscillator2d.connect(audioCtx.destination);
  oscillator2d.start();
  oscillator2d.stop(audioCtx.currentTime + (canvas.width + 1) * duration);
  oscillator2d.onended = () => {
    stopSonification2d();
  }
  document.getElementById('sonify2d').value = 'Stop';
}

function stopSonification3d() {
  if (oscillator3d !== null) {
    oscillator3d.stop();
    oscillator3d = null;
  }
  document.getElementById('sonify3d').value = 'Sonify 3D';
}

function stopSonification2d() {
  if (oscillator2d !== null) {
    oscillator2d.stop();
    oscillator2d = null;
  }
  document.getElementById('sonify2d').value = 'Sonify 2D';
}

export { stopSonification2d, stopSonification3d, initializeSonificationListeners }