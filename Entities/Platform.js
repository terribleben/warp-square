
const THREE = require('three');

export default class Platform {
  constructor(scene, viewport, surface, options = {}) {
    this._viewport = viewport;
    this._surface = surface;
    this._radius = 0.3 + Math.random() * 0.3;

    const geometry = new THREE.PlaneBufferGeometry(this._radius * 2.0, 0.1);

    this._material = new THREE.MeshBasicMaterial( { color: 0xdddddd } ),

    this._mesh = new THREE.Mesh(geometry, this._material);
    this._mesh.position.z = -1;
    if (options.x) {
      this._mesh.position.x = options.x;
    } else {
      this._mesh.position.x = (-0.4 + Math.random() * 0.8) * viewport.width;
    }
    scene.add(this._mesh);
  }

  tick(dt) {
    let yLeft = this._surface.getDepth(this._mesh.position.x + this._radius);
    let yRight = this._surface.getDepth(this._mesh.position.x - this._radius);
    this._mesh.position.y = (yLeft + yRight) * 0.5;
    this._mesh.rotation.z = -((yRight - yLeft) * this._radius * 2);
  }
};
