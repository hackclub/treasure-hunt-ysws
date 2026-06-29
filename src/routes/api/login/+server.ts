import { redirect } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

export function GET() {
    throw redirect(302, `https://auth.hackclub.com/oauth/authorize?client_id=${env.HCA_CLIENT_ID}&redirect_uri=${env.HCA_REDIRECT_ADDRESS}/api/login/callback&response_type=code&scope=openid email name profile verification_status slack_id birthdate basic_info address`);
}