# Homéy and Raya paper surfaces

The current finish uses the supplied linen, blush and Warm Ivory SVGs. The ivory update supersedes the previous instruction to keep ivory plain. Base colours remain Warm Linen `#E0DAD0`, Petal Blush `#F5E5DE` and Warm Ivory `#EFE6D6`. All three source SVGs retain their supplied bytes and opacity.

## Source and surface audit

`public/styles.css` defines `--paper: #EFE6D6` and `--wash: #E0DAD0` on `:root`. `body.raya` changes `--wash` to `#F5E5DE`. The only other literal secondary-colour declaration is the blush background of `.raya-invitation`. No equivalent RGB/RGBA/HSL declarations or inline template backgrounds require conversion. `styles.css` remains unchanged.

| Existing surface or use | Current treatment |
| --- | --- |
| Public `body` / ivory page canvas | One Warm Ivory background, repeated at 768 × 768 CSS pixels. |
| `.site-header` | Its own opaque ivory background; positioning, z-index and navigation layout are unchanged. |
| Transparent `main`, `.intro`, `.section`, `.page-heading`, `.prose`, `.detail`, product-card copy and the Raya collection area | Show the body paper beneath them; no new image layer on these descendants. |
| `.hero-copy` | Existing 512 × 512 Homéy paper on the linen text side; adjacent photograph untouched. |
| `.editorial` | Existing single 512 × 512 Homéy layer on the rounded linen owner; no child texture. |
| `.raya-invitation`, `.raya-hero` | Existing single 768 × 768 Raya layer on blush. |
| `footer` | Existing 512 × 512 linen paper on Homéy; 768 × 768 blush paper on Raya. Columns have no additional layer. |
| `.collection .image`, `.product-image`, `.gallery-main` | Plain secondary-colour image wells, including loading states and the space around contained photographs. |
| Fields, selects, quantity inputs and secondary buttons | Solid contextual base fill; no paper inside controls. Primary accent buttons and focus styling are unchanged. |
| `.badge`, legacy `.caption`, search/bag dialogs, skip link, expanded mobile navigation | Plain ivory functional surfaces. Logos and thumbnails remain unchanged. |
| `.checkout-summary`, `.order-summary`, `.payment-reference`, `.status-chip`, `.evidence-card > img` | Plain transactional, status and evidence-image surfaces; no paper layer. |
| Admin canvas, navigation, active buttons, ledger statistics and media UI | Plain; admin does not load the surface stylesheet. |
| `color: var(--paper)` on accent controls/announcement/notice | Text colour, not a background conversion. Existing accent colours, borders and shadows are retained. |

The ivory SVG contains its own opaque ivory base and is used only on ivory surfaces. Linen/blush overlays remain isolated `::before` backgrounds over their original opaque base fills. Their parent/child relationships do not create overlapping visible paper. The header has no existing background image to displace. The public page canvas likewise has no pre-existing image or gradient.

## Shared implementation

`public/index.html` already loads `public/brand-surfaces.css` after `styles.css`. The existing build copies the stylesheet and all assets under `public/assets/textures/` to `dist/`. CSS resolves the local SVG paths relative to the stylesheet. No media uploads, R2 bindings, external services or runtime texture-loading JavaScript are involved.

- `.surface-homey-linen`: Warm Linen with the supplied transparent Homéy overlay, 512 × 512 CSS pixels.
- `.surface-raya-blush`: Petal Blush with the supplied transparent Raya overlay, 768 × 768 CSS pixels.
- `.surface-warm-ivory-paper`: Warm Ivory with the supplied ivory paper, 768 × 768 CSS pixels. The same declarations cover the public body and opaque site header.
- `.surface-plain`: explicit decoration opt-out, including the ivory owner.

All textures repeat at position `0 0`, with scroll attachment and identical CSS-pixel tile sizes on desktop/mobile. No cover/contain, stretching, fixed background, animation, parallax, container opacity, blending or increased SVG opacity is introduced.

Small muted text uses existing deeper olive `#4F5644` and gold-family `#70562B` tokens. On solid ivory these give approximately 6.17:1 and 5.55:1 contrast, replacing muted values of 4.27:1 and 4.45:1. Heading inks, accent colours, font sizes and typography are unchanged. Existing linen/blush muted-text treatments are preserved.

The supplied `prefers-contrast: more`, `forced-colors: active` and print rules suppress decorative paper while retaining base fills. Dividers remain independent of background opacity. In forced-colour mode their colour follows `CanvasText`, as supplied in the reference.

## Divider and route audit

