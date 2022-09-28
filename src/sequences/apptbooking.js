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

const { Intent, IntentManager, Sequence, SequenceManager, fmtLog } = require("codingforconvos");
const { RedmineConnector } = require("../connectors/redmine");
const { GoogleCalendarConnector } = require("../connectors/googlecalendar");
const { injectJdsEvent } = require("../common");

// Define Sequence Name Constants.
const SEQ_APPTBOOKING_NAME = 'apptbooking';

async function injectAppointmentBookingSuccessEvent(dialogContext) {
    injectJdsEvent(dialogContext, 'Covid Screen Accepted', {
        caseUrl: 'http://cctsa-redmine.outofservice.org/issues/'+dialogContext.ctxparams.triageNumber,
        caseReason: 'Record of accepted screening results'
    });
}

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
        breakIntents: [ // Intents that break from the core flow before attempting sequence navigation.
            { action: 'skill.appointment.rebook.rfc.confirm', trigger: '1' }
        ],
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

}

module.exports = {registerModuleAppointmentBooking};