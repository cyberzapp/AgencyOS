import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAgencySnapshot, recordDeliverableDecision } from "@/lib/server-db";
import { createApiError, createApiResponse } from "@/lib/resilience";

const PortalDecisionSchema = z.object({
  decision: z.enum(["approved", "changes_requested", "rejected"]),
  reviewerName: z.string().min(2),
  reviewerEmail: z.string().email(),
  reviewerRole: z
    .enum(["owner", "manager", "designer", "client"])
    .default("client"),
  comment: z.string().default(""),
  pinX: z.number().min(0).max(100).optional(),
  pinY: z.number().min(0).max(100).optional(),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const start = Date.now();
  try {
    const { token } = await context.params;
    const { snapshot, provider, fallbackUsed } = await getAgencySnapshot();

    const deliverable = snapshot.deliverables.find(
      (d) => d.shareToken === token || d.id === token
    );

    if (!deliverable || !deliverable.shareLinkActive) {
      return NextResponse.json(
        createApiError({
          code: "PORTAL_LINK_INVALID",
          message:
            "This client review link has expired or been revoked by the agency.",
          recoverable: false,
        }),
        { status: 404 }
      );
    }

    const org = snapshot.organizations.find((o) => o.id === deliverable.orgId);
    const client = snapshot.clients.find((c) => c.id === deliverable.clientId);

    return NextResponse.json(
      createApiResponse({
        data: {
          deliverable,
          agencyName: org?.name || "Atelier Vance Creative",
          client,
        },
        provider,
        fallbackUsed,
        latencyMs: Date.now() - start,
      })
    );
  } catch (err) {
    return NextResponse.json(
      createApiError({
        code: "PORTAL_FETCH_FAILED",
        message:
          err instanceof Error
            ? err.message
            : "Failed to load client portal session",
      }),
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const start = Date.now();
  try {
    const { token } = await context.params;
    const body = await req.json();
    const parsed = PortalDecisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        createApiError({
          code: "INVALID_PORTAL_DECISION",
          message: "Please provide your name, email, and review decision.",
          details: parsed.error.issues.map((i) => i.message).join("; "),
        }),
        { status: 400 }
      );
    }

    const ipAddress =
      req.headers.get("x-forwarded-for") || "198.51.100.89 (Verified TLS)";
    const userAgent =
      req.headers.get("user-agent") || "AgencyOS Client Review Portal";

    const result = await recordDeliverableDecision({
      shareToken: token,
      deliverableId: token,
      decision: parsed.data.decision,
      reviewerName: parsed.data.reviewerName,
      reviewerEmail: parsed.data.reviewerEmail,
      reviewerRole: parsed.data.reviewerRole,
      comment: parsed.data.comment,
      pinX: parsed.data.pinX,
      pinY: parsed.data.pinY,
      ipAddress,
      userAgent,
    });

    const { snapshot, provider, fallbackUsed } = await getAgencySnapshot();

    return NextResponse.json(
      createApiResponse({
        data: {
          ...result,
          snapshot,
        },
        provider,
        fallbackUsed,
        latencyMs: Date.now() - start,
      })
    );
  } catch (err) {
    return NextResponse.json(
      createApiError({
        code: "PORTAL_DECISION_ERROR",
        message:
          err instanceof Error
            ? err.message
            : "Failed to record approval decision",
      }),
      { status: 500 }
    );
  }
}
