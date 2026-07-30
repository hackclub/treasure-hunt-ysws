import { getSlackId, isAdmin, isReviewer, getActiveExpedition } from "$lib/db/airtableClient";
import { env } from "$env/dynamic/private";
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    let slackId = await getSlackId(event.request);
    const cookieHeader = event.request.headers.get("cookie") || "";
    const hasRefresh = cookieHeader.includes("refresh_token=");
    const hasAccess = cookieHeader.includes("access_token=");

    if (!slackId && hasRefresh && !hasAccess) {
        const refreshToken = cookieHeader.split("refresh_token=")[1]?.split(";")[0];
        if (refreshToken) {
            const refreshUrl = "https://auth.hackclub.com/oauth/token";
            try {
                const refreshResponse = await fetch(refreshUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "client_id": env.HCA_CLIENT_ID,
                        "client_secret": env.HCA_CLIENT_SECRET,
                        refresh_token: refreshToken,
                        grant_type: "refresh_token",
                    })
                });
                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    const newAccessToken = refreshData.access_token;
                    const newRefreshToken = refreshData.refresh_token;
                    event.request.headers.set('cookie', `access_token=${newAccessToken}; refresh_token=${newRefreshToken}`);
                    slackId = await getSlackId(event.request);
                    const cookieOpts = { path: '/', httpOnly: true, sameSite: 'lax' as const };
                    event.cookies.set('access_token', newAccessToken, cookieOpts);
                    event.cookies.set('refresh_token', newRefreshToken, cookieOpts);
                } else {
                    console.error("Error refreshing access token:", await refreshResponse.text());
                }
            } catch (error) {
                console.error("Error refreshing access token:", error);
            }
        }
    }

    if (
        event.url.pathname.startsWith('/api/') &&
        event.url.pathname !== '/api/login' &&
        !event.url.pathname.startsWith('/api/login/') &&
        !event.url.pathname.startsWith('/api/uploadthing') &&
        // The fraud webhook authenticates itself via the secret in its path; Joe has no Slack session.
        !event.url.pathname.startsWith('/api/fraud/webhook')
    ) {
        if (!slackId) {
            return new Response('Not loggedin', { status: 401 });
        }
        if (event.url.pathname.startsWith('/api/admin/') || event.url.pathname.startsWith('/api/debug/')) {
            if (!(await isAdmin(slackId))) {
                return new Response('Unauthorized', { status: 401 });
            }
        }
    }
    if (event.url.pathname.startsWith('/dashboard')) {
        if (!slackId) {
            throw redirect(303, '/');
        }
        const activeExpedition = await getActiveExpedition(slackId);
        if (activeExpedition === null && !event.url.pathname.startsWith('/dashboard/start')) {
            throw redirect(303, '/dashboard/start');
        }
        if (activeExpedition !== null && event.url.pathname.startsWith('/dashboard/start')) {
            throw redirect(303, '/dashboard/');
        }
    }

    if (event.url.pathname.startsWith('/review') || event.url.pathname.startsWith('/api/review')) {
        if (!slackId) {
            throw redirect(303, '/');
        }

        if (!(await isReviewer(slackId))) {
            throw redirect(303, '/');
        }
    }
    return resolve(event);
};
