import Exponent from 'exponent';
import React from 'react';
import {
  Dimensions,
  PanResponder
} from 'react-native';

import Player from './Entities/Player';
import Platform from './Entities/Platform';
import Surface from './Entities/Surface';

const THREE = require('three');
const THREEView = Exponent.createTHREEViewClass(THREE);

export default class Game extends React.Component {
  constructor(props, context) {
    super(props, context);
    this._prepareCamera();
    this._prepareScene();
  }

  render() {
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: this._touch.bind(this),
      onPanResponderRelease: this._release.bind(this),
      onPanResponderTerminate: this._release.bind(this),
      onShouldBlockNativeResponder: () => false,
    });
    return (
      <THREEView
        {...this.props}
        {...panResponder.panHandlers}
        scene={this._scene}
        camera={this._camera}
        tick={this._tick.bind(this)}
      />
    );
  }

  _tick(dt) {
    this._player.tick(dt);
    this._surface.tick(dt);
    for (let ii = 0; ii < 2; ii++) {
      this._platforms[ii].tick(dt);
    }
  }

  _touch(_, gesture) {
    this._player.touch(gesture);
  };

  _release(_, gesture) {
    this._player.release(gesture);
  }

  _prepareScene(scene) {
    this._scene = new THREE.Scene();
    this._surface = new Surface(this._scene, this._viewport);
    this._player = new Player(this._scene, this._viewport, this._surface);
    this._platforms = [];
    for (let ii = 0; ii < 2; ii++) {
      this._platforms.push(new Platform(this._scene, this._viewport, this._surface));
    }
  }

  _prepareCamera() {
    const width = 4;
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const height = (screenHeight / screenWidth) * width;
    this._camera = new THREE.OrthographicCamera(
      -width / 2, width / 2,
      height / 2, -height / 2,
      1, 10000,
    );
    this._camera.position.z = 1000;
    this._viewport = {
      width,
      height,
      screenWidth,
      screenHeight,
    };
  }
};
