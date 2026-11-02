# School Van Tracker (PWA)

One mobile web app for **parents, drivers and the school admin**. People open the link and tap **Add to Home Screen** to install it. It works on Android (Chrome) and iPhone (Safari, iOS 16.4+), and there's no Play Store or App Store.

## Features
| Who | What they can do |
|---|---|
| **Parent** | Register with mobile number, add child + home pickup pin (GPS or drag pin), mark absent (Morning / Evening, any date), **Track Van Live** (van icon moves on the map), get 3 notifications a day |
| **Driver** | Sees own route's students as name pins on the map (absent students greyed out), list sorted by nearest stop, Picked / Dropped buttons, 📞 call parent, 🧭 open Google Maps navigation, Start Morning Pickup / Reached School / Start Evening Return / End Trip |
| **Admin** | Approve registrations, set role (parent / driver / admin), create routes (e.g. Mangadu) with school location, assign driver to a route, approve parents' home location changes, move / remove students |

**Notifications** (production — in the demo, the app shows these itself while open)
- Parents get **Van started pickup**, **Reached school** (sent automatically when the van enters the school radius), and **Van left school** (evening). Parents whose child is marked absent for that trip are skipped.
- The driver gets **"<child> absent — skip this stop"** when a parent marks absent.

Live location is **not** a notification. The driver phone sends its location every 10 seconds, but it only moves the van on the map while a parent has the tracking screen open.

## Files
```
public/index.html               the whole app (all 3 roles)
public/firebase-config.js       ← paste your Firebase config + VAPID key
public/firebase-messaging-sw.js push notifications + offline/installable
public/manifest.json, icons/    PWA install
firestore.rules                 who can read/write what
functions/index.js              background push notifications (production, needs Blaze)
firebase.json                   hosting + deploy config
```

## Setup — DEMO (free Spark plan, no billing)

1. **Create the project:** Firebase console → project `school-van-cdd91`. Spark (free) plan is fine.
2. **Authentication** → Get started → enable **Email/Password**.
   Then Settings → **Authorized domains** → add `maheshkumar040795-afk.github.io`.
3. **Firestore Database** → Create → location **asia-south1 (Mumbai)** → Production mode.
4. **Rules:** Firestore → **Rules** tab → paste the full contents of `firestore.rules` → **Publish**.
5. **Web app config:** Project settings ⚙️ → Your apps → **</>** Web → register → copy the values into `public/firebase-config.js`.
   (Optional) Cloud Messaging → Web Push certificates → Generate key pair → paste as `VAPID_KEY`.
6. **Publish:** push to GitHub → repo **Settings → Pages → Source: GitHub Actions** → Actions tab → re-run the deploy.
   App URL: **https://maheshkumar040795-afk.github.io/School_Van_App/**
7. **Make yourself admin:** open the app → Register → Firestore → `users` → your doc → set `role` = `admin`, `approved` = `true` (boolean) → reload.
8. **Admin screen:** Routes → add "Mangadu" + school pin → approve drivers (role Driver + route) → approve parents.

**What works in the demo:** everything — login, students & home pins, absent marking, live moving van, driver map/list, auto "Reached school".
**Alerts in demo:** shown as phone notifications **while the app is open** (or recently opened). Real background push (app closed) needs the production step below.

## Production (after the school confirms)

1. Upgrade the project to **Blaze** (complete Google billing verification) and set a ₹100 budget alert.
2. Make sure `VAPID_KEY` is set in `public/firebase-config.js`, and change `self.LOCAL_ALERTS = false`.
3. Deploy the notification functions from your laptop:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add            # choose school-van-cdd91
   cd functions && npm install && cd ..
   firebase deploy --only firestore,functions
   ```
   Parents then get the 3 trip alerts and the driver gets absent alerts even when the app is closed.
   If the app moves off GitHub Pages, update `APP_URL` in `functions/index.js`.

## Installing on phones (send this to parents)
- **Android (Chrome):** open the link → tap **Install app**, or ⋮ → Add to Home screen → open from the icon → **Turn on notifications**.
- **iPhone (Safari):** open the link → **Share ⬆ → Add to Home Screen** → open from the icon → **Turn on notifications**. On iPhone, notifications only work when the app is opened from the home screen icon.

## Driver instructions (important)
- Use an **Android phone in a dashboard holder, plugged into the charger**.
- After tapping Start, **keep the app open on screen** during the trip. Web apps can't share GPS when the screen is off or the app is closed. The app keeps the screen awake automatically.
- If the app is reopened mid-trip, sharing resumes on its own.
- "Reached School" is marked automatically inside the school radius, or the driver can tap it.

## Costs
| Item | Cost |
|---|---|
| GitHub Pages hosting + Firestore (demo, Spark plan) | ₹0 |
| Production with Blaze for 300–400 parents | Within free quotas, ₹0 expected |
| Maps | OpenStreetMap tiles via Leaflet, free |
| Play Store / App Store | Not needed |
| Domain (optional) | ~₹800/year |

Note: the public OpenStreetMap tile server is fine for a small school app. If usage grows a lot, switch the tile URL in `baseMap()` to a free-tier provider such as MapTiler or Stadia Maps (one line).

## Admin tasks without a screen
- **Reset a password:** Firebase console → Authentication → find `<mobile>@schoolvan.app` → reset (or delete the user so they can register again).
- **Remove a person:** set `approved` = false from the People tab ("Block").

## Data model (for future changes)
- `users/{uid}`: name, phone, requestedRole, role, approved, routeId (drivers), fcmTokens[]
- `routes/{id}`: name, school{lat,lng}, radius, driverUid
- `students/{id}`: name, className, routeId, parentUid, parentName, parentPhone, home{lat,lng}, pendingHome
- `absences/{date}_{studentId}`: date, studentId, routeId, parentUid, studentName, morning, evening
- `trips/{routeId}_{date}_{morning|evening}`: status (started / reached / ended), startedAt, reachedAt, endedAt, picked{studentId: time}
- `live/{routeId}`: lat, lng, heading, speed, acc, ts, active, type (driver writes every 10 s during a trip)
