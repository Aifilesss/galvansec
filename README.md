# GalvanSec — Matrix portfolio

Static HTML, CSS and JavaScript portfolio for Mario A. Galvan, published by GitHub Pages at https://galvansec.tech. No build step or npm installation is needed.

The homepage includes a 3D data core, responsive navigation, Matrix icon interactions and a Matrix code-rain splash. Biography, education, focus areas, ISSA membership, headshot and contact destinations are preserved.

## Splash settings

In index.html, READY_HOLD adds 1500ms after critical content is ready. MAX_WAIT caps the wait at 4500ms, followed by preloader-js’s 500ms fade (five seconds maximum). Skip and reduced motion bypass the extra hold. Critical cover CSS and the library fallback are inline to prevent a CDN outage from trapping visitors.

In assets/js/matrix-preloader.js, adjust colors, glyphs, speed and mobile/desktop counts. Three.js 0.185.1 is loaded by native CDN import; preloader-js 1.0.1 controls showing and fading the overlay. WebGL resources are disposed when hiding starts. The hero retains its existing local Three.js version.

## Publishing

GitHub Pages serves the repository root. Keep CNAME set to galvansec.tech. This repository contains only static delivery files; ChatGPT Sites configuration and development dependencies are excluded.
