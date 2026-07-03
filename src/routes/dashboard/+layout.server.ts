import { redirect } from "@sveltejs/kit";
import { getSlackId, isUser } from "$lib/db/airtableClient";

export async function load({ fetch, request }) {

  const slackId = await getSlackId(request);
  if (!slackId) {
    throw redirect(302, "/api/login");
  }

  const registered = await isUser(slackId).catch(() => false);
  if (!registered) {
    throw redirect(302, "/api/login");
  }

  try {
    const response = await fetch('/api/me');
    const userData = await response.json();

    return {
      slackId: userData.slackId || '',
      displayName: userData.displayName || '',
      avatarUrl: userData.imageUrl || userData.avatarUrl || '',
      goldbars: userData.goldBars || 0,
      user: userData
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {
      slackId: '',
      displayName: '',
      avatarUrl: '',
      user: null
    };
  }
}