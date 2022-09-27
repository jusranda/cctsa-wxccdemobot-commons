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

const CTX_RFC_NAME = 'reasonforcontact';

///////////////////////////////////////////////////////////////
// Register Reason for Contact Sequence and Intent Handlers. //
///////////////////////////////////////////////////////////////
    
/**
 * Registers the sequences and intents for the reason for contact module.
 * 
 * @param {ConvoClient} convoClient The convo client.
 */
 function registerModuleReasonForContact(convoClient) {
    // Register Sequence.
    convoClient.registerSequence(new Sequence({
        name: CTX_RFC_NAME, // Sequence name, also used for Dialogflow context name.
        activity: 'figuring out how I can help you', // Activity description, used in course correction.
        identityRequired: false,
        authRequired: false,
        breakIntents: [ // Intents that break from the core flow before attempting sequence navigation.
            { action: 'skill.reasonforcontact', trigger: '1' },
            //{ action: 'skill.reasonforcontact.fallback', trigger: '1' }
        ],
        params: {
            askedReasonForCalling: '0'
        },
        navigate: (dialogContext) => { // Navigate the sequence forward.
            //let context = dialogContext.getOrCreateCtx(CTX_RFC_NAME);
    
            if (dialogContext.currentAction === 'skill.resetpassword') {
                let authEvent = dialogContext.respondWithEvent('AuthSendOtp', dialogContext.params.lastFulfillmentText);
                return;
            }
            
            if (dialogContext.currentAction === 'skill.covidscreen') {
                let authEvent = dialogContext.respondWithEvent('CovidScreenRequired', dialogContext.params.lastFulfillmentText);
                return;
            }
            
            if (dialogContext.params.sayGoodbye === '1') {
                if (dialogContext.params.saidGoodbye === '0') {
                    let authEvent = dialogContext.respondWithEvent('SayGoodbye', dialogContext.params.lastFulfillmentText);
                    return;
                }
    
                let authEvent = dialogContext.respondWithEvent('Handled', dialogContext.params.lastFulfillmentText);
                return;
            }
    
            console.log(fmtLog('reasonforcontact.navigate', 'action: '+dialogContext.currentAction+', lastFulfillmentText: '+dialogContext.params.lastFulfillmentText, dialogContext));
            let askReasonForContactEvent = dialogContext.respondWithEvent('AskReasonForContact', dialogContext.params.lastFulfillmentText);
            return;
        }
    }));



    // Register Intent Handlers.
    convoClient.registerIntent(new Intent({
        action: 'skill.reasonforcontact',
        sequenceName: CTX_RFC_NAME,
        handler: (dialogContext) => {
            
            if (dialogContext.params.triggeredSkill === '1') {
                let updatedText = dialogContext.dialogflowAgent.consoleMessages[0].text
                    .replace(' can ', ' else can ')
                    .replace(' may ', ' else may ')
                    ;
                    console.log('Updated reason for contact: '+updatedText);
                    dialogContext.dialogflowAgent.consoleMessages[0].text = updatedText;
            }
    
            if (dialogContext.params.advisoryNotice !== '' && dialogContext.params.triggeredSkill === '0') {
                dialogContext.dialogflowAgent.consoleMessages[0].text = dialogContext.params.advisoryNotice + '  ' + dialogContext.dialogflowAgent.consoleMessages[0].text;
            }
            
            dialogContext.setSessionParam('triggeredSkill', '1');
            dialogContext.appendFulfillmentText();
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'skill.reasonforcontact.fallback',
        sequenceName: CTX_RFC_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'skill.reasonforcontact.wellbeing.positive',
        sequenceName: CTX_RFC_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            if (parseInt(dialogContext.params.helpCounter) >= 1) {
                dialogContext.setSessionParam('sayGoodbye', '1');
                return;
            }
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'skill.resetpassword',
        sequenceName: CTX_RFC_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.pushSequence('passwordreset');
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'skill.covidscreen',
        sequenceName: CTX_RFC_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.pushSequence('covidscreen');
            return;
        }
    }));
}

module.exports = {registerModuleReasonForContact};