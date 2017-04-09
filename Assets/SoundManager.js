
import Expo from 'expo';
let { Asset, Audio } = Expo;

class SoundManager {
  constructor() {
    this._sounds = {};
    this._setUpAsync();
  }

  _setUpAsync = async () => {
    await Audio.setIsEnabledAsync(true);
  }
  
  _setSound = (key, sound) => {
    this._sounds[key] = sound;
  }

  loadSoundAsync = async (key, module) => {
    if (typeof module === 'number') {
      await Asset.fromModule(module).downloadAsync();
    }
    const sound = new Audio.Sound({
      source: module,
    });
    this._setSound(key, sound);
    return sound.loadAsync();
  }

  /**
   *  options:
   *  rate - use this rate if specified
   *  rateRandom - multiply rate by a random number in (1 - rateRandom, 1 + rateRandom)
   */
  playSoundAsync = async (key, options) => {
    const sound = this._sounds[key];
    if (sound) {
      if (options && options.rate) {
        let rate = options.rate;
        if (options.rateRandom) {
          let random = -options.rateRandom + (Math.random() * options.rateRandom * 2.0);
          rate *= 1.0 + random;
        }
        rate = Math.min(32.0, Math.max(0.0, rate));
        await sound.setRateAsync(rate, false);
      }
      try {
        // need to wrap in try/catch because sometimes seek fails for some reason.
        await sound.setPositionAsync(0);
      } catch (err) {
        console.log('err seeking sound:', err.userInfo);
      }
      return sound.playAsync();
    }
    return;
  }
}

export default new SoundManager();
