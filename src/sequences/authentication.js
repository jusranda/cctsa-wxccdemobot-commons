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

const { Intent, IntentManager, Sequence, SequenceManager } = require("codingforconvos");

// Define Sequence Name Constants.
const SEQ_AUTH_NAME = 'authentication';

//////////////////////////////////////////////////
// Create and register Authentication Sequence. //
//////////////////////////////////////////////////

const SEQ_AUTH = new Sequence({
    name: SEQ_AUTH_NAME, // Sequence name, also used for Dialogflow context name.
    activity: 'verifying your identity', // Activity description, used in course correction.
    authRequired: false,
    breakIntents: [ // Intents that break from the core flow before attempting sequence navigation.
        { action: 'auth.sendotp', trigger: '1' },
        { action: 'auth.sendotp.fallback', trigger: '1' },
        { action: 'auth.getaccount', trigger: '1' },
        { action: 'auth.getaccount.fallback', trigger: '1' }
    ],
    params: {
        validationComplete: '0',
        validationStatus: '0',
        validationReceived: '0',
        validatedBy: '',
        generatedOtp: '',
        advisedAuthRequired: '0',
        receivedAccountNumber: '',
        accountNumberFound: '0',
        accountNumberNotFound: '0',
        phoneNumberFound: '',
        phoneNumberNotFound: '',
        usernameFound: '',
        usernameNotFound: '',
        receivedOtp: ''
    },
    createCase: (contextManager, agent, ctxSessionProps) => { // Create a case.
        let newCase = {
            subject: 'Failed to identify navigate conversation.',
            description: 'Something went wrong.',
            note: 'Case created.'
        };
        return newCase;
    },
    navigate: (dialogContext) => { // Navigate the sequence forward.
        let context = dialogContext.getOrCreateCtx(SEQ_AUTH_NAME);

        if (context.parameters.advisedAuthRequired === '0') {
            console.log('Sending Event AuthRequired');
            let event = dialogContext.respondWithEvent('AuthRequired', dialogContext.params.lastFulfillmentText);
            return;
        }

        if (dialogContext.params.customerIdentified === '1') {
            if (context.parameters.validationComplete === '0' && context.parameters.validationReceived === '1' && context.parameters.validationStatus === '1') {
                console.log('Sending Event AuthOtpSuccess');
                let event = dialogContext.respondWithEvent('AuthOtpSuccess', dialogContext.params.lastFulfillmentText);
                return;
            }

            if (context.parameters.validationComplete === '0' && context.parameters.validationReceived === '1' && context.parameters.validationStatus === '2') {
                console.log('Sending Event AuthOtpFailure');
                let event = dialogContext.respondWithEvent('AuthOtpFailure', dialogContext.params.lastFulfillmentText);
                return;
            }

            if (context.parameters.validationComplete === '0' && context.parameters.validationReceived === '0') {
                console.log('Sending Event AuthSendOtp');
                let event = dialogContext.respondWithEvent('AuthSendOtp', dialogContext.params.lastFulfillmentText);
                return;
            }
        }

        if (context.parameters.validationComplete === '1') {
            if (context.parameters.validationStatus === '2') {
                if (dialogContext.params.offeredAgent === '0') {
                    let event = dialogContext.respondWithEvent('OfferSpeakToAgent', dialogContext.params.lastFulfillmentText);
                    return;
                }
                if (dialogContext.params.offeredAgentAccepted === '1') {
                    let event = dialogContext.respondWithEvent('EscalateToAgent', dialogContext.params.lastFulfillmentText);
                    return;
                }
                if (dialogContext.params.offeredAgentDeclined === '1') {
                    console.log('Calling popSequenceAndNavigate');
                    dialogContext.deleteCtx('skillresetpasswordsms-followup'); // TODO: I think I can remove these, but make sure.
                    dialogContext.popSequenceAndNavigate(SEQ_AUTH_NAME);
                    return;
                }
            }

            console.log('Calling popSequenceAndNavigate');
            dialogContext.deleteCtx('skillresetpasswordsms-followup'); // TODO: I think I can remove these, but make sure.
            dialogContext.popSequenceAndNavigate(SEQ_AUTH_NAME);
        }

        if (dialogContext.params.customerIdentified === '0') {
            if (context.parameters.receivedAccountNumber !== '' && context.parameters.accountNumberNotFound === '1') {
                console.log('Sending Event AuthInvalidAccount');
                let event = dialogContext.respondWithEvent('AuthInvalidAccount', dialogContext.params.lastFulfillmentText);
                return;
            }
            
            console.log('Sending Event AuthGetAccount');
            let event = dialogContext.respondWithEvent('AuthGetAccount', dialogContext.params.lastFulfillmentText);
            return;
        }

        console.log('action: '+dialogContext.currentAction+', lastFulfillmentText: '+dialogContext.params.lastFulfillmentText);
        dialogContext.respondWithText();
        return;
    }
});

/**
 * Registers the sequences and intents for the welcome module.
 * 
 * @param {SequenceManager} sequenceManager The sequencer manager.
 * @param {IntentManager} intentManager     The intent manager.
 */
function registerModuleAuthentication(sequenceManager,intentManager) {
    sequenceManager.registerSequence(SEQ_AUTH);

    //intentManager.registerIntent(INTENT_WELCOME);
    //intentManager.registerIntent(INTENT_SAY_INTRO);
    //intentManager.registerIntent(INTENT_ASKWELLBEING);
    //intentManager.registerIntent(INTENT_ASKWELLBEING_POSTIVE);
    //intentManager.registerIntent(INTENT_ASKWELLBEING_NEGATIVE);
}

module.exports = {registerModuleAuthentication};