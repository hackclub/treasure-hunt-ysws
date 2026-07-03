import type { RequestHandler } from "@sveltejs/kit";
import { debugFraudApproveSubmission } from "$lib/db/airtableClient";

export const GET: RequestHandler = async ({ params }) => {
    const submissionId = params.recsubmitid;
    if (!submissionId) {
        return new Response(JSON.stringify({ error: "submissionId is required" }), { status: 400 });
    }

    try {
        await debugFraudApproveSubmission(submissionId);
        return new Response(JSON.stringify({ ok: true, submissionId }), { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
};
