export type Lang = "en" | "ru";
export declare const texts: {
    connecting: {
        en: string;
        ru: string;
    };
    disconnected: {
        en: string;
        ru: string;
    };
    mute: {
        en: string;
        ru: string;
    };
    camera: {
        en: string;
        ru: string;
    };
};
export declare function setLang(lang: Lang): void;
export declare function t(key: keyof typeof texts): string;
//# sourceMappingURL=i18n.d.ts.map