# Human test checklist

Everything in here is something **no script can check**. The automated suites
(`npm test`, `npm run audit`) already cover token integrity, contrast maths, scale
coherence, component contracts and doc drift — 0 errors, 0 warnings. What remains is
judgement, perception, and real input devices.

Work top to bottom: **§1 is the highest-risk 15 minutes**, and if you only ever do one
section, do that one. Each item states what *pass* looks like and what to do on fail.

Setup:

```bash
cd ~/Desktop/ds-shadcn-v1.2/vitamin-z
npm run verify:css
open ds-shadcn/verify.html      # token-level surface, all modes
cd ../coliix && npm run dev     # the real app, real data
```

---

## 1. Never-been-seen — highest risk (~15 min)

These are changes that are verified numerically but have **never been looked at by
anyone**. If something is wrong, it is most likely here.

- [ ] **Dark mode, in the real app.** Add `data-appearance="dark"` to `<html>` in
      `coliix/src/app/layout.tsx`, load `/dashboard`, `/colis`, and a detail page.
      *Pass:* nothing invisible, no white flashes, cards clearly separated from canvas.
      *Watch for:* shadows — dark shadows on dark surfaces are the classic failure. The
      tokens deepen them to `rgba(0,0,0,.5)` but nobody has confirmed cards still read
      as elevated.
      *On fail:* the shadow values are in the `[data-appearance="dark"]` block.

- [ ] **`text-subtle` on `bg-sunken`.** This is the tightest pair in the whole system —
      **4.55:1**, barely over the 4.5 line. Find real helper text or a timestamp on a
      sunken panel and read it at normal viewing distance, then again on a dimmed laptop
      screen.
      *Pass:* comfortably readable, not just technically compliant.
      *On fail:* it needs to move to `slate-600`, which collapses it into `text-secondary`
      — that's a ladder redesign, so flag it rather than patching.

- [ ] **Input borders got noticeably darker.** `border-control` moved from `slate-200`
      (1.23:1) to `slate-500` (4.76:1) to satisfy WCAG 1.4.11. That's a real visual
      change on every input, select, textarea and checkbox.
      *Pass:* inputs look intentional, not heavy or boxy.
      *On fail:* there is no compliant lighter value. Options are a thicker-but-lighter
      border, or accepting 1.4.11 non-compliance deliberately and documenting it.

- [ ] **Badge icons don't crowd the pill.** Status badges now carry an icon. Check them
      inside a dense table column at `text-xs`.
      *Pass:* icon reads as part of the badge, doesn't wrap, doesn't make columns jump.
      *On fail:* `icon={false}` per-instance, or reduce the icon to 10px.

- [ ] **Compact density actually feels compact.** Toggle `data-density="compact"` on a
      table page.
      *Pass:* visibly tighter, nothing clipped, no text touching borders.
      *Note:* control heights drop to 28/32/36px. 28px is below the 44px AAA touch
      target — fine for mouse, verify before shipping compact to tablets.

---

## 2. Keyboard only — put the mouse away (~10 min)

- [ ] **Tab through a whole form.** Order matches visual order, nothing skipped,
      nothing reachable that shouldn't be.
- [ ] **The focus ring is visible on every surface.** It's composed from
      `--focus-ring-width/offset/color/halo`. Check it on white, on `bg-sunken`, on a
      card, and on top of a `bg-action-primary` button — the halo exists so the ring
      survives on dark fills.
      *Pass:* clearly visible in all four places, never clipped by a parent's
      `overflow: hidden`.
- [ ] **Dialog and Sheet trap focus.** Open, tab repeatedly — focus must cycle inside.
      `Esc` closes. On close, focus returns to the trigger.
- [ ] **Dropdown / Select / Combobox by keyboard.** Arrows move, `Enter` selects,
      `Esc` closes, typing filters where applicable.
- [ ] **No keyboard trap anywhere.** You can always reach the browser chrome again.

---

## 3. Screen reader — macOS VoiceOver, `Cmd+F5` (~15 min)

- [ ] **A status badge announces its state.** The icon is `aria-hidden`, so the *text*
      must carry it. *Pass:* "Delivered", not "image Delivered".
- [ ] **An invalid input announces the error.** `aria-invalid` and `aria-describedby`
      were just added to `Input`. *Pass:* VoiceOver says the field is invalid and reads
      the message. *This has never been tested — it is the most likely thing in this
      document to be broken.*
- [ ] **Alerts are announced.** `role="alert"` should interrupt.
- [ ] **Dialogs announce their title on open.**
- [ ] **Icon-only buttons have names.** Every icon button in the header and table rows
      should announce something meaningful, not "button".

---

## 4. OS and browser settings (~10 min)

- [ ] **Reduced motion.** System Settings → Accessibility → Display → Reduce motion.
      *Pass:* transitions and animations stop. Every duration reads from a token, and the
      media query collapses them, so this should be total — verify it actually is.
- [ ] **Zoom to 200%** (`Cmd +` five times). *Pass:* no horizontal scroll, no overlap,
      nothing clipped. This is WCAG 1.4.4 and nothing automated checks it.
