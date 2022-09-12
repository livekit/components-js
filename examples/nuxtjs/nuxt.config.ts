import { defineNuxtConfig } from 'nuxt';

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  runtimeConfig: {
    // Private config that is only available on the server
    lkApiKey: '',
    lkApiSecret: '',
    // Config within public will be also exposed to the client
    public: {
      lkTokenEndpoint: '',
      lkServerUrl: '',
    },
  },
});
