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

// Define Sequence Name Constants.
const SEQ_COMMON_NAME = 'common';



///////////////////////////////////////////////////
// Register Common Sequence and Intent Handlers. //
///////////////////////////////////////////////////

/**
 * Registers the sequences and intents for the authentication module.
 * 
 * @param {SequenceManager} sequenceManager The sequencer manager.
 * @param {IntentManager} intentManager     The intent manager.
 */
function registerModuleCommon(sequenceManager,intentManager) {

    // Register Sequence.
    sequenceManager.registerSequence(new Sequence({
        name: SEQ_COMMON_NAME, // Sequence name, also used for Dialogflow context name.
        activity: 'talking', // Activity description, used in course correction.
        authRequired: false,
        breakIntents: [ // Intents that break from the core flow before attempting sequence navigation.
            { action: 'common.offer.agent', trigger: '1' },
            { action: 'common.goodbye', trigger: '1' },
            { action: 'fallback', trigger: '1' },
            { action: 'Handled', trigger: '1' },
            { action: 'GetExpert', trigger: '1' },
            { action: 'common.speaktoagent', trigger: '1' },
            { action: 'bypass.nomoreproblems', trigger: '1' },
            { action: 'common.tickettransfer', trigger: '1' },
            { action: 'common.scheduletest', trigger: '1' }
        ],
        params: {
            none: '0'
        },
        navigate: (dialogContext) => { // Navigate the sequence forward.
            dialogContext.setFulfillmentText();
            console.log('action: '+dialogContext.currentAction+', lastFulfillmentText: '+dialogContext.params.lastFulfillmentText);
            dialogContext.respondWithText();
            return;
        }
    }));
    


    // Register Intent Handlers.
    intentManager.registerIntent(new Intent({
        action: 'GetExpert',
        sequenceName: SEQ_COMMON_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            let contextOutput = dialogContext.getOrCreateCtx('escalation-output');
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'Handled',
        sequenceName: SEQ_COMMON_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'input.unknown',
        sequenceName: SEQ_COMMON_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentCourseCorrect();
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'fallback',
        sequenceName: SEQ_COMMON_NAME,
        handler: (dialogContext) => {
            //dialogContext.setFulfillmentCourseCorrect();
            dialogContext.setFulfillmentText();
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'common.goodbye',
        sequenceName: SEQ_COMMON_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            dialogContext.setSessionParam('saidGoodbye', '1');
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'common.offer.agent',
        sequenceName: SEQ_COMMON_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            dialogContext.setSessionParam('offeredAgent', '1');
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'common.offer.agent.confirmation.yes',
        sequenceName: SEQ_COMMON_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setSessionParam('offeredAgentAccepted', '1');
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'common.offer.agent.confirmation.no',
        sequenceName: SEQ_COMMON_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setSessionParam('offeredAgentDeclined', '1');
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'common.speaktoagent',
        sequenceName: SEQ_COMMON_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            let event = dialogContext.respondWithEvent('EscalateToAgent', dialogContext.params.lastFulfillmentText);
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'bypass.nomoreproblems',
        sequenceName: SEQ_COMMON_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            let event = dialogContext.respondWithEvent('Handled', dialogContext.params.lastFulfillmentText);
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'common.tickettransfer',
        sequenceName: SEQ_COMMON_NAME,
        handler: async (dialogContext) => {
            let responseMessage = 'I\'ve created ticket '+dialogContext.params.ticketNumber+'.  Would you like me to connect you with an agent now?';
            dialogContext.setSessionParam('offeredAgent', '1');
            dialogContext.appendFulfillmentText(responseMessage);
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'common.tickettransfer.confirmation.yes',
        sequenceName: SEQ_COMMON_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setSessionParam('offeredAgentAccepted', '1');
            return;
        }
    }));
    
    const SEQ_ANYTHINGELSE_NAME = 'anythingelse';

    // Register Sequence.
    sequenceManager.registerSequence(new Sequence({
        name: SEQ_ANYTHINGELSE_NAME, // Sequence name, also used for Dialogflow context name.
        activity: 'checking if there\'s anything else I can do to help', // Activity description, used in course correction.
        authRequired: false,
        breakIntents: [ // Intents that break from the core flow before attempting sequence navigation.
            { action: 'common.offer.anythingelse', trigger: '1' },
            { action: 'common.goodbye', trigger: '1' },
            { action: 'Handled', trigger: '1' },
            { action: 'GetExpert', trigger: '1' }
        ],
        params: {
            offeredHelp: '0',
            confirmedHelp: '0',
            helpRequired: '0',
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
            dialogContext.setFulfillmentText();
            console.log('action: '+dialogContext.currentAction+', lastFulfillmentText: '+dialogContext.params.lastFulfillmentText);
            dialogContext.respondWithText();
            return;
        }
    }));


}

module.exports = {registerModuleCommon};