
const THREE = require('three');

const LEFT = 'left';
const RIGHT = 'right';
const NONE = 'none';
const MAX_VEL = 6;
const JUMP_VEL = 8;

export default class Player {
  constructor(scene, viewport, surface) {
    this._viewport = viewport;
    this._xAccel = 0;
    this._xVel = 0;
    this._yVel = 0;
    this._directionMoving = NONE;
    this._isJumping = false;
    this._surface = surface;

    // 1: Geometry
    // This defines the local shape of the object. In this case the geometry
    // will simply be a 1x1 plane facing the camera.
    const geometry = new THREE.PlaneBufferGeometry(0.15, 0.15);

    // 2: Material
    // This defines how the surface of the shape is painted. In this case we
    // want to paint a texture loaded from an asset and also tint it.
    // Nearest-neighbor filtering with `THREE.NearestFilter` is nice for
    // pixel art styles.
    /* const texture = THREEView.textureFromAsset(Assets['player-sprite']);
    texture.minFilter = texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    this._material = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0xff0000,    // Sprites can be tinted with a color.
      transparent: true,  // Use the image's alpha channel for alpha.
    }); */
    this._material = new THREE.MeshBasicMaterial( { color: 0xffffff } ),

    // 3: Mesh
    // A mesh is a node in THREE's scenegraph and refers to a geometry and a
    // material to draw itself. It can be translated and rotated as any other
    // scenegraph node.
    this._mesh = new THREE.Mesh(geometry, this._material);
    this._mesh.position.z = -1;
    scene.add(this._mesh);
  }

  tick(dt) {
    let viewportHalfWidth = this._viewport.width / 2;

    if (this._directionMoving == NONE) {
      this._xAccel = 0;
      if (!this._isJumping) {
        this._xVel *= 0.92;
      }
    } else {
      this._xAccel = (this._directionMoving == LEFT) ? -32 : 32;
      this._xVel += this._xAccel * dt;
      if (this._xVel < -MAX_VEL) this._xVel = -MAX_VEL;
      if (this._xVel > MAX_VEL) this._xVel = MAX_VEL;
    }
    this._mesh.position.x += (this._xVel * dt);
    if (this._mesh.position.x < -viewportHalfWidth) {
      this._mesh.position.x = -viewportHalfWidth;
      this._xVel = 0;
    }
    if (this._mesh.position.x > viewportHalfWidth) {
      this._mesh.position.x = viewportHalfWidth;
      this._xVel = 0;
    }

    let surfaceBelow = this._surface.getDepth(this._mesh.position.x) + 0.05;
    if (this._isJumping) {
      this._yVel -= 0.4;
      this._mesh.position.y += (this._yVel * dt);
      if (this._mesh.position.y <= surfaceBelow && this._yVel <= 0) {
        this._surface.impact(this._mesh.position.x, this._yVel * 0.02);
        this._isJumping = false;
        this._yVel = 0;
        this._mesh.position.y = surfaceBelow;
      }
    } else {
      this._mesh.position.y = surfaceBelow;
    }
  }

  touch(gesture) {
    if (gesture.x0 < 64) {
      this._directionMoving = LEFT;
    } else if (gesture.x0 > this._viewport.screenWidth - 64) {
      this._directionMoving = RIGHT;
    } else if (!this._isJumping) {
      this._isJumping = true;
      this._yVel = JUMP_VEL;
    }
  }

  release(gesture) {
    this._directionMoving = NONE;
  }
};
