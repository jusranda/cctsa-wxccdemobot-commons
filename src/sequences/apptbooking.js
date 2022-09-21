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
const { RedmineConnector } = require("../connectors/googlecalendar");
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
 * @param {SequenceManager} sequenceManager The sequencer manager.
 * @param {IntentManager} intentManager     The intent manager.
 */
 function registerModuleAppointmentBooking(sequenceManager,intentManager) {
    // Register Sequence.
    sequenceManager.registerSequence(new Sequence({
        name: SEQ_APPTBOOKING_NAME, // Sequence name, also used for Dialogflow context name.
        activity: 'booking your appointment', // Activity description, used in course correction.
        identityRequired: false,
        authRequired: false,
        breakIntents: [ // Intents that break from the core flow before attempting sequence navigation.
            { action: 'skill.appointment.rebook.rfc.confirm', trigger: '1' },
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

            if (context.parameters.triagePassOrFail !== '') {
                if (context.parameters.triagePassOrFail === 'pass') {
                    let event = dialogContext.respondWithEvent('CovidScreenTriageNumber');
                    return;
                } else {
                    if (context.parameters.rebookOffered === '0') {
                        let event = dialogContext.respondWithEvent('CovidScreenRebookAppt');
                        return;
                    }

                    if (context.parameters.rebookAccepted === '1') {
                        let event = dialogContext.respondWithEvent('EscalateToAgent', dialogContext.params.lastFulfillmentText);
                        return;
                    } else {
                        dialogContext.resetOfferedAgentFlags();
                        console.log('Calling popSequenceAndNavigate');
                        dialogContext.popSequenceAndNavigate(SEQ_APPTBOOKING_NAME);
                        return;
                    }
                }
            }

            if (context.parameters.accepted === '0' && context.parameters.declined === '0') {
                let event = dialogContext.respondWithEvent('CovidScreenRequired');
                return;
            }
    
            if (context.parameters.declined === '1') {
                let event = dialogContext.respondWithEvent('CovidScreenDeclined');
                return;
            }
    
            if (context.parameters.accepted === '1') {
                if (context.parameters.q1acomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ1A');
                    return;
                }
                if (context.parameters.q1brequired === '1' && context.parameters.q1bcomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ1B');
                    return;
                }

                if (context.parameters.q2complete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ2');
                    return;
                }

                if (context.parameters.q3complete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ3');
                    return;
                }

                if (context.parameters.q4acomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ4A');
                    return;
                }
                if (context.parameters.q4brequired === '1' && context.parameters.q4bcomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ4B');
                    return;
                }

                if (context.parameters.q5acomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ5A');
                    return;
                }
                if (context.parameters.q5brequired === '1' && context.parameters.q5bcomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ5B');
                    return;
                }

                if (context.parameters.q6acomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ6A');
                    return;
                }

                if (context.parameters.q6brequired === '1' && context.parameters.q6bcomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ6B');
                    return;
                }

                let event = dialogContext.respondWithEvent('CovidScreenComplete');
                return;
            }
    
            console.log(fmtLog('authentication.navigate', 'action: '+dialogContext.currentAction+', lastFulfillmentText: '+dialogContext.params.lastFulfillmentText, dialogContext));
            dialogContext.respondWithText();
            return;
        }
    }));

    function summarizeBooking (dialogContext) {
        let context = dialogContext.getOrCreateCtx(SEQ_APPTBOOKING_NAME);

        let triage = {};
        let symptoms = [];

        let passOrFail = 'pass';

        triage.diagnosedWithCovid = context.parameters.q1aresult;
        if (triage.diagnosedWithCovid === 'true') {
            passOrFail = 'fail';
            triage.diagnosedWithCovidDate = context.parameters.q1bresult;
        }

        triage.livesWithCovid = context.parameters.q2result;

        if (context.parameters.q3result === 'true') {
            passOrFail = 'fail';
            symptoms.push('fever');
        }

        if (context.parameters.q4aresult === 'true') {
            passOrFail = 'fail';
            symptoms = symptoms.concat(context.parameters.q4bresult);
        }
        if (context.parameters.q5aresult === 'true') {
            passOrFail = 'fail';
            symptoms = symptoms.concat(context.parameters.q5bresult);
        }

        if (context.parameters.q6aresult === 'true') {
            passOrFail = 'fail';
            triage.countryName = context.parameters.q6bresult;
        }
        triage.symptoms = symptoms;

        triage.passOrFail = passOrFail;

        return triage;
    }
    
    // Register Intent Handlers.
    intentManager.registerIntent(new Intent({
        action: 'skill.appointment.rebook.rfc.confirm',
        sequenceName: SEQ_APPTBOOKING_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            return;
        }
    }));
    intentManager.registerIntents({
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
            return;
        }
    });
    intentManager.registerIntents({
        actions: [
            'skill.covidscreen.required.confirmation.no',
            'skill.covidscreen.required.confirmation.notable'
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
            return;
        }
    });

}

module.exports = {registerModuleAppointmentBooking};