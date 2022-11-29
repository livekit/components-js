/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_PUBLIC_LK_SERVER_URL: string;
  readonly VITE_PUBLIC_TEST_TOKEN: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
