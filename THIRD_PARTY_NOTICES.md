# Third-party components and asset provenance

The root Apache-2.0 license applies to the project's own contributions; it does not override third-party terms.

- npm packages and their declared license identifiers are listed in `package-lock.json`. Install them with `npm ci` and consult each package's license and notices. `node-forge` is dual licensed; consult its package license for the applicable terms.
- `uni_modules/cc-defineNewQRCode` contains code referring to [uQRCode](https://github.com/Sansnn/uQRCode) and an embedded QR implementation attributed to Kazuhiko Arase under MIT in `common/uqrcode.js`. The current uQRCode upstream declares Apache-2.0, but this bundled adaptation has no complete, version-specific license or provenance for the wrapper. Its redistribution rights and required notices **remain to be verified**; do not assume the upstream's current license resolves the wrapper's terms.
- `static/pdfjs/viewer.html` loads PDF.js 3.11.174 from a third-party CDN. PDF.js is distributed under Apache-2.0; see the [upstream project](https://github.com/mozilla/pdf.js). CDN availability and third-party network access are separate operational considerations.
- The provenance and redistribution permissions of other bundled assets, including icons, `static/audio/notification.mp3`, `CustomStoryboard.zip`, and `unpackage/res/` app icons, have not been established. Verify ownership and all applicable licenses before public redistribution. Trademarks and logos may require separate permission.
- The previously bundled font and photographic avatars were removed from the tracked project pending provenance review; the application now uses platform fonts and a simple project-provided avatar.

This inventory is an aid to review, not proof that all third-party rights have been cleared. Preserve upstream notices and obtain missing permissions or replace affected files.
