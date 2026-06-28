#!/usr/bin/env node
/**
 * Carga excursiones de ejemplo en Firestore (colección services).
 *
 * Uso:
 *   npm run seed:services
 *   npm run seed:services -- --force   (sobrescribe por slug)
 */
const { readFileSync } = require("node:fs");
const { dirname, join } = require("node:path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const force = process.argv.includes("--force");

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

const db = getFirestore();
const seedPath = join(dirname(__filename), "data", "services-seed.json");
const services = JSON.parse(readFileSync(seedPath, "utf8"));

async function main() {
  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const service of services) {
    const existing = await db
      .collection("services")
      .where("slug", "==", service.slug)
      .limit(1)
      .get();

    if (!existing.empty && !force) {
      console.log(`⏭  ${service.slug} ya existe (usá --force para actualizar)`);
      skipped++;
      continue;
    }

    const payload = {
      ...service,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!existing.empty) {
      await existing.docs[0].ref.set(payload, { merge: true });
      console.log(`✓ Actualizado: ${service.slug}`);
      updated++;
    } else {
      await db.collection("services").add({
        ...payload,
        createdAt: FieldValue.serverTimestamp(),
      });
      console.log(`✓ Creado: ${service.slug}`);
      created++;
    }
  }

  console.log(`\nListo. Creados: ${created}, actualizados: ${updated}, omitidos: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
