import { PubSub } from "@google-cloud/pubsub";
import { PubSubJob } from "@/types/agency";
import { withResilientFallback } from "@/lib/resilience";

export type PubSubTopicName =
  | "agencyos-approval-events"
  | "agencyos-email-notifications"
  | "agencyos-social-publishing"
  | "agencyos-ai-triage";

const isPubSubCloudConfigured = Boolean(
  process.env.GCP_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
);

let pubsubClient: PubSub | null = null;

function getPubSubClient(): PubSub | null {
  if (!isPubSubCloudConfigured) return null;
  if (!pubsubClient) {
    pubsubClient = new PubSub({
      projectId: process.env.GCP_PROJECT_ID,
    });
  }
  return pubsubClient;
}

export async function publishToWorkQueue(params: {
  orgId: string;
  topic: PubSubTopicName;
  eventType: string;
  recipient?: string;
  subject?: string;
  payload: Record<string, unknown>;
}): Promise<PubSubJob> {
  const now = new Date().toISOString();
  const jobId = `job_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  const { result } = await withResilientFallback<PubSubJob>({
    service: "gcp_pubsub",
    operationName: `publish:${params.topic}:${params.eventType}`,
    isCloudConfigured: isPubSubCloudConfigured,
    primaryFn: async () => {
      const client = getPubSubClient();
      if (!client) {
        throw new Error("GCP PubSub client unavailable");
      }
      const dataBuffer = Buffer.from(
        JSON.stringify({
          jobId,
          orgId: params.orgId,
          eventType: params.eventType,
          recipient: params.recipient,
          subject: params.subject,
          payload: params.payload,
          publishedAt: now,
        })
      );
      const messageId = await client.topic(params.topic).publishMessage({
        data: dataBuffer,
        attributes: {
          orgId: params.orgId,
          eventType: params.eventType,
        },
      });

      return {
        id: jobId,
        orgId: params.orgId,
        topic: params.topic,
        eventType: params.eventType,
        recipient: params.recipient,
        subject: params.subject,
        payload: params.payload,
        status: "acknowledged",
        attempts: 1,
        provider: "gcp_pubsub",
        messageId: `gcp_msg_${messageId}`,
        createdAt: now,
        processedAt: new Date().toISOString(),
      };
    },
    fallbackFn: async () => {
      const syntheticMsgId = `pubsub_local_${Date.now().toString(36)}`;
      return {
        id: jobId,
        orgId: params.orgId,
        topic: params.topic,
        eventType: params.eventType,
        recipient: params.recipient,
        subject: params.subject,
        payload: params.payload,
        status: "acknowledged",
        attempts: 1,
        provider: "local_resilient_queue",
        messageId: syntheticMsgId,
        createdAt: now,
        processedAt: new Date().toISOString(),
      };
    },
  });

  return result;
}
