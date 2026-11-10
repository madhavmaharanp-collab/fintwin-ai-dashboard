---
name: Expo preview boot
description: A timing quirk when verifying newly restarted Expo web previews.
---

After restarting a brand-new Expo workflow, the first app-preview capture can be blank while Metro is still bundling the first web routes. A subsequent capture after the bundle completes can render without any code changes.

**Why:** The initial preview request can trigger web route bundling, and the capture may finish before that work completes.

**How to apply:** If startup logs show bundling rather than an application error, wait for the route bundles to finish and retake the screenshot before changing auth or routing code.
