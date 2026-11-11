/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the OneStock API. Defaults to "/api", which Vite proxies to FastAPI on :8000. */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
