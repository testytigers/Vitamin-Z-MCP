# T3 · Cheap additions to the existing audits

**Status:** not started · **Tier:** 3 · **Cost:** ~2 hours total

Six small holes, each found while reviewing. They are grouped because they share a file and
a shape: add a check to `scripts/`, then prove it fails.

## The six

- [ ] **Documented values beyond colour.** Check E4 compares every documented hex against
      the resolved token — that is why the stale chart palette can no longer hide. The same
      drift is still possible for spacing, radius, font size and duration. Extend E4 to any
      documented `px` or `ms` value.
- [ ] **Documented examples must compile.** `COMPONENTS.md` carries copy-paste TSX. E2
      validates class *names*; nothing checks the snippets parse, let alone typecheck.
- [ ] **Variant coverage.** Nothing asserts every `cva` variant is documented, or that every
      documented variant actually exists.
- [ ] **The composite typography tokens.** They are a declared `@public-api` surface, exempt
      from the orphan check by design, and E4 does not cover them. Assert each resolves to
      the size, weight and leading the docs claim.
- [ ] **Rendered RTL.** 21 utilities are now logical and 13 are deliberately physical.
      `HUMAN-TEST.md` §6 covers it by eye; nothing covers it mechanically. Needs T1.1.
- [ ] **Contrast on real composites.** C0 measures tokens against tokens, so it cannot see a
      component that puts `text-subtle` on `bg-tertiary` — the out-of-contract pairing the
      token layer documents as unsupported. T1.2 is what actually closes this; note it here
      so it is not forgotten.

## Verify

```bash
npm run audit
```

## Prove it fails

- [ ] For each check added: reintroduce the drift or violation it targets, confirm it fires
      with the right severity, then revert. A check added on a clean tree and never seen
      failing has not been tested — it has been written
