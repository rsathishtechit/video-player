import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  publicDir: "public",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
      },
    },
  },
  define: {
    "process.env.PUBLIC_URL": JSON.stringify(""),
  },
});
