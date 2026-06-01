import { getReviewStatistics } from "$lib/db/airtableClient";

export async function GET() {
    try {
        const statistics = await getReviewStatistics();

        return new Response(JSON.stringify(statistics, null, 2), {
            status: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" }
        });
    } catch (error) {
        console.error("Error fetching review statistics:", error);
        const message = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: "Error fetching review statistics", message }, null, 2), {
            status: 500,
            headers: { "Content-Type": "application/json; charset=utf-8" }
        });
    }
}