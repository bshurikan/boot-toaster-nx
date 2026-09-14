# Boot Toaster NX (web)

Static page. Images stay in the browser. No server.

## GitHub Pages (free)

Pages is free on a **public** repo. A private repo needs a paid GitHub plan.

Do this yourself so Cursor is not a contributor:

1. On GitHub, **New repository**. Name example: `boot-toaster-nx`. Public.
2. Do **not** add a README/license on GitHub (empty repo).
3. Copy everything inside this `web` folder into a new empty folder.
4. In that folder:

```text
git init -b main
git add .
git commit -m "Add Boot Toaster NX web app."
git remote add origin https://github.com/YOURUSER/boot-toaster-nx.git
git push -u origin main
```

5. GitHub: **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: `main` / **/** (root)
   - Save

Live URL: `https://YOURUSER.github.io/boot-toaster-nx/`

## Local preview

```text
python -m http.server 8080
```

Then open http://localhost:8080
