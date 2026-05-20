import { joinChannel } from "$lib/server/slack/slackClient";

export async function GET() {
    try {
        await joinChannel("U091DE0M4NB", "C0B57SN9X25");
    }
    catch (error) {
        console.error("Error joining channel:", error);
    }
}