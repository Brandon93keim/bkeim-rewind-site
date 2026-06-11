# B Keim Rewind Marketing — Landing Site

Single-page static marketing site for B Keim Rewind Marketing (Covington, LA).
No build step, no framework. Just `index.html` + an `assets/` folder.

## Run locally
Open `index.html` in a browser. That's it. (Or use the VS Code "Live Server" extension.)

## Deploy
Hosted free on **Cloudflare Pages**, connected to this GitHub repo. Auto-deploys on push to `main`.

- Framework preset: **None**
- Build command: **(leave blank)**
- Build output directory: **`/`**

## Structure
```
.
├── index.html
├── assets/
│   ├── logo-light.png        (white/reversed logo for the dark header)
│   ├── hero.mp4              (background showreel)
│   ├── hero-poster.jpg       (still frame shown before the video loads)
│   └── clients/              (client logo files for the roster)
└── README.md
```

## To-do before launch (placeholders currently in the page)
- [ ] Drop in `assets/logo-light.png` and swap the inline SVG in the nav (swap is commented in `index.html`).
- [ ] Add the hero background video + poster, and swap the `.herobg` block (commented in `index.html`).
- [ ] Replace the 6 media placeholders (hero video, 2 spotlight images, 3 work images, testimonial video).
- [ ] Fill in real stats in the Bateman spotlight (currently `XX% / XX / #X`).
- [ ] Confirm roster names/spellings (Northshore vs. Lakeside Toyota; which Mercedes-Benz).
- [ ] Real contact info in the footer: email, phone.
- [ ] Booking link: wire the "Book a discovery call" button to your Cal.com / Calendly URL.
- [ ] Optional: client logo files in `assets/clients/` to replace the text names.

## Fonts
Archivo (display) + Space Mono (labels), loaded from Google Fonts. Swap in `index.html` `<head>` + `--font-display`.
