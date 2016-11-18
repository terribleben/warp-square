
const THREE = require('three');

export default class Platform {
  constructor(scene, viewport) {
    this._cameraXOffset = 0;
    this._viewport = viewport;

    let curve = new THREE.EllipseCurve(
    	0,  0,            // ax, aY
    	0.3, 0.3,           // xRadius, yRadius
    	0,  2 * Math.PI,  // aStartAngle, aEndAngle
    	false,            // aClockwise
    	0                 // aRotation
    );

    let path = new THREE.Path(curve.getPoints(32));
    let geometry = path.createPointsGeometry(32);
    let material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });

    // Create the final Object3d to add to the scene
    this._ellipse = new THREE.Line(geometry, material);
    this._ellipse.position.y = this._viewport.height * 0.35;
    scene.add(this._ellipse);
  }

  tick(dt) {
    this._ellipse.position.x = this._cameraXOffset - this._viewport.width * 0.4;
  }

  cameraDidUpdate(x) {
    this._cameraXOffset = x;
  }
};
