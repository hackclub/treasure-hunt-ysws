import { updateUserInfo, getSlackId } from '$lib/db/airtableClient';

export async function POST(event: any) {
    try {
        const { request } = event;
        const body = await request.json();
        const slackId = await getSlackId(request);
        if (!slackId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const { firstName, lastName, homeAddress, country, emailAddress, phoneNumber } = body;
        const updates: any = {};
        if (firstName !== undefined) updates.firstName = firstName;
        if (lastName !== undefined) updates.lastName = lastName;
        if (homeAddress) {
            if (homeAddress.address1 !== undefined) updates.address1 = homeAddress.address1;
            if (homeAddress.address2 !== undefined) updates.address2 = homeAddress.address2;
            if (homeAddress.city !== undefined) updates.city = homeAddress.city;
            if (homeAddress.state !== undefined) updates.state = homeAddress.state;
            if (homeAddress.zip !== undefined) updates.zip = homeAddress.zip;
        }
        if (country !== undefined) updates.country = country;
        if (emailAddress !== undefined) updates.email = emailAddress;
        if (phoneNumber !== undefined) updates.phone = phoneNumber;

        await updateUserInfo(slackId, updates);
        return new Response(null, { status: 204 });
    } catch (error) {
        console.error('Error updating settings:', error);
        return new Response('Failed to update settings', { status: 500 });
    }
}