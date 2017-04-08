
import Expo from 'expo';
let { Audio } = Expo;

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
    const sound = new Audio.Sound({
      source: module,
    });
    await sound.loadAsync();
    this._setSound(key, sound);
  }

  playSoundAsync = async (key) => {
    const sound = this._sounds[key];
    if (sound) {
      await sound.setPositionAsync(0);
      return sound.playAsync();
    }
    return;
  }
}

export default new SoundManager();
