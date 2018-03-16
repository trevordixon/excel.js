1.0.0 / 16.03.2018
==================

  * Rewrote the library in ES6 syntax.
  * Migrated from `unzip` (no longer maintained) to `unzipper` (maintained fork).
  * Migrated from `libxmljs` (bindings for "native" XML parsing library which Webpack and other bundlers can't bundle) to `xmldom` and `xpath` (both of which are pure javascript).