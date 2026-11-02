# School Van Tracker (PWA)

One mobile web app for **parents, drivers and the school admin**. People open the link and tap **Add to Home Screen** to install it. It works on Android (Chrome) and iPhone (Safari, iOS 16.4+), and there's no Play Store or App Store.

## Features
| Who | What they can do |
|---|---|
| **Parent** | Register with mobile number, add child + home pickup pin (GPS or drag pin), mark absent (Morning / Evening, any date), **Track Van Live** (van icon moves on the map), get 3 notifications a day |
| **Driver** | Sees own route's students as name pins on the map (absent students greyed out), list sorted by nearest stop, Picked / Dropped buttons, 📞 call parent, 🧭 open Google Maps navigation, Start Morning Pickup / Reached School / Start Evening Return / End Trip |
| **Admin** | Approve registrations, set role (parent / driver / admin), create routes (e.g. Mangadu) with school location, assign driver to a route, approve parents' home location changes, move / remove students |

**Notifications**
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
database.rules.json             live van location security
functions/index.js              sends the notifications
firebase.json                   hosting + deploy config
```

## Setup (one time, about 30 minutes)

1. **Create the Firebase project.** Go to https://console.firebase.google.com and click Add project.
2. **Upgrade to the Blaze plan.** It's needed for Cloud Functions (notifications), and the free quotas still apply. Then set a budget alert: Google Cloud console → Billing → Budgets → ₹100.
3. **Cloud Firestore:** Create database → Production mode → location **asia-south1 (Mumbai)**.
   If you pick another location, change `region` in `functions/index.js` to match.
4. **Realtime Database:** Create database → location **asia-southeast1 (Singapore)** → locked mode.
5. **Authentication:** Sign-in method → enable **Email/Password**. The app turns mobile numbers into `<mobile>@schoolvan.app` logins, so no SMS costs.
6. **Web app config:** Project settings → General → Add app → Web. Copy the `firebaseConfig` into `public/firebase-config.js`, including the `databaseURL`.
7. **VAPID key:** Project settings → Cloud Messaging → Web Push certificates → Generate key pair. Paste it as `VAPID_KEY`.
8. **Deploy** from your computer:
   ```bash
   npm install -g firebase-tools
   firebase login
   cd school-van-app
   firebase use --add            # choose your project
   cd functions && npm install && cd ..
   firebase deploy --only firestore,database,functions
   ```
   This deploys the security rules and notification functions. To use Firebase Hosting instead of GitHub Pages, run plain `firebase deploy`.
   If you use Firebase Hosting, change `APP_URL` in `functions/index.js`.
**App hosting on GitHub Pages (already set up):**
- Every push to `main` that changes `public/` publishes the app to **https://maheshkumar040795-afk.github.io/School_Van_App/**.
- Turn this on once: GitHub repo → Settings → Pages → Source = **GitHub Actions**.
- Add the domain to Firebase: Authentication → Settings → **Authorized domains** → add `maheshkumar040795-afk.github.io`. Login is blocked until you do this.
- Commit your real `public/firebase-config.js` (step 6). The Firebase web config is safe to publish, because the security rules protect the data.

9. **Make yourself admin:** open the app and register (choose any role). In Firestore → `users` → your document, set `role` = `admin` and `approved` = `true` (boolean). Reload the app.
10. **In the Admin screen:**
    1. Routes → Add Route "Mangadu" and set the school pin and radius.
    2. Approve the drivers' registrations, set Role = Driver and pick the route.
    3. Approve the parents.

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
| Hosting, Firestore, Realtime DB, push notifications for 300–400 parents | Within Firebase free quotas (₹0 expected) |
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
- Realtime DB `live/{routeId}`: lat, lng, heading, speed, acc, ts, active, type
