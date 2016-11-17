
const THREE = require('three');

export default class Platform {
  constructor(getGame, getSurface, scene, viewport, options = {}) {
    this._viewport = viewport;
    this._getSurface = getSurface;
    this._isCollided = false;
    this._radius = (options.radius) ? options.radius : 0.3 + Math.random() * 0.3;
    this._geometry = new THREE.PlaneGeometry(this._radius * 2.0, 0.1);
    this._material = new THREE.MeshBasicMaterial( { color: 0xdddddd } ),
    this._mesh = new THREE.Mesh(this._geometry, this._material);
    this._mesh.position.z = -1;
    if (options.x) {
      this._mesh.position.x = options.x;
    } else {
      this._mesh.position.x = (-0.4 + Math.random() * 0.8) * viewport.width;
    }
    this._material.frustumCulled = false;
    this._mesh.frustumCulled = false;
    this._geometry.frustumCulled = false;
    this._geometry.computeBoundingSphere();
    scene.add(this._mesh);
  }

  getRadius() {
    return this._radius;
  }

  getPosition() {
    return this._mesh.position;
  }

  getRotation() {
    return this._mesh.rotation.z;
  }

  setIsCollided(isCollided) {
    this._isCollided = isCollided;
    this._material.color.setHex((isCollided) ? 0xff0000 : 0xdddddd);
  }

  tick(dt) {
    let yLeft = this._getSurface().getDepth(this._mesh.position.x + this._radius);
    let yRight = this._getSurface().getDepth(this._mesh.position.x - this._radius);
    this._mesh.position.y = (yLeft + yRight) * 0.5;
    this._mesh.rotation.z = -((yRight - yLeft) * this._radius * 2);
  }
};
