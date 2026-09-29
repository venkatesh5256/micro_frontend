# Micro Frontend Demo

A small Webpack 5 Module Federation example with two independent React + TypeScript applications:

- `host` runs at http://localhost:3000 and loads a component at runtime.
- `product-remote` runs at http://localhost:3001, exposes `./ProductList`, and serves `remoteEntry.js`.

## 1. Project Structure

```text
microfrontend-demo/
|-- README.md
|-- package.json
|-- host/
|   |-- public/index.html
|   |-- src/App.tsx
|   |-- src/bootstrap.tsx
|   |-- src/index.css
|   |-- src/main.tsx
|   |-- src/types.d.ts
|   |-- package.json
|   |-- tsconfig.json
|   `-- webpack.config.js
`-- product-remote/
    |-- public/index.html
    |-- src/App.tsx
    |-- src/components/ProductList.css
    |-- src/components/ProductList.tsx
    |-- src/main.tsx
    |-- src/styles.d.ts
    |-- package.json
    |-- tsconfig.json
    `-- webpack.config.js
```

`bootstrap.tsx` is an extra host entry module. It lets Webpack initialize shared modules asynchronously before React is rendered, which avoids the common eager-consumption warning with Module Federation. The two apps have their own dependencies, lockfiles, build output, and start commands.

## 2. Files and Important Parts

Create every file at the path shown in the tree. The complete implementation is in those files:

- Root `package.json`: convenience scripts start either application or build both in order. It does not own application dependencies.
- `host/package.json` and `product-remote/package.json`: each app declares React, ReactDOM, Webpack, TypeScript, loaders, and its own scripts. Run `npm install` separately in each app to create its lockfile.
- Each `tsconfig.json`: enables strict TypeScript checking and the modern React JSX transform. Webpack uses `ts-loader` to compile `.tsx` files.
- Each `public/index.html`: the HTML shell into which `html-webpack-plugin` injects that app's bundle.
- `host/src/main.tsx`: starts the asynchronous host bootstrap.
- `host/src/bootstrap.tsx`: renders the host only after the federation runtime has initialized.
- `host/src/App.tsx`: uses `React.lazy()` to request `productRemote/ProductList`, wraps it with `Suspense`, and contains an error boundary for a rejected remote load/render.
- `host/src/types.d.ts`: declares the remote module to TypeScript and declares CSS imports. TypeScript checks locally; it cannot inspect an app hosted on another server at compile time, so this declaration supplies the imported module's shape.
- `host/src/index.css`: small host layout and error fallback styles.
- `host/webpack.config.js`: defines the host container, remote URL, shared singleton packages, output, HTML plugin, and port `3000`.
- `product-remote/src/main.tsx` and `App.tsx`: make the remote independently runnable as a small preview app.
- `product-remote/src/components/ProductList.tsx` and `ProductList.css`: the default-exported component exposed to the host, with three sample products.
- `product-remote/src/styles.d.ts`: tells TypeScript that CSS imports are handled by Webpack loaders.
- `product-remote/webpack.config.js`: defines the `productRemote` container, exposes `./ProductList`, emits `remoteEntry.js`, shares React, and serves port `3001`.

### What the Webpack federation settings mean

- `name` identifies the federation container. The remote's name must match the `productRemote` portion of the host's remote declaration.
- `filename: "remoteEntry.js"` creates the remote's public container/manifest script. Its URL is `http://localhost:3001/remoteEntry.js`.
- `exposes` maps the public import name `./ProductList` to the remote's local source file. It does not expose every file in the remote.
- `remotes` tells the host that the import prefix `productRemote` is provided by the container script at the given URL.
- `shared` negotiates dependencies through a federation share scope instead of needlessly bundling independent copies. React, ReactDOM, and the `react-dom/client` entry are singletons; their declared versions are compatible because both apps depend on React 18.3.1.
- `output.publicPath: "auto"` lets Webpack infer the remote's base URL from its loaded script, so additional remote chunks can be fetched from port `3001`.
- `devServer.port` sets the independent development server. CORS response headers are included on the remote for cross-origin development requests.
- `HtmlWebpackPlugin` creates a usable HTML page for each app. The remote can therefore be opened directly as well as consumed by the host.

