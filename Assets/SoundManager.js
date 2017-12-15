
import Expo from 'expo';
import { Platform } from 'react-native';
let { Asset, Audio } = Expo;

class SoundManager {
  constructor() {
    this._isRateSupported = true;
    this._sounds = {};
    this._setUpAsync();
  }

  _setUpAsync = async () => {
    this._isRateSupported = !(Platform.OS === 'android' && Platform.Version < 23);
    await Audio.setIsEnabledAsync(true);
  }
  
  _setSound = (key, sound) => {
    this._sounds[key] = sound;
  }

  loadSoundAsync = async (key, module) => {
    if (typeof module === 'number') {
      await Asset.fromModule(module).downloadAsync();
    }
    const { sound, status } = await Audio.Sound.create(module);
    this._setSound(key, sound);
    return sound;
  }

  /**
   *  options:
   *  rate - use this rate if specified
   *  rateRandom - multiply rate by a random number in (1 - rateRandom, 1 + rateRandom)
   */
  playSoundAsync = async (key, options) => {
    const sound = this._sounds[key];
    if (sound) {
      // let statusToSet = {};
      if (options && options.rate && this._isRateSupported) {
        let rate = options.rate;
        if (options.rateRandom) {
          let random = -options.rateRandom + (Math.random() * options.rateRandom * 2.0);
          rate *= 1.0 + random;
        }
        rate = Math.min(32.0, Math.max(0.0, rate));
        // statusToSet.rate = rate;
        // statusToSet.shouldCorrectPitch = false;
      }
      return sound.replayAsync();
    }
    return;
  }

  /**
   *  options:
   *  volume
   *  restart - whether to stop and restart if already playing
   */
  loopSoundAsync = async (key, options) => {
    const sound = this._sounds[key];
    if (sound) {
      let statusToSet = {};
      let { isPlaying } = await sound.getStatusAsync();
      if (isPlaying && options.restart) {
        await sound.stopAsync();
      }
      if (options && options.volume) {
        statusToSet.volume = options.volume;
      }
      statusToSet.positionMillis = 0;
      statusToSet.shouldPlay = true;
      statusToSet.isLooping = true;
      return sound.setStatusAsync(statusToSet);
    }
    return;
  }
}

export default new SoundManager();
