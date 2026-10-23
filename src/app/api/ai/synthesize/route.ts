import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { synthesizeClientFeedbackToActions } from "@/lib/gemini-copilot";
import { createApiError, createApiResponse } from "@/lib/resilience";

const SynthesizeSchema = z.object({
  deliverableTitle: z.string().min(1),
  comment: z.string().min(3),
  versionNumber: z.number().int().positive().default(1),
});

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = await req.json();
    const parsed = SynthesizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createApiError({
          code: "INVALID_AI_PROMPT",
          message: "Please provide client feedback text to synthesize.",
        }),
        { status: 400 }
      );
    }

    const { items, provider } = await synthesizeClientFeedbackToActions(
      parsed.data
    );

    return NextResponse.json(
      createApiResponse({
        data: { items },
        provider,
        fallbackUsed: provider === "resilient_local_engine",
        latencyMs: Date.now() - start,
      })
    );
  } catch (err) {
    return NextResponse.json(
      createApiError({
        code: "AI_SYNTHESIS_ERROR",
        message:
          err instanceof Error
            ? err.message
            : "Failed to synthesize client feedback",
      }),
      { status: 500 }
    );
  }
}