## 3. Install and Run

Prerequisites: Node.js 18 or newer and npm.

Open a terminal in `microfrontend-demo/`, then install each application's dependencies:

```sh
cd product-remote
npm install
cd ../host
npm install
cd ..
```

Start the remote first in terminal 1:

```sh
cd product-remote
npm run start
```

Confirm the remote page at http://localhost:3001 and its federation entry at http://localhost:3001/remoteEntry.js.

Start the host in terminal 2:

```sh
cd host
npm run start
```

Open http://localhost:3000. The host displays the remote product list. Starting the host convenience script from the project root also works after installing both apps: `npm run start:host`; use `npm run start:remote` to start the remote from the root.

Build independently from each app directory:

```sh
cd product-remote
npm run build
cd ../host
npm run build
```

Or, from the project root after both installs, build both with:

```sh
npm run build
```

The remote build writes `product-remote/dist/remoteEntry.js`. The host build does not download or bundle the remote at build time; the remote must be available at the configured URL when a user opens the host.

## 4. Runtime Flow

1. A user opens http://localhost:3000. The host's HTML and host JavaScript load.
2. `main.tsx` imports `bootstrap.tsx` asynchronously, and React renders the host.
3. The host renders `ProductList` inside `Suspense`. The lazy import is `productRemote/ProductList`.
4. Webpack recognizes `productRemote` from the host's `remotes` configuration.
5. The browser requests `http://localhost:3001/remoteEntry.js` when the lazy module is first needed.
6. That script registers the `productRemote` container in the federation runtime.
7. Webpack asks the container for its exposed module, `./ProductList`.
8. The remote's component code and any needed remote chunks are downloaded from the remote's server.
9. The promise returned by `React.lazy()` resolves to the component; React renders it inside the host tree.
10. The host and remote negotiate their shared React packages. Singleton sharing selects one compatible React instance for the page, avoiding invalid hook-call problems caused by multiple React copies.

### Build time versus runtime

At build time, each app compiles its own code and federation configuration. The host knows a remote's name and URL, but does not need the remote's component source or a network connection to the remote server. At runtime, the browser loads `remoteEntry.js`, asks its container for the exposed module, and fetches the needed remote chunks. This separation allows the remote to be deployed independently, as long as its URL and exposed module contract remain available to the host.

## 5. Concepts in Plain English

- **Micro frontend:** a way to divide a frontend into independently developed and deployed pieces that are assembled into one user experience.
- **Module Federation:** Webpack 5's runtime mechanism for one separately built application to load code exposed by another.
- **Host:** the application that owns the page and consumes a remote. Here it is `host`.
- **Remote:** an independently built application that publishes modules for hosts to consume. Here it is `product-remote`.
- **`remoteEntry.js`:** the remote's small runtime container entry. It describes how to retrieve its exposed modules and chunks; it is not the entire remote application bundle.
- **`exposes`:** the remote's allow-listed public module names and their local source paths.
- **`remotes`:** the host's mapping from a remote import prefix to the remote container name and entry URL.
- **`shared`:** dependencies that participating builds can reuse through a runtime share scope rather than each shipping an unrelated copy.
- **Singleton React:** React expects components and hooks to use the same React instance as the renderer. `singleton: true` requests a single shared version and helps prevent invalid hook calls. Both applications should still use compatible versions.
- **`React.lazy()`:** defers requesting a component until React needs to render it. The loader must return a promise resolving to a module with a default component export.
- **`Suspense`:** shows a fallback while a lazy component's promise is pending.
- **TypeScript `declare module`:** adds a compile-time description for the remote import. It does not load code or verify that the remote URL really exposes that module; the runtime contract must match the declaration.
- **Independent deployment:** build and publish each app separately. A host can keep the same build while a remote is updated at its configured URL. Keep module names, component props, React compatibility, and remote URLs compatible; use versioned URLs or coordinated rollout when breaking contracts.
- **Remote unavailable:** the lazy load rejects. The host's error boundary shows a friendly unavailable message. It does not silently provide remote functionality, and the remote must be restarted or restored for that feature to work again.

