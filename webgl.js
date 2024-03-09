// python2 -m SimpleHTTPServer 9000
// navigate to localhost:90000

import { drawScene, modelViewMatrix, projectionMatrix } from "./draw_scene.js";
import { initBuffers } from "./init_buffers.js";
import {initializeTextureCanvas} from "./texture.js";

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

  const textureChangeListener = initializeTextureCanvas((useNearestNeighbor, rotation, scale) => {
    updateTexture(gl, texture, document.querySelector("#texturecanvas"), useNearestNeighbor);
    // Draw the scene
    drawScene(gl, programInfo, buffers, texture, rotation, scale);
  });

  canvas.addEventListener("mousemove", (event) => {
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const z = 1; // clip plane at z
    const screenPoint = vec3.fromValues(2 * x / bounds.width - 1, 1 - 2 * y / bounds.height, z);
    const cameraPoint = vec3.fromValues(0, 0, 0);
    // could also go from screenPoint with -z instead of +z, which spans the whole projection.
    // that'd be like a start/end point instead of a start and a dir.

    // I found that, for model point [-1, -1, 0] (which is the square's bottom left corner)
    // projectionMatrix * modelViewMatrix * [-1, -1, 0] = expectedScreenPoint (with z = 1)

    const unprojectMatrix = mat4.create();
    mat4.multiply(unprojectMatrix, projectionMatrix, modelViewMatrix);
    if (!mat4.invert(unprojectMatrix, unprojectMatrix)) {
      console.warn('could not invert projectionMatrix * modelViewMatrix!');
      return;
    }

    const worldToObject = mat4.create();
    mat4.invert(worldToObject, modelViewMatrix);

    // Create the world point that represents this screen point.
    // Note that vec3.transformMat4 will do the homogenous divide for us:
    // https://glmatrix.net/docs/vec3.js.html
    // Actually this is probably in object coordinates
    const objectSpaceMousePt = vec3.create();
    vec3.transformMat4(objectSpaceMousePt, screenPoint, unprojectMatrix);

    // In object coordinates?
    const objectSpaceCameraPt = vec3.create();
    vec3.transformMat4(objectSpaceCameraPt, cameraPoint, worldToObject);

    const rayDir = vec3.create();
    vec3.subtract(rayDir, objectSpaceMousePt, objectSpaceCameraPt);

    // Maybe the eye is at (0, 0, 0)
    // and the direction is worldPoint
    // then we have to intersect with plane z = 0 to get triangles.

    // TODO: The math is pretty simple, so I should try to do it manually.

    // Object-space coordinates of a normal to the plane (which is in x,y),
    // so the normal is the unit z direction.
    const norm = vec3.fromValues(0, 0, 1);

    // Object-space coordinates of any point in the plane we are trying to intersect
    // (0, 0, 0 is in the z = 0 plane), and at the center of the square.
    const planePt = vec3.fromValues(0, 0, 0);
    
    const t = vec3.dot(vec3.subtract(vec3.create(), planePt, objectSpaceCameraPt), norm) /
           vec3.dot(rayDir, norm);
    if (t <= 0) {
      console.log('Does not intersect model\'s z plane');
      return;
    }

    // Intersection in object coordinates.
    const intersection = vec3.add(vec3.create(), 
          vec3.scale(vec3.create(), objectSpaceMousePt, t), objectSpaceCameraPt);
    
    // console.log(t, objectSpaceMousePt, /*objectSpaceCameraPt,*/ rayDir, intersection);
    const u = (intersection[0] + 1) / 2;
    const v = (1 - intersection[1]) / 2;
    // console.log(intersection, u, v);
    textureChangeListener(u, v);
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
  return texture;
}

function updateTexture(gl, texture, textureCanvas, useNearestNeighbor) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  const level = 0;
  const internalFormat = gl.RGBA;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, textureCanvas);

  
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  if (useNearestNeighbor) {
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  } else {
    // TextureCanvas is a power of 2 so we can generate mipmaps.
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  return texture;
}
