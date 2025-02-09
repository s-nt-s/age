import { fileURLToPath, URL } from 'node:url'
import { defineConfig, Plugin } from "vite";
import { resolve } from "path";
import { glob } from "glob";
import * as fs from "fs";
import * as path from "path";

const index_html = glob
  .sync(resolve(__dirname, "**", "index.html"))
  .filter((p) => !p.includes("/public/") && !p.includes(`/dist/`));

const readPartial = (file: string) => {
  return fs.readFileSync(path.resolve(__dirname, "partials", file), "utf-8");
};

const injectHtmlFragments = (): Plugin => {
  return {
    name: "inject-html-fragments",
    enforce: "pre",
    transformIndexHtml: {
      order: "pre",
      handler: (html, ctx) => {
        return html
          .replace("<head>", `<head>\n${readPartial("head.html")}`)
          .replace("<body>", `<body>\n${readPartial("header.html")}`)
          .replace("</body>", `${readPartial("footer.html")}\n</body>`);
      },
    },
  };
};

// Configuración de Vite
export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: index_html,
    },
  },
  plugins: [injectHtmlFragments()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
