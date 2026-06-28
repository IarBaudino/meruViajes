/**
 * Asigna rol admin a un usuario por email.
 * Uso: npm run grant-admin -- email@ejemplo.com
 */
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const email = process.argv[2];

if (!email) {
  console.error("Uso: npm run grant-admin -- email@ejemplo.com");
  process.exit(1);
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Configurá FIREBASE_ADMIN_* en .env.local");
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

async function main() {
  const auth = getAuth();
  const db = getFirestore();
  const user = await auth.getUserByEmail(email);

  await auth.setCustomUserClaims(user.uid, { admin: true });
  await db.collection("users").doc(user.uid).set(
    { role: "admin", updatedAt: new Date() },
    { merge: true }
  );

  console.log(`Admin concedido a ${email} (${user.uid})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
