import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { Storage } from "@google-cloud/storage";
import { Logging } from "@google-cloud/logging";
import { circuitRegistry } from "@/lib/resilience";

export const isFirebaseAdminConfigured = Boolean(
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
);

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

export function getFirebaseAdminDb(): Firestore | null {
  if (!isFirebaseAdminConfigured) {
    return null;
  }

  try {
    if (!adminApp) {
      adminApp =
        getApps().length > 0
          ? getApps()[0]
          : initializeApp({
              credential: cert({
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
                  /\\n/g,
                  "\n"
                ),
              }),
            });
    }
    if (!adminDb) {
      adminDb = getFirestore(adminApp);
    }
    return adminDb;
  } catch (err) {
    circuitRegistry.recordFailure(
      "firestore_db",
      "FIREBASE_ADMIN_INIT_FAILED",
      err instanceof Error ? err.message : "Failed to initialize Firebase Admin",
      "Fell back to local server-db engine"
    );
    return null;
  }
}

export function getGcpStorageBucket() {
  const projectId = process.env.GCP_PROJECT_ID;
  const bucketName = process.env.GCP_STORAGE_BUCKET;
  if (!projectId || !bucketName || !isFirebaseAdminConfigured) {
    return null;
  }
  try {
    const storage = new Storage({ projectId });
    return storage.bucket(bucketName);
  } catch {
    return null;
  }
}

export async function writeGcpStructuredLog(params: {
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  event: string;
  orgId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!process.env.GCP_PROJECT_ID || !isFirebaseAdminConfigured) {
    return;
  }
  try {
    const logging = new Logging({ projectId: process.env.GCP_PROJECT_ID });
    const log = logging.log("agencyos-audit-trail");
    const entry = log.entry(
      { resource: { type: "global" }, severity: params.severity },
      {
        event: params.event,
        orgId: params.orgId,
        metadata: params.metadata || {},
        timestamp: new Date().toISOString(),
      }
    );
    await log.write(entry);
  } catch {
    // Non-blocking telemetry
  }
}