- [ ] **Increase contrast** (Accessibility → Display → Increase contrast).
      *Pass:* borders don't disappear, focus ring survives.
- [ ] **Greyscale.** Accessibility → Display → Colour filters → Greyscale.
      *Pass:* status badges still distinguishable — **by their icons**. The four status
      colours are within Δluminance 0.01, so colour contributes nothing here. This is the
      test that proves the icons are load-bearing.
- [ ] **Print preview** (`Cmd+P`). Same as greyscale, plus: does anything vanish on a
      white background?

---

## 5. Touch and small screens (~10 min)

- [ ] **On a real phone or tablet**, not just a narrow window. Tap the smallest
      interactive things — table row menus, checkboxes, close buttons.
      *Pass:* hittable first time. Default control heights are 32/36/40px; the WCAG 2.5.8
      minimum is 24px and the AAA comfortable target is 44px, so these are legal but
      tight.
- [ ] **Nothing important is hover-only.** `HoverCard` and `Tooltip` content is
      unreachable by touch. *Pass:* no action or unique information lives only there.
- [ ] **The sidebar and header behave** at narrow widths.

---

## 6. RTL — never rendered (~5 min)

42 physical spacing utilities were converted to logical ones (`ml-`→`ms-`,
`pr-`→`pe-`). Zero remain. The conversion is mechanical and has never been rendered.

**Known gap, measured:** there are still **24 `left-`/`right-` positioning utilities**
in the components — `left-2`, `left-1`, `right-4`, `right-52` and similar. These are
*absolute positioning*, not spacing, so the `ms-/me-` conversion does not touch them and
they will **not** mirror in RTL. Highest-risk spots: the search icon inside inputs, the
`⌘K` hint in the header, dropdown chevrons, and checkbox/radio indicators.

- [ ] Set `<html dir="rtl">` and load a table page and a form.
      *Pass:* padding and margins mirror correctly (the converted part).
      *Expect to fail:* anything absolutely positioned — icons will stay on the physical
      left/right instead of start/end.
      *Fix pattern:* `left-2` → `start-2`, `right-4` → `end-4` (Tailwind 3.3+ logical
      inset utilities). Convert only what the render shows is wrong; don't bulk-replace,
      because some positioning is genuinely physical (e.g. a scrollbar affordance).

---

## 7. Charts — the palette is new (~10 min)

- [ ] **Build a real 6-series chart.** *Pass:* all six lines tellable apart at a glance.
      Verified at ΔE 21.4 under simulated deuteranopia and protanopia, but never seen.
- [ ] **If any chart uses 7 or 8 series**, it must add a non-colour cue — dash pattern
      or marker shape. `cat-7` and `cat-8` fall below the colourblind threshold and no
      eight-hue palette can fix that. *Pass:* dashes or markers present.
- [ ] **Sequential ramp in dark mode.** It inverts, so "more" stays "more visible".
      *Pass:* the high end reads as high, not as background.
- [ ] **Greyscale a chart.** Series should still separate by lightness.

---

## 8. Judgement calls — only you can decide (~10 min)

Nothing here is a bug. These are open decisions the audit deliberately left alone.

- [ ] **Is the type scale right?** It's hand-picked (12/14/16/18/20/24/30/36/48), not a
      ratio, so it can't be rescaled proportionally. Does the heading hierarchy feel
      correct, or should it become `round(base × ratio^n)`?
- [ ] **Is the accent right?** Reference DS is slate/blue; `coliix` is green `#004030`.
      Two systems, two accents — deliberate or drift?
- [ ] **Alert borders are faint** (1.1–1.3:1 against their own tint). Decorative by
      choice. Do alerts read as contained, or as floating text?
- [ ] **`header`'s `text-[10px]`** sits below the type scale's 12px floor. Add a step or
      change it to `text-xs`?

---

## 9. The original goal — untested end to end (~20 min)

The MCP has never run against a real local model.

- [ ] Merge `clients/lmstudio-mcp.json` into `~/.lmstudio/mcp.json`, restart LM Studio.
- [ ] Confirm all 10 tools appear.
- [ ] Say a page into being: *"build me a shipments page with stats and a table"*.
      *Pass:* the model calls `build_page` with `save: true` and a file appears at
      `src/app/(dashboard)/shipments/page.tsx`.
- [ ] Iterate: *"add a revenue chart to the shipments page"*.
      *Pass:* `edit_page` runs, the chart section is spliced in, the recharts import is
      merged, the file still compiles.
- [ ] Check the generated page renders in the app and uses only DS tokens.
      *On fail:* the model is probably picking the wrong tool — the system-prompt snippet
      in `README.md` exists for exactly that.

---

## Recording results

Anything that fails and is a genuine defect belongs in `audit-full.mjs` as a check if it
can be automated, or in `DS-AUDIT.md` §7.5 as an accepted trade-off if it can't. The
point of this list is to shrink over time as findings become machine-checked.

Last automated state at time of writing: **0 errors, 0 warnings, 9 informational** across
four suites; 35 test assertions passing; contrast confirmed independently by Chrome.
