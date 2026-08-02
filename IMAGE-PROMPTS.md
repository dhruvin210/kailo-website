# Kailo — AI Image Generation Prompts

Copy-paste prompts for generating on-brand photos (Midjourney, DALL·E 3, Firefly, Flux, etc.)
for the **Products**, **Gallery**, and **Contact** pages.

Every prompt shares one **style spine** so the whole site looks like a single photoshoot.

---

## 🎨 Brand style spine (paste into EVERY prompt)

> premium editorial product photography, warm minimalist aesthetic, soft natural
> window light, muted off-white cool-grey background (#F2F4F8), subtle teal accent
> (#1AACB0), warm wood and leather tones, shallow depth of field, gentle shadows,
> clean composition, boutique artisan feel, hand-crafted in a Nashville workshop,
> high detail, 50mm lens, no text, no logos

**Midjourney tail:** `--ar 4:3 --style raw --v 6.1`
**DALL·E / Flux:** add `photorealistic, studio quality` and set aspect 4:3 (products) or 3:2 (banners).

---

## 🛍️ Products (12)

### Cases
1. **Ukulele Hardshell Case** — `A plush-lined ABS hardshell ukulele case, lid slightly open revealing deep velvet interior, soprano ukulele resting beside it, reinforced corners, [style spine]`
2. **Acoustic Guitar Tweed Case** — `A vintage tweed acoustic guitar case with poplar frame and leather handle, standing upright against a soft studio wall, aged character, [style spine]`
3. **Violin Carbon Shell Case** — `A sleek lightweight carbon-fibre violin case, open to show four-bow holder and hygrometer, 4/4 violin nestled inside, travel-ready, [style spine]`

### Straps
4. **Hand-Stitched Leather Guitar Strap** — `A full-grain vegetable-tanned leather guitar strap, visible hand-stitching, coiled elegantly on a wooden workbench, artisan craft, [style spine]`
5. **Neoprene Bass Strap** — `A wide padded neoprene bass strap with nylon edging, draped over a bass guitar body, ergonomic cushion detail, [style spine]`
6. **Woven Ukulele Strap** — `A soft cotton woven ukulele strap with leather end tabs, laid flat showing textile pattern, adjustable, [style spine]`

### Tuners
7. **Clip-on Chromatic Tuner** — `A compact clip-on chromatic tuner with full-colour display clipped to a guitar headstock, 360-degree hinge, macro detail, [style spine]`
8. **Pedal Polyphonic Tuner** — `A rugged polyphonic tuner pedal with ultra-bright LED grid, true-bypass footswitch, on a pedalboard, top-down angle, [style spine]`

### Picks
9. **Premium Pick Set (12)** — `Twelve guitar picks in four gauges arranged in an open magnetic tin, tortoise-style and Delrin finishes, tidy flat lay, [style spine]`
10. **Brass Trigger Capo** — `A solid brass trigger capo with silicone pad clamped on an acoustic guitar neck, warm metallic sheen, macro, [style spine]`

### Cleaning Kits
11. **String Cleaner Kit** — `A string-care kit flat lay: microfibre cloth, string conditioner bottle, fretboard oil, neatly arranged on wood, [style spine]`
12. **Polish & Care Kit** — `A guitar polish and care kit: polish bottle and two folded cloths beside a glossy guitar body reflecting light, [style spine]`

---

## 🖼️ Gallery (grid fillers, lifestyle / atmospheric)

- `Musician's hands restringing an acoustic guitar in a sunlit Nashville workshop, [style spine] --ar 1:1`
- `Close-up of leather straps and tools hanging on a workshop pegboard, warm and tactile, [style spine] --ar 1:1`
- `A ukulele and open hardshell case on a linen surface by a window, calm morning light, [style spine] --ar 1:1`
- `Overhead flat lay of assorted picks, capo and tuner on soft grey paper, teal accent prop, [style spine] --ar 1:1`
- `A violinist packing a carbon case backstage, moody soft light, editorial, [style spine] --ar 1:1`
- `Detail of hand-stitching on leather, needle and waxed thread, artisan close-up, [style spine] --ar 1:1`

---

## 📬 Contact (header / hero banner)

- **Header banner:** `Wide atmospheric shot of a bright Nashville accessory workshop, workbench with tools and instruments softly out of focus, welcoming and calm, teal accent details, [style spine] --ar 21:9`
- **Support/human touch:** `A friendly craftsperson at a workbench looking up warmly, natural window light, boutique studio, [style spine] --ar 3:2`

---

### Tips
- Keep the **style spine identical** across all prompts — that's what makes them look like one brand.
- Add `--seed 1234` in Midjourney to keep lighting/background consistent between products.
- Export products at **1200px wide, 4:3** to match the current `w=1200` Unsplash sizing in `src/lib/products.ts`.
- Save results into `frontend/src/assets/` and swap the `img(...)` URLs for local imports.
