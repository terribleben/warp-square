
const THREE = require('three');

const LEFT = 'left';
const RIGHT = 'right';
const NONE = 'none';
const MAX_VEL = 10;

export default class Player {
  constructor(scene, viewport) {
    this._viewport = viewport;
    this._xAccel = 0;
    this._xVel = 0;
    this._directionMoving = NONE;

    // 1: Geometry
    // This defines the local shape of the object. In this case the geometry
    // will simply be a 1x1 plane facing the camera.
    const geometry = new THREE.PlaneBufferGeometry(0.3, 0.3);

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
    if (this._directionMoving == NONE) {
      this._xAccel = 0;
      this._xVel *= 0.98;
    } else {
      this._xAccel = (this._directionMoving == LEFT) ? 32 : -32;
      this._xVel += this._xAccel * dt;
      if (this._xVel < -MAX_VEL) this._xVel = -MAX_VEL;
      if (this._xVel > MAX_VEL) this._xVel = MAX_VEL;
    }
    this._mesh.position.y += (this._xVel * dt);
    if (this._mesh.position.y < -2.5) {
      this._mesh.position.y = -2.5;
      this._xVel = 0;
    }
    if (this._mesh.position.y > 2.5) {
      this._mesh.position.y = 2.5;
      this._xVel = 0;
    }
  }

  touch(gesture) {
    if (gesture.y0 < 64) {
      this._directionMoving = LEFT;
    } else if (gesture.y0 > this._viewport.screenHeight - 64) {
      this._directionMoving = RIGHT;
    }
  }

  release(gesture) {
    this._directionMoving = NONE;
  }
};
