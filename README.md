# FunFact 🧠

A fun prank web app that shows mind-blowing fun facts with a sneaky twist.

## How it works

1. Share the link with your friend
2. They browse fun facts (looping endlessly)
3. A modal asks to "enable AR mode" (triggers camera permission)
4. When they click "Save as Photo Card" — 📸 snap!
5. Page reveals: **"I just wasted some of your precious seconds"**
6. You check the captured photos in the admin panel

## Run locally

```bash
npm install
npm start
```

Open **http://localhost:3000** in your browser.

## Admin Panel

Go to **http://localhost:3000/admin.html** and enter passcode: `2424`

- View all captured snaps
- Delete individual photos or clear all
- See daily stats

## Color Palette

| Color | Hex |
|-------|-----|
| Dark Navy | `#05161A` |
| Deep Teal | `#072E33` |
| Teal | `#0C7075` |
| Bright Teal | `#0F969C` |
| Light Blue | `#6DA5C0` |
| Muted Blue | `#294D61` |

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla HTML/CSS/JS
- **Camera:** WebRTC (getUserMedia)
- **Storage:** Server filesystem
