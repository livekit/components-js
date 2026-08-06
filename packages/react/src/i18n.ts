export type Lang = "en" | "ru";

let currentLang: Lang = "en";

export const texts = {
  connecting: {
    en: "Connecting...",
    ru: "Подключение..."
  },
  disconnected: {
    en: "Disconnected",
    ru: "Отключено"
  },
  mute: {
    en: "Mute",
    ru: "Выключить микрофон"
  },
  camera: {
    en: "Camera",
    ru: "Камера"
  }
};

export function setLang(lang: Lang) {
  currentLang = lang;
}

export function t(key: keyof typeof texts) {
  return texts[key][currentLang];
}
