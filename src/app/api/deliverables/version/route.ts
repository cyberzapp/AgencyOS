import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAgencySnapshot, uploadDeliverableVersion } from "@/lib/server-db";
import { createApiError, createApiResponse } from "@/lib/resilience";

const UploadVersionSchema = z.object({
  deliverableId: z.string().min(1),
  label: z.string().min(1),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSizeMb: z.number().positive(),
  dimensions: z.string().default("2400 x 3000 px"),
  changeSummary: z.string().min(2),
  uploadedBy: z.string(),
  uploaderEmail: z.string().email(),
  uploaderRole: z.enum(["owner", "manager", "designer", "client"]),
});

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = await req.json();
    const parsed = UploadVersionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        createApiError({
          code: "INVALID_VERSION_PAYLOAD",
          message: "Version upload validation failed",
          details: parsed.error.issues.map((i) => i.message).join("; "),
        }),
        { status: 400 }
      );
    }

    const result = await uploadDeliverableVersion(parsed.data);
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
        code: "VERSION_UPLOAD_ERROR",
        message:
          err instanceof Error
            ? err.message
            : "Failed to upload asset version",
      }),
      { status: 500 }
    );
  }
}
