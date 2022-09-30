/**
 * Copyright 2022 Justin Randall, Cisco Systems Inc. All Rights Reserved.
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software Foundation, either version 3 of the License, or 
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without 
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with this program. If not, 
 * see <https://www.gnu.org/licenses/>.
 */

const { Intent, Sequence, fmtLog } = require("codingforconvos");
const { RedmineConnector } = require("../connectors/redmine");
const { GoogleCalendarConnector } = require("../connectors/googlecalendar");
const { injectJdsEvent } = require("../common");

// Define Sequence Name Constants.
const SEQ_APPTBOOKING_NAME = 'apptbooking';

/**
 * Inject a JDS tape event representing an appointment booking success.
 * 
 * @param {DialogContext} dialogContext The dialog context.
 */
async function injectAppointmentBookingSuccessEvent(dialogContext) {
    injectJdsEvent(dialogContext, 'Covid Screen Accepted', {
        caseUrl: 'http://cctsa-redmine.outofservice.org/issues/'+dialogContext.ctxparams.triageNumber,
        caseReason: 'Record of accepted screening results'
    });
}

/**
 * Inject a JDS tape event representing an appointment booking failure.
 * 
 * @param {DialogContext} dialogContext The dialog context.
 */
async function injectAppointmentBookingFailureEvent(dialogContext) {
    injectJdsEvent(dialogContext, 'Covid Screen Rejected', {
        caseUrl: 'http://cctsa-redmine.outofservice.org/issues/'+dialogContext.ctxparams.triageNumber,
        caseReason: 'Record of rejected screening results'
    });
}

/**
 * Registers the sequences and intents for the appointment booking module.
 * 
 * @param {ConvoClient} convoClient The convo client.
 */
function registerModuleAppointmentBooking(convoClient) {
    // Register Sequence.
    convoClient.registerSequence(new Sequence({
        name: SEQ_APPTBOOKING_NAME, // Sequence name, also used for Dialogflow context name.
        activity: 'booking your appointment', // Activity description, used in course correction.
        identityRequired: false,
        authRequired: false,
        params: {
            accepted: '0',
            declined: '0',

            rebookIntentReceived: '0',
            rebookIntentConfirmed: '0',
            rebookIntentDeclined: '0',

            bookingNumber: '',
            bookingOffered: '0',
            bookingAccepted: '0',
            bookingDeclined: '0'
        },
        navigate: (dialogContext) => { // Navigate the sequence forward.
            let context = dialogContext.getOrCreateCtx(SEQ_APPTBOOKING_NAME);

            if (context.parameters.rebookIntentReceived === '1' && context.parameters.rebookIntentConfirmed === '1') {
                let event = dialogContext.respondWithEvent('EscalateToAgent', dialogContext.params.lastFulfillmentText);
                return;
            }

            if (context.parameters.rebookIntentReceived === '1' && context.parameters.rebookIntentDeclined === '1') {
                let event = dialogContext.respondWithEvent('AskReasonForContact');
                return;
            }

            if (context.parameters.rebookIntentReceived === '0') {
                let event = dialogContext.respondWithEvent('RfcConfirmAppointmentRebook', dialogContext.params.lastFulfillmentText);
                return;
            }
    
            console.log(fmtLog('apptbooking.navigate', 'action: '+dialogContext.currentAction+', lastFulfillmentText: '+dialogContext.params.lastFulfillmentText, dialogContext));
            dialogContext.respondWithText();
            return;
        }
    }));

    // Register Intent Handlers.
    convoClient.registerIntent(new Intent({
        action: 'skill.appointment.rebook.rfc.confirm',
        sequenceName: SEQ_APPTBOOKING_NAME,
        waitForReply: true,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            return;
        }
    }));
    convoClient.registerIntents({
        actions: [
            'skill.appointment.rebook.rfc.confirm.confirmation.yes',
            'skill.appointment.rebook.rfc.confirm.confirmation.able'
        ],
        sequenceName: SEQ_APPTBOOKING_NAME,
        waitForReply: false,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'rebookIntentReceived': '1',
                'rebookIntentConfirmed': '1',
                'rebookIntentDeclined': '0'
            });
            dialogContext.deleteCtx('skillappointmentrebookrfcconfirm-followup');

            dialogContext.pushSequence(SEQ_APPTBOOKING_NAME);
            return;
        }
    });
    convoClient.registerIntents({
        actions: [
            'skill.appointment.rebook.rfc.confirm.confirmation.no',
            'skill.appointment.rebook.rfc.confirm.confirmation.notable'
        ],
        sequenceName: SEQ_APPTBOOKING_NAME,
        waitForReply: false,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'rebookIntentReceived': '1',
                'rebookIntentConfirmed': '0',
                'rebookIntentDeclined': '1'
            });
            dialogContext.deleteCtx('skillappointmentrebookrfcconfirm-followup');

            dialogContext.popSequence(SEQ_APPTBOOKING_NAME);
            return;
        }
    });

    convoClient.registerIntent(new Intent({
        action: 'common.scheduletest',
        sequenceName: SEQ_APPTBOOKING_NAME,
        handler: async (dialogContext) => {
            dialogContext.setFulfillmentText();
            
            // Calculate appointment start and end datetimes (end = +1hr from start)
            const appointment_type = 'Cool Meeting';
            const dateTimeStart = new Date(Date.parse(dialogContext.inparams.date.split('T')[0] + 'T' + dialogContext.inparams.time.split('T')[1].split('-')[0] + timeZoneOffset));
            const dateTimeEnd = new Date(new Date(dateTimeStart).setHours(dateTimeStart.getHours() + 1));
            const appointmentTimeString = dateTimeStart.toLocaleString(
                'en-US',
                { month: 'long', day: 'numeric', hour: 'numeric', timeZone: timeZone }
            );
                // Check the availability of the time, and make an appointment if there is time on the calendar
            return dialogContext.connectorManager.get(GoogleCalendarConnector.name()).createCalendarEvent(dateTimeStart, dateTimeEnd, appointment_type).then(() => {
                dialogContext.setFulfillmentText(`Ok, let me see if we can fit you in. ${appointmentTimeString} is fine!`);
            }).catch((err) => {
                console.log('Caught Error: '+err);
                dialogContext.setFulfillmentText(`I'm sorry, there are no slots available for ${appointmentTimeString}.`);
            });
        }
    }));    

}

module.exports = {registerModuleAppointmentBooking};