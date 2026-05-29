import {getActiveExpedition, getSlackId} from "$lib/db/airtableClient";

export async function GET({ request }) {
    const slackId = await getSlackId(request);
    if (!slackId) {
        return new Response("Missing slackId", { status: 400 });
    }

    try {
        const activeExpedition = await getActiveExpedition(slackId);
        return new Response(JSON.stringify({ activeExpedition }), { status: 200 });
    } catch (error) {
        console.error("Error fetching active expedition:", error);
        return new Response("Error fetching active expedition", { status: 500 });
    }
}