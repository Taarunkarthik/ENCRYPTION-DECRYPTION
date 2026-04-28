/// <reference types="vite/client" />

import type { AppRuntimeConfig } from './config/runtimeConfig';

declare global {
  interface Window {
    __APP_CONFIG__?: AppRuntimeConfig;
  }
}

export {};