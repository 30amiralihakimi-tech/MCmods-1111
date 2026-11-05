MCmods — static package

Upload every file in this folder to the public_html (or www) folder of any
web host. Nothing needs Node, PHP or a database: it is plain HTML/CSS/JS.

How it works: the browser calls the Modrinth API directly
(their API allows cross-origin requests), so no server-side proxy is needed.
CurseForge is not available in this mode because it requires a secret API key;
use the Node/Worker version (mcmods.zip) for both sources.

Files: index.html, styles.css, app.js, standalone-shim.js, favicon.svg
