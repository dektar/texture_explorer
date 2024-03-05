// python2 -m SimpleHTTPServer 9000
// navigate to localhost:90000

import { drawScene } from "./draw_scene.js";
import { initBuffers } from "./init_buffers.js";

main();

/**
 * TODOs
 * gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureCanvas);
 *   can pass in pixels
 * load other shapes besides plane
 * 3D coordinates of mouse in webgl canvas: https://stackoverflow.com/questions/60136758/get-3d-coordinates-of-a-mouse-click-in-webgl
 */

//
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/
//
function main() {
  const canvas = document.querySelector("#glcanvas");
  // Initialize the GL context
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it.",
    );
    return;
  }

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Vertex shader program
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
  `;

  // Fragment shader program
  const fsSource = `
    varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVertexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  // Load the texture from the texture canvas.
  const texture = loadTexture(gl);
  // Flip image pixels into the bottom-to-top order that WebGL expects.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  initializeTextureCanvas(() => {
    updateTexture(gl, texture, document.querySelector("#texturecanvas"));
    // Draw the scene
    drawScene(gl, programInfo, buffers, texture);
  });
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram,
      )}`,
    );
    return null;
  }

  return shaderProgram;
}
  
//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

//
// Initialize a texture from textureCanvas.
//
function loadTexture(gl) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.generateMipmap(gl.TEXTURE_2D);
  return texture;
}

function updateTexture(gl, texture, textureCanvas) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  const level = 0;
  const internalFormat = gl.RGBA;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, textureCanvas);

  
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const useNearestNeighbor = document.getElementById("nearestNeighbor").checked;
  if (useNearestNeighbor) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  } else {
    // TextureCanvas is a power of 2 so we can generate mipmaps.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST_MIPMAP_LINEAR);
  }

  return texture;
}

function initializeTextureCanvas(refreshTextureCallback) {
  const textureCanvas = document.querySelector("#texturecanvas");
  const context = textureCanvas.getContext("2d");
  clearTexture(textureCanvas, refreshTextureCallback);

  let drawing = false;

  const startEventListener = (clientX, clientY) => {
    const bounds = textureCanvas.getBoundingClientRect();
    const x = clientX - bounds.left;
    const y = clientY - bounds.top;
    drawing = true;
    context.beginPath();
    context.moveTo(x - 1, y - 1);
    context.lineTo(x + 1, y + 1);
    context.stroke();
    // https://css-tricks.com/snippets/javascript/random-hex-color/
    context.strokeStyle = '#' + Math.floor(Math.random()*16777215).toString(16);
    refreshTextureCallback();
  };
  const moveEventListener = (clientX, clientY) => {
    if (drawing) {
      const bounds = textureCanvas.getBoundingClientRect();
      const x = clientX - bounds.left;
      const y = clientY - bounds.top;
      context.lineTo(x, y);
      context.stroke();
      refreshTextureCallback();
    }
  };
  const upEventListener = () => {
    drawing = false;
    refreshTextureCallback();
  };

  // Set up mouse listeners on the texture canvas.
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
  clearBtn.onclick = () => clearTexture(textureCanvas, refreshTextureCallback);

  // Nearest neighbor checkbox.
  const nearestNeighborBtn = document.getElementById("nearestNeighbor");
  nearestNeighborBtn.addEventListener("change", () => {
    refreshTextureCallback();
  });
}

/** Resets the texture image to the defaults. */
function clearTexture(textureCanvas, refreshTextureCallback) {
  const context = textureCanvas.getContext("2d");
  const width = textureCanvas.width;
  const height = textureCanvas.height;
  context.clearRect(0, 0, width, height);
  const lineWidth = 2;
  const numLines = 32;
  context.lineWidth = lineWidth;
  context.strokeStyle = "SlateBlue";
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
  refreshTextureCallback();
}