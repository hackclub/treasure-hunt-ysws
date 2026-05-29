import { journeyIdToRecordId, getJourneyById, userSlackIdToUserRecord, addToCompleters, updateJourneyNumber, getActiveExpedition, createOrder, getSubmissionBySlackId, getGoldBars, updateGoldBars } from "$lib/db/airtableClient";

export async function completeJourney(slackId: string, journeyNumber: number) {
    const journeyRecordId = journeyIdToRecordId(journeyNumber);

    const journey = await getJourneyById(journeyNumber);

    if (!journey) {
        throw new Error(`Journey with number ${journeyNumber} not found`);
    }

    const userRecord = await userSlackIdToUserRecord(slackId);
    if (!userRecord) {
        throw new Error(`User with slackId ${slackId} not found`);
    }

    const currentJourneyNumber = Number(userRecord.get("journeyNumber") ?? 0);
    const nextJourneyNumber = Math.max(currentJourneyNumber, journeyNumber + 1);

    // we need to do a few things:
    // check if the journey humber isn't larger then 7
    //if (journeyNumber > 7) {
    //    throw new Error("Congrats on completing the treasure hunt! Stay tuned for future adventures.");
   // }
    // 1. check if user has more then 1 project in review / a project rejected | Don't allow them to complete the journey if they do
    //const submission = await getSubmissionBySlackId(slackId);
    //let inReviewCounter = 0;
    //if (submission) {
    //    if (submission.status === "unreviewed") {
    //        inReviewCounter++;
    //    } else if (inReviewCounter > 2) {
    //        throw new Error("You have too many projects in review. Please wait for them to be reviewed before submitting another project.");
    //    } else if (submission.status === "rejected") {
    //        throw new Error("One of your projects was rejected. Please update your project and resubmit it before submitting another project.");
    //    }
    //}
    // 2. send project into review.
    // 3. add them to the completers list of the journey

    // fullfill
    const activeExpedition = await getActiveExpedition(slackId);
    // fullfill general
    if (activeExpedition == 'general') {
        let itemId;
        switch(currentJourneyNumber) {
            case 1: 
                itemId = "1";
                break;
            case 2:
                itemId = "2";
                break;
            case 3:
                itemId = "3";
                break;
            case 4:
                itemId = "4";
                break;
            case 5:
                itemId = "5";
                break;
            case 6:
                itemId = "6";
                break;
            case 7:
                itemId = "7";
                break;
            default:
                throw new Error(`No day prize item configured for journey ${currentJourneyNumber}`);
        }
        const order = {
                    slackId: slackId,
                    itemId: itemId,
                    amount: 1,
                    totalPrice: 0,
                    address: `${userRecord.get("address1")}, ${userRecord.get("address2")}, ${userRecord.get("city")}, ${userRecord.get("state")}, ${userRecord.get("zip")}`,
                    email: userRecord.get("email") as string,
                    phone: userRecord.get("phone") as string,
                    country: userRecord.get("country") as string,
                    isDayPrize: true,
                    status: "pending" as const
                };
        await createOrder(order);
    }
    // fullfill hardware
    if (activeExpedition == 'hardware') {
        let itemId;
        switch(currentJourneyNumber) {
            case 1: 
                itemId = "12";
                break;
            case 2:
                itemId = "13";
                break;
            case 3:
                itemId = "14";
                break;
            case 4:
                itemId = "15";
                break;
            case 5:
                itemId = "16";
                break;
            case 6:
                itemId = "17";
                break;
            case 7:
                itemId = "18";
                break;
            default:
                throw new Error(`No day prize item configured for journey ${currentJourneyNumber}`);
        }
        const order = {
                    slackId: slackId,
                    itemId: itemId,
                    amount: 1,
                    totalPrice: 0,
                    address: `${userRecord.get("address1")}, ${userRecord.get("address2")}, ${userRecord.get("city")}, ${userRecord.get("state")}, ${userRecord.get("zip")}`,
                    email: userRecord.get("email") as string,
                    phone: userRecord.get("phone") as string,
                    country: userRecord.get("country") as string,
                    isDayPrize: true,
                    status: "pending" as const
                };
        await createOrder(order);
    }

    // add gold bars for completing the journey, 10 goldbars per hour after the fourth hour
    try {
        const submission = await getSubmissionBySlackId(slackId);
        const hoursSpent = submission?.["Optional - Override Hours Spent"] ?? 0;
        const extraHours = Math.max(0, Math.floor(Number(hoursSpent)) - 4);
        if (extraHours > 0) {
            const rate = 10;
            const goldToAdd = extraHours * rate;
            const currentGold = await getGoldBars(undefined, slackId);
            await updateGoldBars(slackId, (currentGold || 0) + goldToAdd);
        }
    } catch (err) {
        console.error("Error awarding gold bars:", err);
    }

    await addToCompleters(journeyNumber, userRecord.id);
    // 3.5. Bump journeyNumber only forward, never backwards when backfilling older journeys
    if (nextJourneyNumber > currentJourneyNumber) {
        await updateJourneyNumber(slackId, nextJourneyNumber);
    }
    // ~4. once project approved add them the goldbars and send them the order - do in review workflow~
    // 5. dm them about there project wen't into review
    // ~6. dm them when project was approved or rejected- do in review workflow~
    // ~7. if approved dm them about the gold bars they earned and make order~
}