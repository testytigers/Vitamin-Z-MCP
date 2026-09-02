# T5 · Run the MCP against a real local model

**Status:** not started · **Tier:** 5 · **Cost:** ~20 min

## Why

This is the original goal of the project and it has never been done. The client config for
a local model is committed, and the 10 tools work over stdio — 35 smoke assertions prove
the protocol. But nobody has spoken a page into existence, so the loop the whole repository
exists to serve is unproven end to end.

Everything else in this plan verifies parts. This verifies the point.

## Acceptance criteria

- [ ] The server connects from a real local model client, not only from the smoke harness
- [ ] The model can discover the tools and read the cheatsheet unprompted
- [ ] A page is generated from a spoken or typed request
- [ ] That page passes `validate_code` and the preview-page rule without hand-editing
- [ ] The result is recorded in `HUMAN-TEST.md` §9 — including what the model got wrong,
      which is the useful half

## Verify

```bash
npm run build
npm run smoke          # protocol still sound
# then connect the local client and generate a page
```

## Prove it fails

Not applicable — this is an end-to-end confirmation, not a check. The failure mode worth
recording is the interesting one: **if the model produces a page that violates the design
system, that is a finding about the cheatsheet and the tool descriptions, not a bug in the
model.** Write down what it reached for that the tokens did not offer.
