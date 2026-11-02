/**
 * School Van — Cloud Functions (needs Blaze plan; optional — demo works without them)
 *  1. onTripChange  → parents get: Morning van started / Reached school / Evening van left school
 *  2. onAbsence     → driver gets: "<child> absent today — skip this stop"
 */
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
// Keep this the same as your Firestore database location (README step 3).
setGlobalOptions({ region: 'asia-south1', maxInstances: 5 });
const db = getFirestore();
// Where the app is hosted (GitHub Pages). Change if you move it to Firebase Hosting or your own domain.
const APP_URL = 'https://maheshkumar040795-afk.github.io/School_Van_App/';

const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const DEAD_TOKEN = ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'];

async function sendToUsers(uids, title, body) {
  uids = [...new Set(uids)].filter(Boolean);
  if (!uids.length) return 0;
  const snaps = await db.getAll(...uids.map(u => db.doc(`users/${u}`)));
  const tokens = [], owners = [];
  snaps.forEach(s => (s.get('fcmTokens') || []).forEach(t => { tokens.push(t); owners.push(s.id); }));
  let sent = 0;
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    const res = await getMessaging().sendEachForMulticast({
      tokens: batch,
      notification: { title, body },
      webpush: {
        notification: { icon: APP_URL + 'icons/icon-192.png', badge: APP_URL + 'icons/icon-192.png', vibrate: [200, 100, 200] },
        fcmOptions: { link: APP_URL }
      }
    });
    sent += res.successCount;
    const cleanup = [];
    res.responses.forEach((r, j) => {
      if (!r.success && DEAD_TOKEN.includes(r.error?.code)) {
        cleanup.push(db.doc(`users/${owners[i + j]}`).update({ fcmTokens: FieldValue.arrayRemove(batch[j]) }));
      }
    });
    await Promise.all(cleanup);
  }
  return sent;
}

exports.onTripChange = onDocumentWritten('trips/{tripId}', async event => {
  const before = event.data.before.exists ? event.data.before.data() : null;
  const after = event.data.after.exists ? event.data.after.data() : null;
  if (!after || before?.status === after.status) return;

  const { routeId, date, type, status } = after;
  const route = (await db.doc(`routes/${routeId}`).get()).data() || {};
  const rn = route.name || 'School';
  let title, body;
  if (type === 'morning' && status === 'started') { title = `🚐 ${rn} van started`; body = 'Van has started the pickup. Please get your child ready.'; }
  else if (type === 'morning' && status === 'reached') { title = '🏫 Reached school'; body = `${rn} van reached school safely.`; }
  else if (type === 'evening' && status === 'started') { title = '🏠 Van left school'; body = `${rn} van started the return trip. Your child is on the way home.`; }
  else return;

  const [students, absences] = await Promise.all([
    db.collection('students').where('routeId', '==', routeId).get(),
    db.collection('absences').where('routeId', '==', routeId).where('date', '==', date).get()
  ]);
  const absent = new Set(absences.docs.filter(d => d.get(type) === true).map(d => d.get('studentId')));
  const parents = students.docs.filter(s => !absent.has(s.id)).map(s => s.get('parentUid'));
  const sent = await sendToUsers(parents, title, body);
  console.log(`trip ${event.params.tripId} ${status}: notified ${sent} devices`);
});

exports.onAbsence = onDocumentWritten('absences/{absId}', async event => {
  const before = event.data.before.exists ? event.data.before.data() : {};
  const after = event.data.after.exists ? event.data.after.data() : null;
  if (!after) return;
  const newly = ['morning', 'evening'].filter(k => after[k] === true && before[k] !== true);
  if (!newly.length) return;
  const route = (await db.doc(`routes/${after.routeId}`).get()).data();
  if (!route?.driverUid) return;
  const when = after.date === todayIST() ? 'today' : `on ${after.date}`;
  await sendToUsers([route.driverUid], `❌ ${after.studentName} absent`, `${after.studentName} will not come ${when} (${newly.join(' & ')}). Skip this stop.`);
});
