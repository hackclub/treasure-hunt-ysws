import type { RequestHandler } from "@sveltejs/kit";
import { timingSafeEqual } from "node:crypto";
import { env } from "$env/dynamic/private";
import { reconcileFraudOutcome } from "$lib/db/airtableClient";

/**
 * The webhook URL registered on Joe carries the shared secret as its final path
 * segment, because Joe sends no custom headers we could authenticate with. The
 * secret itself is never in the source: it lives in FRAUD_WEBHOOK_SECRET at runtime.
 * Compared in constant time so the endpoint can't be probed via timing.
 */
function secretMatches(provided: string): boolean {
    const expected = env.FRAUD_WEBHOOK_SECRET;
    if (!expected) {
        // Not configured → refuse everything rather than accept unauthenticated calls.
        return false;
    }
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
        return false;
    }
    return timingSafeEqual(a, b);
}

export const POST: RequestHandler = async ({ params, request }) => {
    if (!secretMatches(params.secret ?? "")) {
        // Give nothing away to anyone without the secret.
        return new Response("Not found", { status: 404 });
    }

    let payload: any;
    try {
        payload = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
    }

    const projectId = typeof payload?.projectId === "string" ? payload.projectId : "";
    if (!projectId) {
        return new Response(JSON.stringify({ error: "projectId is required" }), { status: 400 });
    }

    // Reconcile in the background so Joe gets its acknowledgement within a few seconds.
    // Delivery is fire-and-forget with no retries, so this is best-effort: the projects
    // poll (checkFraudStatus in /api/projects/getProjects) is the redundant fallback that
    // reconciles anything a missed or failed webhook drops once things are back up.
    reconcileFraudOutcome(projectId)
        .then((result) => {
            if (!result.matched) {
                console.warn(`Fraud webhook: no local project matched Joe project ${projectId}`);
            }
        })
        .catch((error) => {
            console.error(`Fraud webhook: failed to reconcile Joe project ${projectId}:`, error);
        });

    return new Response(JSON.stringify({ status: "success" }), { status: 200 });
};
