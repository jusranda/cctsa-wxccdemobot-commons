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
const SEQ_WELCOME_NAME = 'welcome';

//////////////////////////////////
// Create the Welcome Sequence. //
//////////////////////////////////

const SEQ_WELCOME = new Sequence({
    name: SEQ_WELCOME_NAME, // Sequence name, also used for Dialogflow context name.
    activity: 'greeting each other', // Activity description, used in course correction.
    authRequired: false,
    breakIntents: [ // Intents that break from the core flow before attempting sequence navigation.
        { action: 'welcome.ask.wellbeing', trigger: '1' }
    ],
    params: {
        saidFirstWelcome: '0',
        saidIntro: '0',
        askedWellbeing: '0',
        confirmedWellbeing: '0',
        confirmedWellbeingPositive: '0',
        confirmedWellbeingNegative: '0'
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
        let context = dialogContext.getOrCreateCtx(SEQ_WELCOME_NAME);

        if (context.parameters.saidFirstWelcome === '0') {
            if (context.parameters.saidIntro === '0') {
                let greetingEvent = dialogContext.respondWithEvent('SayIntro', dialogContext.params.lastFulfillmentText);
                return;
            }

            if (context.parameters.askedWellbeing === '0') {
                let askWellbeingEvent = dialogContext.respondWithEvent('AskWellbeing', dialogContext.params.lastFulfillmentText);
                return;
            }

            dialogContext.setParam(context, 'saidFirstWelcome', '1');
        }

        if (context.parameters.confirmedWellbeing === '1') {
            dialogContext.popSequence (SEQ_WELCOME_NAME);
            let askReasonForContactEvent = dialogContext.respondWithEvent('AskReasonForContact');
            return;
        }

        // Updated to reward the sequence stack to handle post-first-time greetings once ready.
        dialogContext.setFulfillmentText();
        console.log('action: '+dialogContext.currentAction+', lastFulfillmentText: '+dialogContext.params.lastFulfillmentText);
        dialogContext.respondWithText();
        return;
    }
});

///////////////////////////////////////
// Register Welcome Intent Handlers. //
///////////////////////////////////////

const INTENT_WELCOME = new Intent({
    action: 'input.welcome',
    sequenceName: SEQ_WELCOME_NAME,
    handler: (dialogContext) => {
        dialogContext.setFulfillmentText();
        return;
    }
});
const INTENT_SAY_INTRO = new Intent({
    action: 'welcome.say.intro',
    sequenceName: SEQ_WELCOME_NAME,
    handler: (dialogContext) => {
        dialogContext.appendFulfillmentText();
        dialogContext.setCurrentParam('saidIntro', '1');
        return;
    }
});
const INTENT_ASKWELLBEING = new Intent({
    action: 'welcome.ask.wellbeing',
    sequenceName: SEQ_WELCOME_NAME,
    handler: (dialogContext) => {
        dialogContext.appendFulfillmentText();
        dialogContext.setCurrentParam ('askedWellbeing', '1');
        return;
    }
});
const INTENT_ASKWELLBEING_POSTIVE = new Intent({
    action: 'welcome.ask.wellbeing.wellbeing.positive',
    sequenceName: SEQ_WELCOME_NAME,
    handler: (dialogContext) => {
        dialogContext.setFulfillmentText();
        dialogContext.setCurrentParams ({
            'saidFirstWelcome': '1',
            'confirmedWellbeing': '1',
            'confirmedWellbeingPositive': '1'
        });
        return;
    }
});
const INTENT_ASKWELLBEING_NEGATIVE = new Intent({
    action: 'welcome.ask.wellbeing.wellbeing.negative',
    sequenceName: SEQ_WELCOME_NAME,
    handler: (dialogContext) => {
        dialogContext.setFulfillmentText();
        dialogContext.setCurrentParams ({
            'saidFirstWelcome': '1',
            'confirmedWellbeing': '1',
            'confirmedWellbeingNegative': '1'
        });
        return;
    }
});

/**
 * Registers the sequences and intents for the welcome module.
 * 
 * @param {SequenceManager} sequenceManager The sequencer manager.
 * @param {IntentManager} intentManager     The intent manager.
 */
function registerModuleWelcome(sequenceManager,intentManager) {
    sequenceManager.registerSequence(SEQ_WELCOME);

    intentManager.registerIntent(INTENT_WELCOME);
    intentManager.registerIntent(INTENT_SAY_INTRO);
    intentManager.registerIntent(INTENT_ASKWELLBEING);
    intentManager.registerIntent(INTENT_ASKWELLBEING_POSTIVE);
    intentManager.registerIntent(INTENT_ASKWELLBEING_NEGATIVE);
}

module.exports = {registerModuleWelcome};