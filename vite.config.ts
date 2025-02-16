import { fileURLToPath, URL } from "node:url";
import { defineConfig, Plugin } from "vite";
import { resolve } from "path";
import { glob } from "glob";
import posthtml from "posthtml";
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

const htmlRewritePlugin = (): Plugin => {
  return {
    name: "html-rewrite-plugin",
    enforce: "post",
    apply: "build",
    generateBundle(_, bundle) {
      Object.keys(bundle).forEach(async (fileName) => {
        if (!fileName.endsWith(".html")) return;
        const file = bundle[fileName];
        if (!(file && "source" in file)) return;
        let html = String(file.source);
        const fileDir = path.dirname(fileName);

        html = await modifyHtml(html, "/" + fileDir + "/");
        file.source = html;
      });
    },
  };
};

async function modifyHtml(html: string, fileDir: string): Promise<string> {
  const d = posthtml().use((tree) => {
    tree.match({ tag: "a" }, (node) => {
      if (node.attrs == null) return node;
      const href = node.attrs.href;
      if (href == null || href.length == 0) return node;
      if (/^https?:\/\//.test(href)) {
        node.attrs.target = "_blank";
        return node;
      }
      if (href.startsWith("/")) {
        node.attrs.href = path.relative(fileDir, href).replace(/\\/g, "/");
        if (href.endsWith("/") && !node.attrs.href.endsWith("/"))
          node.attrs.href = node.attrs.href + "/";
        if (node.attrs.href.startsWith("/"))
          node.attrs.href = "." + node.attrs.href;
        return node;
      }
      return node;
    });
    return tree;
  });
  const r = await d.process(html);
  return r.html;
}

// Configuración de Vite
export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: index_html,
    },
  },
  plugins: [injectHtmlFragments(), htmlRewritePlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
