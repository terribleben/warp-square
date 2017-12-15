import Expo from 'expo';
import React from 'react';
import {
  Dimensions,
  PanResponder,
  PixelRatio,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as THREE from 'three';
import ExpoTHREE from 'expo-three';
import Player from './Entities/Player';
import SoundManager from './Assets/SoundManager';
import Surface from './Entities/Surface';
import HUD from './HUD/HUD';
import { SmallParticle, RadialParticle, BadParticle, BackgroundParticle } from './Entities/Particles';

const SCREEN_SCALE = PixelRatio.get();

const GAME_LOADING = 0, GAME_STARTED = 1, GAME_FINISHED = 2;
const LEVEL_COLORS = [
  '#ee0000',
  '#eeaa00',
  '#efef00',
  '#00ee00',
  '#00eeee',
  '#ee00ee',
  '#ff7777',
  '#007700',
  '#0077ee',
  '#666666'
];

export default class Game extends React.Component {
  state = {
    gameStatus: GAME_LOADING,
    level: 0,
    score: 0,
    subscore: 0,
    hudTop: 0,
    overlayWidth: 0,
    gameOverHeight: 0,
  };

  render() {
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: this._touch.bind(this),
      onPanResponderMove: this._touch.bind(this),
      onPanResponderRelease: this._release.bind(this),
      onPanResponderTerminate: this._release.bind(this),
      onShouldBlockNativeResponder: () => false,
    });
    let otherStuff = (this.state.gameStatus == GAME_FINISHED) ? this._renderGameOver() : this._renderReactHUD();
    let maybeScore = (this.state.gameStatus !== GAME_FINISHED) ? this._renderReactScore() : null;
    return (
      <View {...this.props}>
        <StatusBar hidden={true} animated={false} />
        <Expo.KeepAwake />
        <Expo.GLView
          style={this.props.style}
          {...panResponder.panHandlers}
          onContextCreate={this._onGLContextCreate}
        />
        {otherStuff}
        {maybeScore}
      </View>
    );
  }

  _renderGameOver() {
    return (
      <View style={[styles.gameOver, { width: this.state.overlayWidth, height: this.state.gameOverHeight }]}>
        <TouchableOpacity
          style={styles.restartButton}
          onPress={this._restart}>
          <View><Text style={styles.gameOverText}>GAME OVER</Text></View>
        </TouchableOpacity>
        <Text style={styles.detailText}>MAX PWR {this._maxLevel}</Text>
        <Text style={styles.detailText}>SCORE {this.state.score}</Text>
        <TouchableOpacity
          style={styles.restartButton}
          onPress={this._restart}>
          <View><Text style={styles.restartText}>RESTART</Text></View>
        </TouchableOpacity>
      </View>
    );
  }

  _renderReactHUD() {
    if (this.state.gameStatus == GAME_LOADING) {
      return;
    }
    return (
      <View style={[styles.hud, { top: this.state.hudTop }]}>
        <Text style={[styles.levelText, { color: this.getLevelColor() }]}>
          PWR {this.state.level}
        </Text>
      </View>
    );
  }

  _renderReactScore() {
    let maybeSubscore = (this.state.subscore > 0) ?
      (<Text style={[styles.levelText, { color: this.getLevelColor() }]}>+{this.state.subscore}</Text>) :
      null;
    return (
      <View style={[styles.hud, { top: 8 }]}>
        <Text style={[styles.levelText, { color: '#ffffff' }]}>
          SCORE {this.state.score}
        </Text>
        {maybeSubscore}
      </View>
    );
  }

  getGame() {
    return this;
  }

  getDifficulty() {
    return this._difficulty;
  }

  getLevelColor(level) {
    if (!Number.isInteger(level)) {
      level = this.state.level;
    }
    let colorIdx = (level < LEVEL_COLORS.length) ? level : LEVEL_COLORS.length - 1;
    return LEVEL_COLORS[colorIdx];
  }

  onPlatformLanded(platform) {
    let newNumPlatformsLanded = this._numPlatformsLanded + 1;
    SoundManager.playSoundAsync('morepwr', { rate: 0.8 + (0.2 * newNumPlatformsLanded) });
    this.setState({ subscore: this.state.subscore + (10 * (this.state.level + 1)) });
    if (newNumPlatformsLanded == 5) {
      this.setIsInverted(!this._isInverted, true);
      this._setNumPlatformsLanded(0);
      this._setLevel(this.state.level + 1);
      for (let ii = 0; ii < 5; ii++) {
        let particle = new RadialParticle(this._scene, this._viewport, {
          position: {
            x: this._player.getPositionX(),
            y: 0,
          },
          scaleFactor: (ii + 1) * 3,
        });
        this._particles[this._nextParticleId++] = particle;
      }
    } else {
      this._setNumPlatformsLanded(newNumPlatformsLanded);
    }
    let particles = platform.getImpactParticles(this._isInverted);
    for (let ii = 0; ii < particles.length; ii++) {
      this._particles[this._nextParticleId++] = particles[ii];
    }
  }

  onPlatformMissed() {
    this._setNumPlatformsLanded(0);
    this.setIsInverted(!this._isInverted, false);
    if (this.state.level > 0) {
      this._setLevel(this.state.level - 1);
      this._makeBadParticles();
    } else {
      // begin game over sequence
      this._surface.lightUp('#ff0000');
      this._player.explode();
      SoundManager.playSoundAsync('pwrdown');
      SoundManager.playSoundAsync('gameover');
    }
  }

  _makeBadParticles() {
    for (let ii = 0; ii < 5; ii++) {
      let particle = new BadParticle(this._scene, this._viewport, {
        position: {
          x: this._player.getPositionX(),
          y: 0,
        },
        scaleMult: 0.99 - (ii * 0.01),
        aVel: ii * 2.0,
      });
      this._particles[this._nextParticleId++] = particle;
    }
  }

  _setNumPlatformsLanded(numPlatformsLanded) {
    this._numPlatformsLanded = numPlatformsLanded;
    this._hud.setProgress(this._numPlatformsLanded / 4.0);
  }

  _setLevel(level) {
    this._maxLevel = Math.max(this._maxLevel, level);
    if (level !== this.state.level) {
      if (level > this.state.level) {
        // difficulty will only increase, not go back down
        this._difficulty += (level - this.state.level);
        this._player.setMaxVelMore(this._difficulty);
        this._surface.lightUp('#ffffff');
        SoundManager.playSoundAsync('pwrup', { rate: Math.pow(2.0, this.state.level / 9.0) });
      } else {
        this._surface.lightUp('#ff0000');
        SoundManager.playSoundAsync('pwrdown');
      }
      this.setState({
        level,
        score: this.state.score + this.state.subscore,
        subscore: 0,
      }, () => {
        this._hud.setLevel(level);
      });
    } else {
      this._hud.setLevel(level);
    }
  }

  setIsInverted(isInverted, isLevelUp) {
    this._isInverted = isInverted;
    if (this.state.gameStatus == GAME_STARTED) {
      this._player.setIsInverted(isInverted, isLevelUp);
    }
  }

  gameOver() {
    if (this.state.gameStatus === GAME_STARTED) {
      this.setState({
        gameStatus: GAME_FINISHED,
        score: this.state.score + this.state.subscore,
        subscore: 0,
      }, () => {
        this._player.destroy(this._scene);
        this._player = null;
        this._hud.destroy(this._scene);
        this._hud = null;
      });
    }
  }

  _onGLContextCreate = async (glContext) => {
    this._glContext = glContext;
    this._restart();
    
    let lastFrameTime;
    const render = () => {
      requestAnimationFrame(render);
      const now = 0.001 * global.nativePerformanceNow();
      const dt = typeof lastFrameTime !== "undefined" ? now - lastFrameTime : 0.16666;

      this._tick(dt);
      this._renderer.render(this._scene, this._camera);

      this._glContext.endFrameEXP();
      lastFrameTime = now;
    }
    render();
  }

  _tick = (dt) => {
    this._updateCamera();
    if (this.state.gameStatus === GAME_STARTED) {
      this._player.tick(dt);
      if (this._hud) {
        this._hud.tick(dt);
      }
    }
    this._surface.tick(dt);
    for (let key in this._particles) {
      if (this._particles.hasOwnProperty(key)) {
        this._particles[key].tick(dt);
        if (!this._particles[key].isAlive()) {
          this._particles[key].destroy(this._scene);
          delete this._particles[key];
        }
      }
    }
    for (let ii = 0, nn = this._bgParticles.length; ii < nn; ii++) {
      this._bgParticles[ii].tick(dt);
    }
  }

  _touch(event, gesture) {
    let { nativeEvent } = event;
    let touches = nativeEvent ? nativeEvent.touches : null;
    if (this.state.gameStatus == GAME_STARTED) {
      this._player.touch(touches, gesture);
    }
  };

  _release(event, gesture) {
    let { nativeEvent } = event;
    let touches = nativeEvent ? nativeEvent.changedTouches : null;
    if (this.state.gameStatus == GAME_STARTED) {
      this._player.release(touches, gesture);
    }
  }

  _makeBgParticles() {
    for (let ii = 0; ii < 6; ii++) {
      let particle = new BackgroundParticle(this._scene, this._viewport, {
        position: {
          x: this._viewport.width * (-0.5 + Math.random() * 2.0),
          y: this._viewport.width * (-0.2 + Math.random() * 0.3),
          z: -49,
        },
        rotation: Math.PI * Math.random(),
        color: 0x252525,
        parallax: 0.9,
      });
      this._bgParticles.push(particle);
    }
    for (let ii = 0; ii < 6; ii++) {
      let particle = new BackgroundParticle(this._scene, this._viewport, {
        position: {
          x: this._viewport.width * (-0.5 + Math.random() * 2.0),
          y: this._viewport.width * (-0.1 + Math.random() * 0.4),
          z: -50,
        },
        rotation: Math.PI * Math.random(),
        color: 0x191919,
        parallax: 0.95,
      });
      this._bgParticles.push(particle);
    }
  }

  _restart = () => {
    SoundManager.playSoundAsync('select');
    SoundManager.loopSoundAsync('music', { volume: 0.6 });
    this._destroy();
    const gl = this._glContext;
    this._scene = new THREE.Scene();
    this._restartCamera(gl);
    this._renderer = ExpoTHREE.createRenderer({ gl });
    this._renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    this._isInverted = false;
    this._numPlatformsLanded = 0;
    this._difficulty = 0;

    const geom = new THREE.PlaneBufferGeometry(this._viewport.width, this._viewport.height);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x0 });
    this._bgMesh = new THREE.Mesh(geom, bgMaterial);
    this._bgMesh.position.z = -99;
    this._scene.add(this._bgMesh);
 
    this._surface = new Surface(this.getGame.bind(this), this._scene, this._viewport);
    this._player = new Player(this._scene, this._viewport, this._surface);
    this._hud = new HUD(this.getGame.bind(this), this._scene, this._viewport);
    this._particles = {};
    this._bgParticles = [];
    this._nextParticleId = 0;
    this._maxLevel = 0;
    this._makeBgParticles();
    this._setLevel(0);
    this.setState({
      gameStatus: GAME_STARTED,
      hudTop: (this._viewport.screenHeight / SCREEN_SCALE) - 56,
      overlayWidth: this._viewport.screenWidth / SCREEN_SCALE,
      gameOverHeight: (this._viewport.screenHeight / SCREEN_SCALE) - 48,
      score: 0,
      subscore: 0,
    });
  }

  _destroy = () => {
    if (this._bgMesh) {
      this._scene.remove(this._bgMesh);
    }
    if (this._player) {
      this._player.destroy(this._scene);
      this._player = null;
    }
    if (this._surface) {
      this._surface.destroy(this._scene);
      this._surface = null;
    }
    if (this._hud) {
      this._hud.destroy(this._scene);
      this._hud = null;
    }
    if (this._particles) {
      for (let key in this._particles) {
        if (this._particles.hasOwnProperty(key)) {
          this._particles[key].destroy(this._scene);
        }
      }
      this._particles = null;
    }
    if (this._bgParticles) {
      for (let ii = 0, nn = this._bgParticles.length; ii < nn; ii++) {
        this._bgParticles[ii].destroy(this._scene);
      }
      this._bgParticles = null;
    }
  }

  _restartCamera = (glContext) => {
    let width, height;
    const screenWidth = glContext.drawingBufferWidth,
          screenHeight = glContext.drawingBufferHeight;
    console.log('setting up camera with screen width/height:', screenWidth, screenHeight)
    if (screenWidth > screenHeight) {
      width = 4;
      height = (screenHeight / screenWidth) * width;
      this._camera = new THREE.OrthographicCamera(
        -width / 2, width / 2,
        height / 2, -height / 2,
        1, 10000,
      );
    } else {
      width = 4;
      height = (screenWidth / screenHeight) * width;
      this._camera = new THREE.OrthographicCamera(
        -width / 2, width / 2,
        height / 2, -height / 2,
        1, 10000,
      );
    }
    this._camera.position.z = 1000;
    this._viewport = {
      width,
      height,
      screenWidth: (screenWidth > screenHeight) ? screenWidth : screenHeight,
      screenHeight: (screenWidth > screenHeight) ? screenHeight : screenWidth,
    };
  }

  _updateCamera() {
    if (this.state.gameStatus === GAME_STARTED) {
      let playerPos = this._player.getPositionX();
      this._camera.left = playerPos - this._viewport.width * 0.5;
      this._camera.right = playerPos + this._viewport.width * 0.5;
      this._camera.updateProjectionMatrix();
      this._surface.cameraDidUpdate(playerPos);
      this._hud.cameraDidUpdate(playerPos);
      for (let ii = 0, nn = this._bgParticles.length; ii < nn; ii++) {
        this._bgParticles[ii].cameraDidUpdate(playerPos);
      }
      this._bgMesh.position.x = playerPos;
    }
  }
};

let styles = StyleSheet.create({
  gameOver: {
    position: 'absolute',
    top: 48,
    left: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameOverText: {
    color: '#ff00ff',
    fontFamily: 'monofont',
    backgroundColor: 'transparent',
    fontSize: 64,
    textAlign: 'center',
  },
  restartButton: {
    backgroundColor: 'transparent',
  },
  restartText: {
    textAlign: 'center',
    color: '#ff0000',
    fontFamily: 'monofont',
    fontSize: 24,
    margin: 12,
  },
  detailText: {
    textAlign: 'center',
    color: '#000000',
    fontFamily: 'monofont',
    fontSize: 24,
    margin: 4,
  },
  hud: {
    position: 'absolute',
    left: 12,
    width: 128,
    backgroundColor: 'transparent',
  },
  levelText: {
    backgroundColor: 'transparent',
    fontSize: 24,
    fontFamily: 'monofont',
  },
})
