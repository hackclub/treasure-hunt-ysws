import { App } from "@slack/bolt";
import { env } from "$env/dynamic/private";

let slackClient: App | null = null;

function getSlackClient(): App {
    if (!slackClient) {
        slackClient = new App({
            token: env.SLACK_BOT_TOKEN,
            signingSecret: env.SLACK_SIGNING_SECRET,
            appToken: env.SLACK_APP_TOKEN,
            socketMode: false,
        });
    }
    return slackClient;
}

export async function sendUpdateDM(slackId: string, title: string, message: string) {
    try {
        const client = getSlackClient();
        await client.client.chat.postMessage({
            channel: slackId,
            text: `New message in category ${title}: ${message}`,
            unfurl_links: false,
            unfurl_media: false,
            blocks: [
                {
                    type: "header",
                    text: {
                        type: "plain_text",
                        text: "New message from Treasure Hunt!",
                        emoji: true,
                    },
                },
                {
                    type: "header",
                    text: {
                        type: "plain_text",
                        text: title,
                        emoji: true,
                    },
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: message,
                    },
                },
                {
                    type: "divider",
                },
                {
                    type: "actions",
                    elements: [
                        {
                            type: "button",
                            text: {
                                type: "plain_text",
                                text: "Open Treasure Hunt",
                                emoji: true,
                            },
                            value: "open_treasure_hunt",
                            url: "https://treasure.peleg2210.tech/dashboard",
                        },
                    ],
                }, 
                {
                    type: "context",
                    elements: [
                        {
                            type: "image",
                            image_url: "https://avatars.slack-edge.com/2025-10-10/9661249810775_dc9547e59052a3bf013f_512.png",
                            alt_text: "peleg2210 logo",
                        },
                        {
                            type: "mrkdwn",
                            text: "If you need any help, fell free to contact me <https://hackclub.slack.com/team/U091DE0M4NB|@peleg2210>"
                        }
                    ],
                },
            ],
        });
    } catch (error) {
        console.error("Error sending DM:", error);
    }
}

export async function joinChannel(slackId: string, channelId: string) {
    try {
        const client = getSlackClient();
        await client.client.conversations.invite({
            channel: channelId,
            users: slackId,
        });
    } catch (error) {
        console.error("Error joining channel:", error);
    }
}