# Homéy and Raya paper surfaces

This update adds the supplied transparent SVG overlays to existing secondary-colour editorial surfaces. The underlying Warm Linen `#E0DAD0`, Petal Blush `#F5E5DE`, and plain Warm Ivory `#EFE6D6` remain in place. The SVG files are copied byte-for-byte from the supplied attachments.

## Source audit

`public/styles.css` defines `--wash: #E0DAD0` on `:root` and changes it to `#F5E5DE` on `body.raya`. The only other literal use of either secondary colour is the blush background on `.raya-invitation`. There are no RGB, RGBA, HSL or other equivalent colour-function declarations in the existing stylesheet, and no corresponding inline background values in the storefront templates. All original `styles.css` rules remain unchanged.

| Existing background use | Treatment |
| --- | --- |
| `.hero-copy` | Homéy paper over the linen text panel. The adjacent photograph is untouched. |
| `.editorial` | One Homéy layer on the rounded outer panel; its children receive no extra texture. |
| `.raya-invitation` | One Raya layer over its existing blush fill. |
| `.raya-hero` | Raya paper over the broad blush introduction. |
| `footer` | Homéy paper on Homéy pages; Raya paper on Raya pages. Footer columns stay untextured individually. |
| `.collection .image`, `.product-image` | Plain secondary-colour image wells so catalogue images and their loading states stay clean. |
| `.gallery-main` (both declarations) | Plain image backing, including the space around contained product photographs. |
| `.admin-nav`, `.ledger-stats > div` | Plain management/navigation and numeric-information panels. Admin does not load the surface stylesheet. |
| `.status-chip` | Plain functional status badges. Paid/rejected colour states are untouched. |
| `.checkout-summary`, `.order-summary`, `.payment-reference` | Plain transactional summaries/reference panels. |
| `.evidence-card > img` | Plain backing for payment-evidence images. |
| `.demo-banner` (legacy, unused) | Existing solid fill retained; no banner is added. |

Secondary-colour uses were backgrounds, not text/border/shadow colours. Existing accent, border, shadow, button, input, badge and focus rules are preserved. Warm Ivory backgrounds, the navigation, photographs, logos and product images do not acquire their own texture layer.

## Implementation

`public/index.html` loads `public/brand-surfaces.css` after the existing stylesheet. The two local assets are `public/assets/textures/homey-paper.svg` and `public/assets/textures/raya-blush-paper.svg`; their URLs resolve relative to the new CSS file. The existing static build copies all three files. There are no product-media URLs, R2 dependencies, external texture requests or texture-loading scripts.

The reusable `.surface-homey-linen` and `.surface-raya-blush` utilities follow the supplied CSS reference. The integration uses a single, non-interactive `::before` background behind each selected panel's content. This preserves any original background images/gradients instead of replacing `background-image`, and the layer inherits the panel's corner radius. No parent/child pair in the storefront receives overlapping texture. `.surface-plain` removes only the paper layer.

Homéy repeats at **512 × 512 CSS pixels**, Raya at **768 × 768 CSS pixels**, at every viewport width. Both use `repeat`, position `0 0`, and scroll attachment. No cover/contain scaling, fixed attachment, animation, parallax, container opacity, blending or increased SVG opacity is introduced.

Small muted copy on textured panels uses the deeper shades from the supplied reference: olive `#4F5644` and gold-family `#70562B`. Solid-base contrast is 5.50:1 and 5.61:1 respectively. The previous Homéy muted text was 3.81:1 on linen. Main heading inks, accent colours and typography are unchanged.

The supplied `prefers-contrast: more`, `forced-colors: active`, and print conditions suppress the decorative paper while retaining solid colour. No forced-colour overrides are used.

## Verification

- The supplied SVG copies are identical to their source bytes, retain their original dimensions/opacity, and contain no scripts or external references.
- Browser asset checks returned HTTP 200 for the stylesheet and both SVG paths, with `image/svg+xml` for the textures. The static build contains the exact source SVG bytes.
- Desktop views at 1280/1363 px and a 390 px mobile viewport were reviewed on Homéy and Raya. Panel geometry and typography match the original styling when the surface stylesheet is disabled.
- A 200% scaled viewport retained the exact 512/768 CSS-pixel tile sizes and the original layout measurements. This is a visual scaling check, not a separate physical-device/browser benchmark.
- Large repeat samples and rounded panels were inspected. An existing gradient remained present underneath the independent texture layer. The editorial has one 16 px-clipped layer and no child overlay.
- Missing-asset checks retained solid linen/blush fills and fully opaque content. The actual contrast/print fallback declarations were exercised in the isolated browser review fixture; native OS forced-colour settings were not changed.
- A local scrolling pass recorded a median frame interval of 16.7 ms with no frame over 50 ms. This is a local observation, not a production performance guarantee.

The Worker dev preview stopped during startup in this environment. Visual checks therefore used an isolated static copy of the same storefront files with the repository catalogue. The review controls/fixtures are outside the application repository and are not deployed. Checkout, payment, upload, domain and Cloudflare configuration files are untouched by this update.