## 6. Troubleshooting

1. **`remoteEntry.js` returns 404**
   - Cause: the remote is stopped, listening on another port, or the filename/output path differs.
   - Check: open http://localhost:3001/remoteEntry.js directly and check the remote terminal/build output.
   - Fix: start `product-remote` on port `3001`; confirm `filename: "remoteEntry.js"` in its federation plugin.
2. **CORS error**
   - Cause: the remote server does not allow the host origin, often due to custom proxy/server configuration.
   - Check: inspect the browser Network panel and the remote response headers.
   - Fix: allow `http://localhost:3000` (or the development origin) in the remote's CORS configuration; this example adds `Access-Control-Allow-Origin: *` for local development.
3. **`Module not found`**
   - Cause: a local file path, expose key, remote name, or import string does not match.
   - Check: compare `exposes`, `remotes`, and `import("productRemote/ProductList")` character-for-character.
   - Fix: use `./ProductList` in `exposes`, `productRemote` as the container name/prefix, and `ProductList` as the module key.
4. **`Shared module is not available`**
   - Cause: a shared dependency was consumed synchronously before federation initialized its share scope.
   - Check: look for the eager-consumption warning/error and inspect whether the host entry imports React directly.
   - Fix: retain the asynchronous `main.tsx` to `bootstrap.tsx` boundary; do not mark shared dependencies `eager` as a first workaround.
5. **React version mismatch**
   - Cause: host and remote require incompatible React versions or lockfiles installed different versions.
   - Check: run `npm ls react react-dom` in both app directories and compare package versions.
   - Fix: align `react`, `react-dom`, and their type packages; reinstall dependencies and rebuild both applications.
6. **React error #130**
   - Cause: React was asked to render an undefined or non-component value, often from an incorrect export/import contract.
   - Check: confirm `ProductList.tsx` has a default export and inspect the remote module response/console error.
   - Fix: preserve the default export expected by `React.lazy()` and match it with `export default ProductList` in the declaration.
7. **Remote loads but component does not render**
   - Cause: the remote exposes a different module, export shape, or runtime version than the host expects.
   - Check: inspect browser console/network requests and verify the remote component renders by itself at port `3001`.
   - Fix: align the expose key, default export, and host import; rebuild and restart both apps.
8. **TypeScript cannot find module**
   - Cause: the ambient declaration is missing, misplaced, or excluded by `tsconfig.json`.
   - Check: verify `host/src/types.d.ts` declares `productRemote/ProductList` and `include` covers `src`.
   - Fix: add/correct the declaration and restart the TypeScript server or rerun the host build.
9. **Chunk loading error**
   - Cause: a remote chunk URL is wrong, the remote changed during a session, or an old cached entry points at removed chunks.
   - Check: inspect the failed chunk URL in Network; it should normally point to port `3001`.
   - Fix: keep `publicPath: "auto"`, make sure the remote is running, and deploy `remoteEntry.js` and its chunks together.
10. **Cached old `remoteEntry.js`**
    - Cause: browser, proxy, or CDN caching served a stale entry after deployment.
    - Check: inspect the Network response and its cache headers; compare with a hard refresh or private window.
    - Fix: configure short/no-cache headers for the entry or use versioned remote URLs and deploy entry/chunks atomically.

For production, replace the local development URL with a deployed remote URL, configure deliberate cache/CORS policies, and treat the exposed component's props and exports as a versioned integration contract.
