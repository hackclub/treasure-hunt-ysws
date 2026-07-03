import type { RequestHandler } from "@sveltejs/kit";
import { debugFraudRejectSubmission } from "$lib/db/airtableClient";

export const GET: RequestHandler = async ({ params, request }) => {
    const submissionId = params.recsubmitid;
    if (!submissionId) {
        return new Response(JSON.stringify({ error: "submissionId is required" }), { status: 400 });
    }

    let reason = "Debug rejection";
    try {
        const body = await request.json();
        if (typeof body?.reason === "string" && body.reason.trim()) {
            reason = body.reason.trim();
        }
    } catch {
        // no body is fine, use default reason
    }

    try {
        await debugFraudRejectSubmission(submissionId, reason);
        return new Response(JSON.stringify({ ok: true, submissionId, reason }), { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
};
