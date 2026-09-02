# T4 · Open decisions

**Status:** awaiting a decision on each · **Tier:** 4 · **Cost:** discussion, not code

`audit-full` reports each of these as informational. **None is a bug until someone decides
it is** — that is why they are here rather than in the tiers above. Each needs an owner and
an answer; "accept and document" is a valid outcome and should be recorded in `CONTEXT.md`.

- [ ] **Status borders on their own tints.** `status-success` and `status-warning` borders
      sit at roughly 1.3:1 against their pale backgrounds — the alert edge is nearly
      invisible. Either fix the values, or document the edge as decorative and exempt under
      WCAG 1.4.11.
- [ ] **Large control height vs the AAA target.** `control-height-lg` is 40px at default
      density and 36px compact. Both clear the 24px WCAG 2.5.8 minimum and both sit under
      the 44px AAA target. Accept, or raise.
- [ ] **Orphan tokens.** 4 semantic tokens and 41 primitives are defined and never
      referenced. Delete them, or mark them `@public-api` the way the composite typography
      tokens are, so the orphan list stays worth reading.
- [ ] **Accepted arbitrary values.** 5 `arbitrary-value` warnings in `audit-components` are
      reviewed and accepted. Keep accepting, or tokenise them and drop the exemption.
- [ ] **Tritanopia.** Not verifiable with a single-plane simulator: the method is invalid on
      the blue-yellow axis and the two available models disagree by roughly 2× on this
      palette. If it matters for your users the answer is a real Brettel 1997 two-plane
      implementation with published anchor constants — **not** re-stepping the palette
      against a model that disagrees with itself. See `CONTEXT.md` §3, which records that
      the palette was churned twice before this was understood.
- [ ] **The type scale.** Hand-picked rather than derived from a ratio, so it cannot be
      rescaled as a unit. Accept, or rebuild on a ratio.
