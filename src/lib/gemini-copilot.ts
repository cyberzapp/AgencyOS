import { GoogleGenAI } from "@google/genai";
import { AIActionItem } from "@/types/agency";
import { withResilientFallback } from "@/lib/resilience";

const isGeminiConfigured = Boolean(
  process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10
);

/**
 * Deterministic semantic extractor that parses unstructured client feedback
 * into actionable, categorized designer checklist items as a resilient fallback.
 */
export function extractHeuristicActionItems(commentText: string): AIActionItem[] {
  const sentences = commentText
    .split(/(?<=[.?!;])\s+|\n+|(?:\s+and\s+(?=[a-zA-Z]+\s))/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 6);

  if (sentences.length === 0 && commentText.trim().length > 0) {
    sentences.push(commentText.trim());
  }

  return sentences.slice(0, 4).map((raw, idx) => {
    const lower = raw.toLowerCase();
    let category: AIActionItem["category"] = "layout";
    let priority: AIActionItem["priority"] = "medium";

    if (
      lower.includes("color") ||
      lower.includes("tone") ||
      lower.includes("warm") ||
      lower.includes("cool") ||
      lower.includes("contrast") ||
      lower.includes("shadow") ||
      lower.includes("marble") ||
      lower.includes("terracotta") ||
      lower.includes("palette")
    ) {
      category = "color";
      priority = "high";
    } else if (
      lower.includes("font") ||
      lower.includes("kerning") ||
      lower.includes("type") ||
      lower.includes("headline") ||
      lower.includes("serif") ||
      lower.includes("size")
    ) {
      category = "typography";
      priority = "high";
    } else if (
      lower.includes("copy") ||
      lower.includes("word") ||
      lower.includes("caption") ||
      lower.includes("cta") ||
      lower.includes("text")
    ) {
      category = "copy";
    } else if (
      lower.includes("legal") ||
      lower.includes("disclaimer") ||
      lower.includes("trademark") ||
      lower.includes("logo") ||
      lower.includes("fda")
    ) {
      category = "compliance";
      priority = "high";
    }

    const cleaned = raw.replace(/^[-*•\d.)\s]+/, "");
    const capitalized =
      cleaned.charAt(0).toUpperCase() + cleaned.slice(1).replace(/[.?!]+$/, "");

    return {
      id: `ai_act_${Date.now().toString(36)}_${idx}`,
      task: `${capitalized} (verified from client feedback)`,
      category,
      priority,
      completed: false,
    };
  });
}

/**
 * Uses Google Gemini (via @google/genai) to transform vague client comments
 * into concrete, traceable designer tasks with resilient fallback.
 */
export async function synthesizeClientFeedbackToActions(params: {
  deliverableTitle: string;
  comment: string;
  versionNumber: number;
}): Promise<{
  items: AIActionItem[];
  provider: "firebase_gcp_cloud" | "resilient_local_engine";
}> {
  const { result, provider } = await withResilientFallback<AIActionItem[]>({
    service: "gemini_ai",
    operationName: "synthesizeClientFeedbackToActions",
    isCloudConfigured: isGeminiConfigured,
    primaryFn: async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const interaction = await ai.interactions.create({
        model: "gemini-3.8-flash",
        input: `You are AgencyOS Feedback Triage Copilot. Convert this client comment on deliverable "${params.deliverableTitle}" (v${params.versionNumber}) into 2-4 concrete, checkable action items for a designer.
Client Comment: "${params.comment}"
Return strict JSON array of objects with keys: "task" (string), "category" ("typography"|"color"|"layout"|"copy"|"compliance"), "priority" ("high"|"medium"|"low").`,
      });
      const interactionData = interaction as unknown as {
        output_text?: string | null;
        steps?: unknown[];
      };
      const rawOutput =
        interactionData.output_text ||
        JSON.stringify(interactionData.steps || interaction);
      const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Invalid JSON array from Gemini 3.8 Flash");
      }
      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        task: string;
        category: AIActionItem["category"];
        priority: AIActionItem["priority"];
      }>;
      return parsed.map((item, idx) => ({
        id: `ai_gem_${Date.now().toString(36)}_${idx}`,
        task: item.task,
        category: item.category || "layout",
        priority: item.priority || "medium",
        completed: false,
      }));
    },
    fallbackFn: () => extractHeuristicActionItems(params.comment),
  });

  return { items: result, provider };
}
