
const THREE = require('three');

export default class Platform {
  constructor(scene, viewport, surface) {
    this._viewport = viewport;
    this._surface = surface;
    this._radius = 0.3 + Math.random() * 0.3;

    const geometry = new THREE.PlaneBufferGeometry(0.1, this._radius * 2.0);

    this._material = new THREE.MeshBasicMaterial( { color: 0xdddddd } ),

    this._mesh = new THREE.Mesh(geometry, this._material);
    this._mesh.position.z = -1;
    this._mesh.position.y = (-0.4 + Math.random() * 0.8) * viewport.height;
    scene.add(this._mesh);
  }

  tick(dt) {
    let xLeft = this._surface.getDepth(this._mesh.position.y + this._radius);
    let xRight = this._surface.getDepth(this._mesh.position.y - this._radius);
    this._mesh.position.x = (xLeft + xRight) * 0.5;
    this._mesh.rotation.z = (xRight - xLeft) * this._radius;
  }
};
