
const THREE = require('three');

const HUD_BAR_WIDTH = 1.0;

export default class HUD {
  constructor(getGame, scene, viewport) {
    this._getGame = getGame;
    this._cameraXOffset = 0;
    this._viewport = viewport;
    this._progress = 0;
    this._progressInterp = 0;

    /* let curve = new THREE.EllipseCurve(
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
    scene.add(this._ellipse); */
    const lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 3 } );
    this._line = new THREE.Line(this._makeRectGeometry(), lineMaterial);
    this._line.position.z = 10;
    this._line.position.y = viewport.height * -0.45;
    scene.add(this._line);

    this._meshGeometry = new THREE.PlaneGeometry(HUD_BAR_WIDTH, HUD_BAR_WIDTH * 0.12);
    this._meshMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this._mesh = new THREE.Mesh(this._meshGeometry, this._meshMaterial);
    this._mesh.position.z = this._line.position.z + 1;
    this._mesh.position.y = this._line.position.y;
    scene.add(this._mesh);
  }

  destroy(scene) {
    scene.remove(this._line);
    scene.remove(this._mesh);
  }

  setProgress(progress) {
    this._progress = progress;
  }

  setLevel(level) {
    let styleColor = this._getGame().getLevelColor();
    let hexColor = parseInt(styleColor.substring(1), 16)
    this._meshMaterial.color.setHex(hexColor);
  }

  tick(dt) {
    this._updateBarShape();
    this._progressInterp += (this._progress - this._progressInterp) * 0.1;
    this._line.position.x = this._cameraXOffset - this._viewport.width * 0.48 + HUD_BAR_WIDTH * 0.5;
    this._mesh.position.x = this._line.position.x;
  }

  cameraDidUpdate(x) {
    this._cameraXOffset = x;
  }

  _makeRectGeometry() {
      let shape = new THREE.Shape();
      let width = HUD_BAR_WIDTH, height = HUD_BAR_WIDTH * 0.12;
      shape.moveTo(-width / 2, -height / 2);
      shape.lineTo(width / 2, -height / 2);
      shape.lineTo(width / 2, height / 2);
      shape.lineTo(-width / 2, height / 2);
      shape.lineTo(-width / 2, -height / 2);
      shape.lineTo(width / 2, -height / 2);
      return new THREE.ShapeGeometry(shape);
    }

    _updateBarShape() {
      let vertices = this._mesh.geometry.vertices;

      if (vertices.length == 4) {
        let leftX = vertices[0].x;
        let barWidth = HUD_BAR_WIDTH * this._progressInterp;
        vertices[1].x = leftX + barWidth;
        vertices[3].x = leftX + barWidth;
      }

      // modify in place
      this._mesh.geometry.verticesNeedUpdate = true;
      this._mesh.geometry.computeBoundingSphere();
    }
};
