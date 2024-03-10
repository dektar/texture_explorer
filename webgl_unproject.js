import { modelViewMatrix, projectionMatrix } from "./draw_scene.js";

/**
 * Initializes pointer listeners on the webgl canvas that will project
 * screen points into 3D object space, perform an intersection test with
 * the object, and call the textureChangeListener to draw any updates.
 */
function initializeUnprojectListeners(canvas, textureChangeListener) {
  let drawing = false;
  const bounds = canvas.getBoundingClientRect();

  canvas.addEventListener('mousedown', (event) => {
    drawing = true;
    projectCanvasPointToSurface(event.clientX, event.clientY, bounds, 
        /*isStart=*/true, textureChangeListener);
  });
  canvas.addEventListener('touchstart', (event) => {
    if (drawing) {
      return; // maybe this was an extra touch?
    }
    drawing = true;
    event.preventDefault();
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;
    projectCanvasPointToSurface(x, y, bounds, /*isStart=*/true, 
        textureChangeListener);
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
    projectCanvasPointToSurface(event.clientX, event.clientY, bounds, 
        false, textureChangeListener);
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
    projectCanvasPointToSurface(x, y, bounds, false, textureChangeListener);
  });
}

/**
 * Provate helper that actually does the unprojection.
 */
function projectCanvasPointToSurface(clientX, clientY, bounds, 
    isStart, textureChangeListener) {
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

  // Object-space coordinates of a normal to the plane (which is in x,y),
  // so the normal is the unit z direction.
  const norm = vec3.fromValues(0, 0, 1);

  // Object-space coordinates of any point in the plane we are trying to intersect
  // (0, 0, 0 is in the z = 0 plane), and at the center of the square.
  const planePt = vec3.fromValues(0, 0, 0);
  
  // (planePt - objectSpaceCameraPt) * norm / (rayDir * norm)
  const t = vec3.dot(vec3.subtract(vec3.create(), planePt, objectSpaceCameraPt), norm) /
         vec3.dot(rayDir, norm);
  if (t <= 0) {
    console.log('Does not intersect model\'s z plane');
    return;
  }

  // Intersection in object coordinates.
  const intersection = vec3.add(vec3.create(), 
        vec3.scale(vec3.create(), rayDir, t), objectSpaceCameraPt);
  
  // console.log(t, objectSpaceMousePt, /*objectSpaceCameraPt,*/ rayDir, intersection);
  const u = (intersection[0] + 1) / 2;
  const v = (1 - intersection[1]) / 2;
  // console.log(intersection, u, v);
  textureChangeListener(u, v, isStart);
}


export {initializeUnprojectListeners}