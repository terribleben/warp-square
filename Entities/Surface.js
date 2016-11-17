
const THREE = require('three');

const SURFACE_NUM_SEGMENTS = 24;
const SURFACE_NEUTRAL_DEPTH = 0;

export default class Surface {
  constructor(scene, viewport) {
    this._viewport = viewport;

    this._depths = [];
    for (let ii = 0; ii < SURFACE_NUM_SEGMENTS; ii++) {
      this._depths.push(-0.09 + Math.random() * 0.18);
    }

    this._material = new THREE.MeshBasicMaterial( { color: 0x555555 } ),
    this._mesh = new THREE.Mesh(this._getShapeGeometry(), this._material);
    scene.add(this._mesh);
  }

  tick(dt) {
    // this._mesh.geometry = this._getShapeGeometry();
  }

  _getShapeGeometry() {
    let width = this._viewport.height;
    let shape = new THREE.Shape();
    shape.moveTo(-this._viewport.width / 2, this._viewport.height / 2);

    // (interpolating, 1 + value)
    for (let ii = 0; ii < SURFACE_NUM_SEGMENTS; ii++) {
      let xInterp = ii / (SURFACE_NUM_SEGMENTS - 1.0);
      shape.lineTo(SURFACE_NEUTRAL_DEPTH + this._depths[ii], (this._viewport.height / 2) - (xInterp * width));
    }

    // bottom two corners
    shape.lineTo(-this._viewport.width / 2, -this._viewport.height / 2);
    shape.lineTo(-this._viewport.width / 2, this._viewport.height / 2);
    return new THREE.ShapeGeometry(shape);
  }
};
