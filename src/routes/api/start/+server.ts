import { getActiveExpedition, setActiveExpedition, getSlackId } from "$lib/db/airtableClient";

export async function POST({ request }) {
    const { expedition } = await request.json();
    const slackId = await getSlackId(request);
    if (!slackId || !expedition) {
        return new Response("Missing slackId or expedition", { status: 400 });
    }

    try {
        const activeExpedition = await getActiveExpedition(slackId);
        if (activeExpedition) {
            return new Response("User already has an active expedition", { status: 400 });
        }

        await setActiveExpedition(slackId, expedition);
        return new Response("Expedition started successfully", { status: 200 });
    } catch (error) {
        console.error("Error starting expedition:", error);
        return new Response("Error starting expedition", { status: 500 });
    }
}