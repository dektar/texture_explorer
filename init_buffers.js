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

  // Now create an array of positions for the square.
  // Seems to be (x,y), (x,y), etc.
  const positions = [
      -1.0, -1.0, 0.0,
      -1.0, 1.0, 0.0,
      1.0, -1.0, 0.0,
      1.0, 1.0, 0.0,
  ];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return positionBuffer;
}

function initIndexBuffer(gl) {
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.
  const indices = [
    0, 1, 3,
    0, 3, 2,
  ];

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW,
  );

  return indexBuffer;
}

function initTextureBuffer(gl) {
  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  // The (u,v) texture coordinates of each triangle vertex.
  const textureCoordinates = [
      0.0, 0.0,
      0.0, 1.0, 
      1.0, 0.0, 
      1.0, 1.0, 
    ];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

  return textureCoordBuffer;
}

export { initBuffers };