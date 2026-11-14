---
description: How to show the owner a web app change when they work from their phone, not their laptop.
paths:
  - "web/app/**"
  - "design-system/**"
---

# Phone preview

Use this mode when the owner says they are on their phone (a Pixel), or when the session runs in the cloud and they cannot start the app themselves. Their words for it: "on my phone", "on my Pixel", "show me", "preview". In this mode the owner judges the screen, not the gates.

## What changes in this mode

- The owner may ask to skip the gates. Then build and show. Still run them before you call the work done, unless they say not to.
- Screenshots are allowed here. `web.md` says no screenshots for normal work. This mode is the exception.
- Still never run a dev server. The preview is a built file.

## Steps

1. Change the code in `web/app/src` as usual.
2. If the demo needs a different screen, edit `web/app/preview/main.tsx`. It draws real parts from `src/`, not copies. Keep it small: only what the demo needs.
3. Build one self-contained page into the scratchpad:
   `cd web/app && npm run preview:page -- <scratchpad>/preview.html`
4. Publish it with the Artifact tool. First publish: pass `icon`. Every later publish: the same `file_path`, so the link stays the same. The page is private to the owner.
5. Give the owner the link. Say what to tap.
6. To check it yourself, take a phone-size screenshot with Playwright (`devices["iPhone 13"]`) of the same page. Read it before you send it. Send screenshots with `SendUserFile`.
7. Commit and push the code change to your own branch, never to `main`. Never commit the built page.

## What the preview cannot show

- The keyboard. Claude's page frame does not report the phone keyboard, so parts that move with the keyboard stay put. Test that in the real app.
- Saving. Nothing reaches the brain. Taps that save may show an error toast.
- Other screens. Links and tabs go nowhere.

Say these limits once, in plain words, when you share the link.

## Real app on the phone

When the owner wants the real thing, they run this on their laptop, on the same wifi as the phone:
`cd web/app && npm run dev -- --host`
Then they open the address it prints on the phone. Do not run this yourself.
