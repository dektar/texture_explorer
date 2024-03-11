const ModelType = {
  SQUARE: 'square',
  CUBE: 'cube',
};

// This array defines each vertex as points in (x, y, z).
let triangle_vertices = [];

// This array defines each face as one triangle, using the
// indices into the vertex array to specify each triangle's
// position.
let triangle_indices = [];

// The (u,v) texture coordinates of each triangle vertex
// from triangle_vertices.
let triangle_textureCoordinates = [];

const plane_vertices = [
  -1.0, -1.0, 0.0, // 0
  -1.0, 1.0, 0.0, // 1
  1.0, -1.0, 0.0, // 2
  1.0, 1.0, 0.0, // 3
];
const plane_indices = [
  0, 3, 1,
  0, 2, 3,
];
const plane_textureCoordinates = [
  0.0, 0.0,
  0.0, 1.0, 
  1.0, 0.0, 
  1.0, 1.0, 
];

//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Creating_3D_objects_using_WebGL
const cube_vertices = [
  // Front face
  -0.5, -0.5, 0.0,
  0.5, -0.5, 0.0, 
  0.5, 0.5, 0.0, 
  -0.5, 0.5, 0.0,

  // Back face
  -0.5, -0.5, -1.0, 
  -0.5, 0.5, -1.0, 
  0.5, 0.5, -1.0, 
  0.5, -0.5, -1.0,

  // Top face
  -0.5, 0.5, -1.0, 
  -0.5, 0.5, 0.0, 
  0.5, 0.5, 0.0, 
  0.5, 0.5, -1.0,

  // Bottom face
  -0.5, -0.5, -1.0, 
  0.5, -0.5, -1.0, 
  0.5, -0.5, 0.0, 
  -0.5, -0.5, 0.0,

  // Right face
  0.5, -0.5, -1.0, 
  0.5, 0.5, -1.0, 
  0.5, 0.5, 0.0, 
  0.5, -0.5, 0.0,

  // Left face
  -0.5, -0.5, -1.0, 
  -0.5, -0.5, 0.0, 
  -0.5, 0.5, 0.0, 
  -0.5, 0.5, -1.0,
];
const cube_indices = [
  0, 1, 2,
  0, 2, 3, // front
  4, 5, 6,
  4, 6, 7, // back
  8, 9, 10,
  8, 10, 11, // top
  12, 13, 14,
  12, 14, 15, // bottom
  16, 17, 18,
  16, 18, 19, // right
  20, 21, 22,
  20, 22, 23, // left
];
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
const cube_textureCoordinates = [
  // Front
  0.33, 0.33, 
  .66, 0.33, 
  .66, .66, 
  0.33, .66,
  // Back (this becomes the bottom with the current model matrix).
  0.0, 0.0, 
  1.0, 0.0, 
  1.0, 1.0, 
  0.0, 1.0,
  // Top
  0.33, 1.0,
  0.33, 0.66, 
  .66, 0.66, 
  .66, 1.0, 
  // Bottom
  0.33, 0.0, 
  0.66, 0.0, 
  0.66, 0.33,
  0.33, 0.33, 
  // Right
  1.0, 0.33, 
  1.0, 0.66, 
  0.66, 0.66,
  0.66, 0.33, 
  // Left
  0.0, 0.33, 
  0.33, 0.33, 
  0.33, 0.66, 
  0.0, 0.66,
];

function initBuffers(gl, modelType) {
  if (modelType == ModelType.SQUARE) {
    triangle_vertices = plane_vertices;
    triangle_indices = plane_indices;
    triangle_textureCoordinates = plane_textureCoordinates;
  } else if (modelType == ModelType.CUBE) {
    triangle_vertices = cube_vertices;
    triangle_indices = cube_indices;
    triangle_textureCoordinates = cube_textureCoordinates;
  }
  const positionBuffer = initPositionBuffer(gl);
  const indexBuffer = initIndexBuffer(gl);
  const textureCoordBuffer = initTextureBuffer(gl);

  return {
    position: positionBuffer,
    indices: indexBuffer,
    textureCoord: textureCoordBuffer,
  };
}

function initPositionBuffer(gl) {
  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, 
      new Float32Array(triangle_vertices), 
      gl.STATIC_DRAW);

  return positionBuffer;
}

function initIndexBuffer(gl) {
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(triangle_indices),
    gl.STATIC_DRAW,
  );

  return indexBuffer;
}

function initTextureBuffer(gl) {
  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, 
      new Float32Array(triangle_textureCoordinates), 
      gl.STATIC_DRAW);

  return textureCoordBuffer;
}

export { initBuffers, triangle_vertices, triangle_indices, triangle_textureCoordinates };