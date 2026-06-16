# CORELASI Brand Assets

## Master Mark

- Primary: `corelasi-01.svg`
- Dark: `corelasi-dark-01.svg`
- White: `corelasi-white-01.svg`
- Canvas: `512 x 512` viewBox
- Preferred format for the application UI: SVG

## Colors

- Primary green: `#0F5132`
- Dark green: `#0A3D25`
- White: `#FFFFFF`
- PWA background: `#F7F8F6`

## UI Sizes

- Sidebar mark: `28 x 28 px`
- Desktop login mark: `28 x 28 px` inside a `40 x 40 px` container
- Mobile login mark: `22 x 22 px` inside a `32 x 32 px` container
- Keep the SVG aspect ratio and do not stretch or recolor the mark.

## Platform Icons

- Browser fallback: `favicon.ico`
- Browser SVG: the lightweight `corelasi-01.svg` is deployed as `favicon.svg`
- PNG favicon: `favicon-96x96.png`
- Apple touch icon: `apple-touch-icon.png`
- PWA icons: `web-app-manifest-192x192.png` and `web-app-manifest-512x512.png`

The larger generated source `favicon.svg` is retained here as an original export,
but the application deploys the equivalent 494-byte master SVG to avoid an
unnecessary 237 KB favicon transfer.
