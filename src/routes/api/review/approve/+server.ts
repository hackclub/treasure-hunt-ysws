import type { RequestHandler } from "@sveltejs/kit";
import { approveSubmission } from "$lib/db/airtableClient";
import { clearCache } from "$lib/server/projectsCache";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const submissionId = String(body?.projectId || "").trim();

    if (!submissionId) {
      return new Response(JSON.stringify({ error: "projectId is required" }), { status: 400 });
    }

    const overrideHours = body?.overrideHours !== undefined ? Number(body.overrideHours) : undefined;
    const justification = typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : undefined;

    await approveSubmission(submissionId, overrideHours, justification);
    clearCache();

    return new Response(JSON.stringify({ status: "success", message: "Project sent to fraud review." }), { status: 200 });
  } catch (error) {
    console.error("Error approving project:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};