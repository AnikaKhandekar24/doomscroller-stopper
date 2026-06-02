# Doomscroller Stopper

Doomscroller Stopper is a static web prototype for a productivity and digital wellness app. It helps users notice unconscious scrolling habits by simulating distracting app opens during a focus session, then interrupting the behavior with a full-screen warning, safe annoying sound, countdown, and reflection prompt.

## Why it is useful

Doomscrolling often happens before a person makes a conscious decision. This prototype makes that moment visible. It creates a small pause between impulse and action so a user can decide whether they actually want to keep scrolling or return to the task they meant to do.

## Features

- Home screen with app explanation and quick navigation
- Focus session durations of 15, 25, 45, and 60 minutes
- Distracting app simulator for Instagram, TikTok, YouTube Shorts, Snapchat, Reddit, and X / Twitter
- Full-screen intervention overlay with:
  - Big warning message
  - Web Audio API beep/glitch alarm
  - Shake and flashing border effects
  - Configurable countdown
  - Reflection prompt requiring at least 10 characters
- Buttons for Take me back, Open anyway, and Start 25-minute focus timer
- Daily stats saved in localStorage
- Settings for intensity, volume, countdown length, theme, and funny messages
- Light, dark, and pastel themes
- Mobile responsive layout
- Custom logo and SVG favicon

## Tech stack

- HTML
- CSS
- JavaScript
- Web Audio API
- localStorage
- No backend and no external dependencies

## How to run it

Open `index.html` in a browser, or serve the folder with any static web server.

Example:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

The app is ready to deploy to GitHub Pages, Netlify, Vercel static hosting, or any basic static file host.

## How the prototype simulates doomscrolling detection

This web prototype does not detect real app launches. Instead, it provides app buttons that represent distracting apps. When a focus session is active and the user clicks one of those buttons, the app treats it as an attempted distracting app open and triggers the intervention flow.

This prototype does not track real apps. It simulates app-opening behavior for demonstration. A real Android version would require usage access or accessibility permissions.

## Future Android improvements

- Request Android Usage Access permission to detect app launches
- Optionally use Accessibility Service APIs for stronger intervention flows
- Let users choose their blocked apps
- Add schedule-based focus rules
- Add notification reminders
- Sync long-term stats across devices
- Add calmer intervention modes for users sensitive to sound or motion
- Include accessibility settings such as reduced motion and silent mode
