// This array defines each vertex as points in (x, y, z).
const triangle_vertexes = [
    -1.0, -1.0, 0.0,
    -1.0, 1.0, 0.0,
    1.0, -1.0, 0.0,
    1.0, 1.0, 0.0,
    // -1.0, -1.0, -2.0, // add a side of the cube.
    // 1.0, -1.0, -2.0,
];

// This array defines each face as two triangles, using the
// indices into the vertex array to specify each triangle's
// position.
const triangle_indices = [
  0, 1, 3,
  0, 3, 2,
  // 0, 4, 2,
  // 4, 5, 2,
];

// The (u,v) texture coordinates of each triangle vertex
// from triangle_vertexes.
const triangle_textureCoordinates = [
  0.0, 0.0,
  0.0, 1.0, 
  1.0, 0.0, 
  1.0, 1.0, 
  // 0.0, 1.0,
  // 1.0, 1.0,
];

function initBuffers(gl) {
  const positionBuffer = initPositionBuffer(gl);
  const indexBuffer = initIndexBuffer(gl);
  // const colorBuffer = initColorBuffer(gl);
  const textureCoordBuffer = initTextureBuffer(gl);

  return {
    position: positionBuffer,
    indices: indexBuffer,
    // color: colorBuffer,
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
      new Float32Array(triangle_vertexes), 
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

export { initBuffers, triangle_vertexes, triangle_indices, triangle_textureCoordinates };