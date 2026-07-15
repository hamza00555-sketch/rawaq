// Cloud Function: alert mom on her device even when the app is fully closed.
//
// Fires whenever a worker's share doc is updated. If the update flips any task
// from not-done to done, it looks up mom's push token (saved by her device at
// pushTokens/{shareId}) and sends an FCM Web Push. The function is
// language-agnostic: the client stored the exact strings to send, so here we
// only pick singular vs plural and fill in the count.
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
setGlobalOptions({ region: "us-central1", maxInstances: 5 });

exports.notifyOnTaskDone = onDocumentUpdated("shares/{shareId}", async (event) => {
  const before = event.data?.before?.data() || {};
  const after = event.data?.after?.data() || {};

  // Count tasks the worker flipped to done in this update.
  const wasDone = new Map((before.tasks || []).map((t) => [t.id, !!t.done]));
  let newly = 0;
  for (const task of after.tasks || []) {
    if (task && task.done && !wasDone.get(task.id)) newly++;
  }
  if (newly <= 0) return;

  const shareId = event.params.shareId;
  const db = getFirestore();
  const snap = await db.doc(`pushTokens/${shareId}`).get();
  if (!snap.exists) return;

  const { token, title, bodyOne, bodyMany } = snap.data() || {};
  if (!token) return;

  const template = newly > 1 ? bodyMany || bodyOne || "" : bodyOne || "";
  const body = template.replace("{n}", String(newly));

  try {
    await getMessaging().send({
      token,
      webpush: {
        notification: {
          title: title || "رواق",
          body,
          icon: "/icon-192.png",
          tag: "rawaq-tasks",
        },
        fcmOptions: { link: "/" },
      },
    });
  } catch (err) {
    // Prune a token the push service no longer recognizes so we stop retrying.
    const code = err && (err.code || (err.errorInfo && err.errorInfo.code));
    if (
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-registration-token"
    ) {
      await db.doc(`pushTokens/${shareId}`).delete().catch(() => {});
    } else {
      console.error("push send failed", code || err);
    }
  }
});
