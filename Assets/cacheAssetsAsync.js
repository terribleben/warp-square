import {
  Image,
} from 'react-native';
import {
  Asset,
  Font,
} from 'expo';

import SoundManager from './SoundManager';

export default function cacheAssetsAsync({images = [], fonts = [], sounds = []}) {
  return Promise.all([
    ...cacheImages(images),
    ...cacheFonts(fonts),
    ...loadSounds(sounds),
  ]);
}

function cacheImages(images) {
  return images.map(image => {
    if (typeof image === 'string') {
      return Image.prefetch(image);
    } else {
      return Asset.fromModule(image).downloadAsync();
    }
  });
}

function cacheFonts(fonts) {
  return fonts.map(font => Font.loadAsync(font));
}

function loadSounds(sounds) {
  return Object.keys(sounds).map(key => {
    return SoundManager.loadSoundAsync(key, sounds[key]);
  });
}
