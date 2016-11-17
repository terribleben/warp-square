import Exponent from 'exponent';
import React from 'react';
import {
  Dimensions,
  PanResponder
} from 'react-native';

const THREE = require('three');
const THREEView = Exponent.createTHREEViewClass(THREE);

export default class Game extends React.Component {
  constructor(props, context) {
    super(props, context);
    const width = 4;
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const height = (screenHeight / screenWidth) * width;
    this._camera = new THREE.OrthographicCamera(
      -width / 2, width / 2,
      height / 2, -height / 2,
      1, 10000,
    );
    this._camera.position.z = 1000;
    this._scene = new THREE.Scene();
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

  }

  _touch(_, gesture) {

  };

  _release(_, gesture) {

  }
};
