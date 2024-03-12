import { modelViewMatrix, projectionMatrix } from "./draw_scene.js";
import { triangle_indices, triangle_vertices, triangle_textureCoordinates } from "./init_buffers.js"

/**
 * Initializes pointer listeners on the webgl canvas that will project
 * screen points into 3D object space, perform an intersection test with
 * the object, and call the drawAtTextureUV to draw any updates.
 */
function initializeUnprojectListeners(canvas, drawAtTextureUV) {
  let drawing = false;

  canvas.addEventListener('mousedown', (event) => {
    drawing = true;
    projectCanvasPointToSurface(event.clientX, event.clientY, 
        canvas.getBoundingClientRect(), 
        /*isStart=*/true, drawAtTextureUV);
  });
  canvas.addEventListener('touchstart', (event) => {
    if (drawing) {
      return; // maybe this was an extra touch?
    }
    drawing = true;
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;
    projectCanvasPointToSurface(x, y, canvas.getBoundingClientRect(),
        /*isStart=*/true, drawAtTextureUV);
  });
  canvas.addEventListener('mouseup', (event) => {
    drawing = false;
  });
  canvas.addEventListener('touchend', (event) => {
    drawing = false;
  });
  canvas.addEventListener('mousemove', (event) => {
    if (!drawing) {
      return;
    }
    projectCanvasPointToSurface(event.clientX, event.clientY, 
        canvas.getBoundingClientRect(), false, drawAtTextureUV);
  });
  canvas.addEventListener('touchmove', (event) => {
    if (event.touches.length != 1) {
      return;
    }
    if (!drawing) {
      return;
    }
    event.preventDefault();
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;
    projectCanvasPointToSurface(x, y, canvas.getBoundingClientRect(), false, drawAtTextureUV);
  });
}

/**
 * Provate helper that actually does the unprojection.
 */
function projectCanvasPointToSurface(clientX, clientY, bounds, 
    isStart, drawAtTextureUV) {
  const x = clientX - bounds.left;
  const y = clientY - bounds.top;
  const z = 1; // clip plane at z = 1 (think of the perspective diagram).
  const screenPoint = vec3.fromValues(2 * x / bounds.width - 1, 1 - 2 * y / bounds.height, z);
  const cameraPoint = vec3.fromValues(0, 0, 0);

  // I found that, for model point [-1, -1, 0] (which is the square's bottom left corner)
  // projectionMatrix * modelViewMatrix * [-1, -1, 0] = expectedScreenPoint (with z = 1).
  // Now we just have to invert that!

  const unprojectMatrix = mat4.create();
  mat4.multiply(unprojectMatrix, projectionMatrix, modelViewMatrix);
  if (!mat4.invert(unprojectMatrix, unprojectMatrix)) {
    console.warn('could not invert projectionMatrix * modelViewMatrix!');
    return;
  }

  const worldToObject = mat4.create();
  if (!mat4.invert(worldToObject, modelViewMatrix)) {
    console.warn('could not invert the modelViewMatrix!');
    return;
  }

  // Create the object coordinates point that represents this screen point.
  // Note that vec3.transformMat4 will do the homogenous divide for us:
  // https://glmatrix.net/docs/vec3.js.html
  const objectSpaceMousePt = vec3.create();
  vec3.transformMat4(objectSpaceMousePt, screenPoint, unprojectMatrix);

  // Create the camera position in object coordinates.
  const objectSpaceCameraPt = vec3.create();
  vec3.transformMat4(objectSpaceCameraPt, cameraPoint, worldToObject);

  // The ray direction is from the camera towards the object space mouse point.
  const rayDir = vec3.create();
  vec3.subtract(rayDir, objectSpaceMousePt, objectSpaceCameraPt);
  vec3.normalize(rayDir, rayDir);

  findUVIntersectionOnObject(objectSpaceCameraPt, rayDir, isStart, drawAtTextureUV);
}

/**
 * Intersects the ray with origin `rayOrig` and direction `rayDir` with the
 * geometry, and informs the drawAtTextureUV if an intersection was found.
 */
function findUVIntersectionOnObject(rayOrig, rayDir, isStart, drawAtTextureUV) {
  let t = 1000;
  let u = 0;
  let v = 0;
  for (let i = 0; i < triangle_indices.length; i++) {
    // TODO: Could optimize by creating the list of verticies from triangle_vertices just once.
    const v0_index = triangle_indices[3 * i];
    const p0 = vec3.fromValues(triangle_vertices[3 * v0_index], 
        triangle_vertices[3 * v0_index + 1], 
        triangle_vertices[3 * v0_index + 2]);
    const v1_index = triangle_indices[3 * i + 1];
    const p1 = vec3.fromValues(triangle_vertices[3 * v1_index], 
        triangle_vertices[3 * v1_index + 1], 
        triangle_vertices[3 * v1_index + 2]);
    const v2_index = triangle_indices[3 * i + 2];
    const p2 = vec3.fromValues(triangle_vertices[3 * v2_index], 
        triangle_vertices[3 * v2_index + 1], 
        triangle_vertices[3 * v2_index + 2]);
    
    // https://gfxcourses.stanford.edu/cs248a/winter24/lecture/geometricqueries/slide_23
    const M = mat3.fromValues(
      p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2],
      p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2],
      -1 * rayDir[0], -1 * rayDir[1], -1 * rayDir[2]
    );
    
    const M_inv = mat3.create();
    if (!mat3.invert(M_inv, M)) {
      // console.warn('could not invert matrix for ray-triangle intersection');
      continue;
    }
    const u_v_t = vec3.create();
    vec3.transformMat3(u_v_t, vec3.subtract(vec3.create(), rayOrig, p0), M_inv);
    if (u_v_t[2] >= t) {
      // This was a further away hit.
      continue;
    }
    if (u_v_t[0] < 0 || u_v_t[1] < 0 || u_v_t[0] + u_v_t[1] > 1 || u_v_t[2] < 0) {
      // Not hit.
      continue;
    }
    // This is the best hit we've found so far.
    t = u_v_t[2];

    // Get uv texture coordinates for the three points.
    const u0 = triangle_textureCoordinates[2 * v0_index];
    const v0 = triangle_textureCoordinates[2 * v0_index + 1];
    const u1 = triangle_textureCoordinates[2 * v1_index];
    const v1 = triangle_textureCoordinates[2 * v1_index + 1];
    const u2 = triangle_textureCoordinates[2 * v2_index];
    const v2 = triangle_textureCoordinates[2 * v2_index + 1];

    // Interpolate the (u,v) on the texture for this u / v on the triangle.
    u = u0 * (1 - u_v_t[0] - u_v_t[1]) + u1 * u_v_t[0] + u2 * u_v_t[1];

    // Why is this 1-v? Oh well!
    // Perhaps gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); ?
    v = 1 - (v0 * (1 - u_v_t[0] - u_v_t[1]) + v1 * u_v_t[0] + v2 * u_v_t[1]);
  }
  if (t > 100) {
    // Not hit.
    return;
  }
  drawAtTextureUV(u, v, isStart);
}


export {initializeUnprojectListeners}