The inspected original footer rule is `border-top: 1px solid var(--line)` on the full-width outer footer. Homéy uses `--line: #73786240`; Raya uses `--line: #B18A3D50`. The reusable `.section-divider` uses the same one-pixel geometry as `border-block-start`, with explicit `--homey` and `--raya` theme variants. There are no image dividers, shadows, heavier strokes or JavaScript colour detection.

| Route / template | Boundary treatment and intentional exceptions |
| --- | --- |
| `/` | Add one gold line to the incoming full-width blush Raya invitation. Recolour the existing footer-top line gold at the following blush-to-linen boundary; do not add another footer border. The inset split hero and rounded editorial remain unruled: ivory gutters separate these islands from adjacent large sections. The internal linen/photo split remains clean. |
| `/raya` | Add one gold line on the blush hero at the ivory-header boundary, and one on the incoming ivory collection / “A first look, soon.” area. The existing ivory-to-blush footer border stays gold. Header bottom remains zero, so there is no doubled header/hero line. |
| `/about` | Continuous ivory header/story canvas: no internal line. Existing olive ivory-to-linen footer border retained. |
| `/shop` | Continuous ivory heading/catalogue canvas: no internal line. Image wells remain plain; existing olive footer border retained. |
| `/collections/bedsheets` | Same listing treatment; no same-colour section divider. Existing olive footer border retained. |
| `/collections/towels` | Same listing treatment; no same-colour section divider. Existing olive footer border retained. |
| `/collections/:id` | Shared listing template gives future categories the same treatment without category-specific CSS. |
| `/products/:slug` | Continuous ivory breadcrumb/detail/related-products canvas. No new line around image wells or controls. Existing footer line follows the product's brand: olive for Homéy, gold for Raya. A Homéy product was rendered at both tested widths; no published Raya product exists in the repository catalogue. |
| `/contact` | Continuous ivory article canvas; existing olive footer border retained. |
| `/terms` | Continuous ivory article canvas; existing olive footer border retained. |
| `/privacy` | Continuous ivory article canvas; existing olive footer border retained. |
| `/shipping` | Continuous ivory article canvas; existing olive footer border retained. |
| `/returns` | Continuous ivory article canvas; existing olive footer border retained. |
| `/cart`, `/checkout`, `/payment` | Public ivory canvas follows the shared surface, with no new internal dividers. Functional panels remain plain; existing olive footer border retained. Checkout/payment behaviour is unchanged. |
| `/admin` | Excluded from the public styling update. |

No other touching large ivory/linen/blush bands need new lines in the current public templates. Existing internal footer-bottom and control borders remain unchanged. Each changed section boundary has one top border and no outgoing bottom border.

## Verification

- `npm run build` succeeds; the existing 46 tests pass.
- The ivory asset is valid XML, byte-identical to the supplied attachment, 35,340 bytes, and contains no scripts or external asset dependencies. Existing linen/blush SVGs are unchanged. The build retains exact source SVG bytes.
- A rendered audit covered 15 public routes at 1280 px and 390 px: no horizontal overflow, exact 768 px ivory tiles, one ivory header owner, transparent main/article/detail descendants, clean field fills and exactly the expected 1 px full-width dividers. The three new lines run from x=0 to the full available content width at both widths.
- Before/after desktop screenshots preserve the existing linen/blush texture while showing the ivory change and the new section lines. Mobile views, menu opening, and navigation Homéy → Raya → Homéy were checked; the brand palette and border colours switch correctly.
- The existing header is `position: relative`, not sticky. That behaviour is preserved; scrolling and mobile-menu layering introduce no new fixed/sticky treatment or duplicate border.
- A 200% scaled review retains 768 px CSS tiles and no route overflow. This is an enlarged visual check, not native browser zoom or a physical-device test.
- A 1600 px repeat study and rounded corners were inspected for visible joins. All decoration remains behind fully opaque content.
- Local browser asset checks return HTTP 200 for the stylesheet and all three SVGs, with `image/svg+xml` for textures. Missing-image checks preserve exact solid ivory/blush/linen fills, full content opacity and the divider. Actual contrast/print fallback declarations were exercised in the isolated fixture; native OS accessibility settings were not changed.
- Local Homéy and Raya scrolling checks each used 90 animation frames: median 16.7 ms, with no frame over 50 ms. Results are observations of this review environment, not production/mobile performance guarantees.

Visual checks use an isolated static copy of the same storefront and repository catalogue because the Worker dev preview cannot stay running in this environment. The before stylesheet, review controls, repeat sample and route-audit harness are outside the repository and are not deployed. Checkout, payment, upload, domain, Cloudflare configuration and original imagery files are unchanged.
