/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_PUBLIC_LK_SANDBOX_TOKEN_SERVER_ID: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
