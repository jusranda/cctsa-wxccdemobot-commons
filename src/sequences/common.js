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

const { Intent, Sequence } = require("codingforconvos");

// Define Sequence Name Constants.
const SEQ_COMMON_NAME = 'common';



///////////////////////////////////////////////////
// Register Common Sequence and Intent Handlers. //
///////////////////////////////////////////////////

/**
 * Registers the sequences and intents for the authentication module.
 * 
 * @param {ConvoClient} convoClient The convo client.
 */
function registerModuleCommon(convoClient) {

    // Register Sequence.
    convoClient.registerSequence(new Sequence({
        name: SEQ_COMMON_NAME, // Sequence name, also used for Dialogflow context name.
        activity: 'talking', // Activity description, used in course correction.
        identityRequired: false,
        authRequired: false,
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
    convoClient.registerIntent(new Intent({
        action: 'GetExpert',
        sequenceName: SEQ_COMMON_NAME,
        waitForReply: true,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            let contextOutput = dialogContext.getOrCreateCtx('escalation-output');
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'Handled',
        sequenceName: SEQ_COMMON_NAME,
        waitForReply: true,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'input.unknown',
        sequenceName: SEQ_COMMON_NAME,
        waitForReply: false,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentCourseCorrect();
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'fallback',
        sequenceName: SEQ_COMMON_NAME,
        waitForReply: true,
        handler: (dialogContext) => {
            //dialogContext.setFulfillmentCourseCorrect();
            dialogContext.setFulfillmentText();
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'common.goodbye',
        sequenceName: SEQ_COMMON_NAME,
        waitForReply: true,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            dialogContext.setSessionParam('saidGoodbye', '1');
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'common.offer.agent',
        sequenceName: SEQ_COMMON_NAME,
        waitForReply: true,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            dialogContext.setSessionParam('offeredAgent', '1');
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'common.offer.agent.confirmation.yes',
        sequenceName: SEQ_COMMON_NAME,
        waitForReply: false,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setSessionParam('offeredAgentAccepted', '1');
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'common.offer.agent.confirmation.no',
        waitForReply: false,
        sequenceName: SEQ_COMMON_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setSessionParam('offeredAgentDeclined', '1');
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'common.speaktoagent',
        sequenceName: SEQ_COMMON_NAME,
        waitForReply: true,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            let event = dialogContext.respondWithEvent('EscalateToAgent', dialogContext.params.lastFulfillmentText);
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'bypass.nomoreproblems',
        sequenceName: SEQ_COMMON_NAME,
        waitForReply: true,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            let event = dialogContext.respondWithEvent('Handled', dialogContext.params.lastFulfillmentText);
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'common.tickettransfer',
        sequenceName: SEQ_COMMON_NAME,
        waitForReply: true,
        handler: async (dialogContext) => {
            let responseMessage = 'I\'ve created ticket '+dialogContext.params.ticketNumber+'.  Would you like me to connect you with an agent now?';
            dialogContext.setSessionParam('offeredAgent', '1');
            dialogContext.appendFulfillmentText(responseMessage);
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'common.tickettransfer.confirmation.yes',
        sequenceName: SEQ_COMMON_NAME,
        waitForReply: false,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setSessionParam('offeredAgentAccepted', '1');
            return;
        }
    }));
    
    const SEQ_ANYTHINGELSE_NAME = 'anythingelse';

    // Register Sequence.
    convoClient.registerSequence(new Sequence({
        name: SEQ_ANYTHINGELSE_NAME, // Sequence name, also used for Dialogflow context name.
        activity: 'checking if there\'s anything else I can do to help', // Activity description, used in course correction.
        identityRequired: false,
        authRequired: false,
        params: {
            offeredHelp: '0',
            confirmedHelp: '0',
            helpRequired: '0',
        },
        navigate: (dialogContext) => { // Navigate the sequence forward.
            dialogContext.setFulfillmentText();
            console.log('action: '+dialogContext.currentAction+', lastFulfillmentText: '+dialogContext.params.lastFulfillmentText);
            dialogContext.respondWithText();
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'common.offer.anythingelse',
        sequenceName: SEQ_ANYTHINGELSE_NAME,
        waitForReply: true,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            console.log('action: '+dialogContext.currentAction+', lastFulfillmentText: '+dialogContext.params.lastFulfillmentText);
            dialogContext.respondWithText();
            return;
        }
    }));
}

module.exports = {registerModuleCommon};