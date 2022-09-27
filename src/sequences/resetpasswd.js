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
const { RedmineConnector } = require("../connectors/redmine");
const { WebexConnectConnector } = require("../connectors/webexconnect");
const { injectJdsEvent,createRedmineIssue } = require("../common");

// Define Sequence Name Constants.
const SEQ_PWRESET_NAME = 'passwordreset';

const CHARS_NUMBERS = "0123456789";
const CHARS_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHARS_LOWER = "abcdefghijklmnopqrstuvwxyz";
const CHARS_SPECIAL = ".@()-_";

/**
 * Utility function to generate a basic password with upper/lower case letters, 
 * numbers, and special characters to satify Redmine's password policy.  This
 * function is not suitable for production/secure passwords.
 * 
 * @param {number} passwordLength   The length of the password.
 * @returns the generated password.
 */
function generatePassword(passwordLength=8) {
    let allChars = CHARS_NUMBERS + CHARS_UPPER + CHARS_LOWER + CHARS_SPECIAL;
    let randPasswordArray = Array(passwordLength);
    randPasswordArray[0] = CHARS_NUMBERS;
    randPasswordArray[1] = CHARS_UPPER;
    randPasswordArray[2] = CHARS_LOWER;
    randPasswordArray[3] = CHARS_SPECIAL;
    randPasswordArray = randPasswordArray.fill(allChars, 4);
    return shuffleArray(randPasswordArray.map(function(x) { return x[Math.floor(Math.random() * x.length)]; })).join('');
}
    
// Shuffle an array.
// array - The array.
function shuffleArray(array) {
    for (let x = array.length - 1; x > 0; x--) {
        let y = Math.floor(Math.random() * (x + 1));
        let temp = array[x];
        array[x] = array[y];
        array[y] = temp;
    }
    return array;
}

///////////////////////////////////////////////////////////
// Register Password Reset Sequence and Intent Handlers. //
///////////////////////////////////////////////////////////

async function resetAndSendPassword(dialogContext) {
    if (dialogContext.params.secondChannel === 'sms') {
        resetAndSendPasswordBySms(dialogContext);
    } else {
        resetAndSendPasswordByEmail(dialogContext);
    }
}

async function resetAndSendPasswordBySms(dialogContext) {
    const tempPw = generatePassword();
    dialogContext.connectorManager.get(RedmineConnector.name()).resetRedmineUserPassword(dialogContext.params.redmineUserId,tempPw);
    dialogContext.connectorManager.get(WebexConnectConnector.name()).sendPwresetLinkBySms(
        dialogContext.params.sessionId,
        dialogContext.params.smsNumber,
        dialogContext.params.customerFirstName,
        dialogContext.params.companyName,
        dialogContext.params.interactionSource,
        tempPw
    );
}

async function resetAndSendPasswordByEmail(dialogContext) {
    const tempPw = generatePassword();
    dialogContext.connectorManager.get(RedmineConnector.name()).resetRedmineUserPassword(dialogContext.params.redmineUserId,tempPw);
    dialogContext.connectorManager.get(WebexConnectConnector.name()).sendPwresetLinkByEmail(
        dialogContext.params.sessionId,
        dialogContext.params.mail,
        dialogContext.params.customerFirstName,
        dialogContext.params.companyName,
        dialogContext.params.interactionSource,
        tempPw
    );
}

async function injectPasswdResetSuccessEvent(dialogContext) {
    const redmineNewIssue = await createRedmineIssue(dialogContext);
    
    injectJdsEvent(dialogContext, 'Password Change Success', {
        caseUrl: 'http://cctsa-redmine.outofservice.org/issues/'+redmineNewIssue.id,
        caseReason: 'Record of success'
    });
}

async function injectPasswdResetFailureEvent(dialogContext) {
    const redmineNewIssue = await createRedmineIssue(dialogContext);
    
    injectJdsEvent(dialogContext, 'Password Change Failure', {
        caseUrl: 'http://cctsa-redmine.outofservice.org/issues/'+redmineNewIssue.id,
        caseReason: 'Escalate failed password change'
    });
}

/**
 * Registers the sequences and intents for the reset password module.
 * 
 * @param {ConvoClient} convoClient The convo client.
 */
 function registerModuleResetPassword(convoClient) {
    // Register Sequence.
    convoClient.registerSequence(new Sequence({
        name: SEQ_PWRESET_NAME, // Sequence name, also used for Dialogflow context name.
        activity: 'resetting your password', // Activity description, used in course correction.
        identityRequired: false,
        authRequired: true,
        breakIntents: [ // Intents that break from the core flow before attempting sequence navigation.
            { action: 'skill.resetpassword.sms', trigger: '1' },
            { action: 'skill.resetpassword.email', trigger: '1' },
            { action: 'skill.resetpassword.loginsuccess', trigger: '1' },
        ],
        params: {
            executeStatus: '-1',
            passwordLinkSent: '0',
            passwordLinkReceived: '0',
            passwordLinkNotReceived: '0',
            confirmedWorking: '0',
            confirmedNotWorking: '0',
            notifiedSuccess: '0',
            notifiedFailure: '0'
        },
        navigate: (dialogContext) => { // Navigate the sequence forward.
            let context = dialogContext.getOrCreateCtx(SEQ_PWRESET_NAME);
    
            if (context.parameters.notifiedSuccess === '1') {
                console.log('Calling popSequenceAndNavigate');
                dialogContext.popSequenceAndNavigate(SEQ_PWRESET_NAME);
                return;
            }
    
            if (context.parameters.notifiedFailure === '1') {
                if (dialogContext.params.offeredAgent === '0') {
                    let event = dialogContext.respondWithEvent('TicketTransfer', dialogContext.params.lastFulfillmentText);
                    return;
                }
                if (dialogContext.params.offeredAgentAccepted === '1') {
                    let event = dialogContext.respondWithEvent('EscalateToAgent', dialogContext.params.lastFulfillmentText);
                    return;
                }
                if (dialogContext.params.offeredAgentDeclined === '1') {
                    dialogContext.resetOfferedAgentFlags();
                    console.log('Calling popSequenceAndNavigate');
                    dialogContext.popSequenceAndNavigate(SEQ_PWRESET_NAME);
                    return;
                }
            }
    
            if (context.parameters.passwordLinkSent === '0') {
                if (dialogContext.params.secondChannel === 'sms') {
                    console.log('Responding with event PasswordResetSms');
                    let event = dialogContext.respondWithEvent('PasswordResetSms', dialogContext.params.lastFulfillmentText);
                    return;
                } else {
                    console.log('Responding with event PasswordResetEmail');
                    let event = dialogContext.respondWithEvent('PasswordResetEmail', dialogContext.params.lastFulfillmentText);
                    return;
                }
            }
    
            if (context.parameters.passwordLinkReceived === '1' && context.parameters.confirmedWorking === '0' && context.parameters.confirmedNotWorking === '0') {
                let event = dialogContext.respondWithEvent('ResetPasswordLoginSuccess', dialogContext.params.lastFulfillmentText);
                return;
            }
    
            if (context.parameters.confirmedWorking === '1' && context.parameters.notifiedSuccess === '0') {
                let event = dialogContext.respondWithEvent('ResetPasswordSuccess', dialogContext.params.lastFulfillmentText);
                return;
            }
    
            if ((context.parameters.passwordLinkNotReceived === '1' || context.parameters.confirmedNotWorking === '1') && context.parameters.notifiedFailure === '0') {
                let event = dialogContext.respondWithEvent('ResetPasswordFailure', dialogContext.params.lastFulfillmentText);
                return;
            }
    
            // Uncomment once ready to implement here.
            //completeAndNavigate(agent, ctxSessionProps, CTX_AUTH);
            dialogContext.setFulfillmentText();
            console.log('action: '+dialogContext.currentAction+', lastFulfillmentText: '+dialogContext.params.lastFulfillmentText);
            dialogContext.respondWithText();
            return;
        }
    }));



    // Register a case creation template for the sequence.
    RedmineConnector.registerCaseTemplate(SEQ_PWRESET_NAME, (dialogContext) => {
        let context = dialogContext.getOrCreateCtx(SEQ_PWRESET_NAME);

        let subject = 'Password Reset ';
        if (context.parameters.executeStatus === '-1') {
            subject = subject + 'Attempt Incomplete';
        }
        if (context.parameters.executeStatus === '0') {
            subject = subject + 'Success';
        }
        if (context.parameters.executeStatus === '1') {
            subject = subject + 'Failure';
        }
        subject = subject + ' for '+dialogContext.params.customerFirstName+' '+dialogContext.params.customerLastName;

        let description = dialogContext.params.customerFirstName+' attempted a password reset.';
        if (context.parameters.passwordLinkSent === '1') {
            description = description + '  I sent the SMS password reset link.';
        }

        if (context.parameters.passwordLinkReceived === '1') {
            description = description + '  '+dialogContext.params.customerFirstName+' confirmed receiveing the reset link,';
        }

        if (context.parameters.passwordLinkNotReceived === '1') {
            description = description + '  '+dialogContext.params.customerFirstName+' never received the reset link.';
        }

        if (context.parameters.confirmedWorking === '1') {
            description = description + ' and was able to login successfully.';
        }

        if (context.parameters.passwordLinkNotReceived === '0' && context.parameters.confirmedNotWorking === '1') {
            description = description + ' but was unable to login successfully.';
        }

        let newCase = {
            subject: subject,
            description: description,
            note: 'Case created.'
        };
        return newCase;
    });



    // Register Intent Handlers.
    convoClient.registerIntent(new Intent({
        action: 'skill.resetpassword.loginsuccess',
        sequenceName: SEQ_PWRESET_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'skill.resetpassword.loginsuccess.fallback',
        sequenceName: SEQ_PWRESET_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'skill.resetpassword.sms',
        sequenceName: SEQ_PWRESET_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            dialogContext.setCurrentParam('passwordLinkSent', '1');
            resetAndSendPassword(dialogContext);
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'skill.resetpassword.sms.fallback',
        sequenceName: SEQ_PWRESET_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            return;
        }
    }));

    convoClient.registerIntents({
        actions: [
            'skill.resetpassword.sms.confirmation.yes',
            'skill.resetpassword.sms.confirmation.received'
        ],
        sequenceName: SEQ_PWRESET_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParam('passwordLinkReceived', '1');
            dialogContext.deleteCtx('skillresetpasswordsms-followup');
            return;
        }
    });

    convoClient.registerIntents({
        actions: [
            'skill.resetpassword.sms.confirmation.no',
            'skill.resetpassword.sms.confirmation.notreceived',
            'skill.resetpassword.sms.confirmation.notworking'
        ],
        sequenceName: SEQ_PWRESET_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'passwordLinkNotReceived': '1',
                'confirmedNotWorking': '1',
                'executeStatus': '1'
            });
            dialogContext.deleteCtx('skillresetpasswordsms-followup');
            return;
        }
    });

    convoClient.registerIntents({
        actions: [
            'skill.resetpassword.sms.confirmation.working'
        ],
        sequenceName: SEQ_PWRESET_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'passwordLinkReceived': '1',
                'confirmedWorking': '1',
                'executeStatus': '0'
            });
            dialogContext.deleteCtx('skillresetpasswordsms-followup');
            return;
        }
    });

    convoClient.registerIntent(new Intent({
        action: 'skill.resetpassword.email',
        sequenceName: SEQ_PWRESET_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            dialogContext.setCurrentParam('passwordLinkSent', '1');
            resetAndSendPassword(dialogContext);
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'skill.resetpassword.email.fallback',
        sequenceName: SEQ_PWRESET_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            return;
        }
    }));

    convoClient.registerIntents({
        actions: [
            'skill.resetpassword.email.confirmation.yes',
            'skill.resetpassword.email.confirmation.received'
        ],
        sequenceName: SEQ_PWRESET_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParam('passwordLinkReceived', '1');
            dialogContext.deleteCtx('skillresetpasswordemail-followup');
            return;
        }
    });

    convoClient.registerIntents({
        actions: [
            'skill.resetpassword.email.confirmation.no',
            'skill.resetpassword.email.confirmation.notreceived',
            'skill.resetpassword.email.confirmation.notworking'
        ],
        sequenceName: SEQ_PWRESET_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'passwordLinkNotReceived': '1',
                'confirmedNotWorking': '1',
                'executeStatus': '1'
            });
            dialogContext.deleteCtx('skillresetpasswordemail-followup');
            return;
        }
    });

    convoClient.registerIntents({
        actions: [
            'skill.resetpassword.email.confirmation.working'
        ],
        sequenceName: SEQ_PWRESET_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'passwordLinkReceived': '1',
                'confirmedWorking': '1',
                'executeStatus': '0'
            });
            dialogContext.deleteCtx('skillresetpasswordemail-followup');
            return;
        }
    });

    convoClient.registerIntents({
        actions: [
            'skill.resetpassword.loginsuccess.confirmation.yes',
            'skill.resetpassword.loginsuccess.confirmation.received',
            'skill.resetpassword.loginsuccess.confirmation.able',
            'skill.resetpassword.loginsuccess.confirmation.working'
        ],
        sequenceName: SEQ_PWRESET_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'confirmedWorking': '1',
                'executeStatus': '0'
            });
            dialogContext.deleteCtx('skillresetpasswordloginsuccess-followup');
            return;
        }
    });

    convoClient.registerIntents({
        actions: [
            'skill.resetpassword.loginsuccess.confirmation.no',
            'skill.resetpassword.loginsuccess.confirmation.notreceived',
            'skill.resetpassword.loginsuccess.confirmation.notable',
            'skill.resetpassword.loginsuccess.confirmation.notworking'
        ],
        sequenceName: SEQ_PWRESET_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'confirmedNotWorking': '1',
                'executeStatus': '1'
            });
            dialogContext.deleteCtx('skillresetpasswordloginsuccess-followup');
            return;
        }
    });

    convoClient.registerIntent(new Intent({
        action: 'skill.resetpassword.success',
        sequenceName: SEQ_PWRESET_NAME,
        handler: async (dialogContext) => {
            await injectPasswdResetSuccessEvent(dialogContext);

            dialogContext.appendFulfillmentText();
            dialogContext.setCurrentParam('notifiedSuccess', '1');
    
            let helpCounter = parseInt(dialogContext.params.helpCounter) + 1;
            dialogContext.setSessionParam('helpCounter', helpCounter.toString());
            return;
        }
    }));

    convoClient.registerIntent(new Intent({
        action: 'skill.resetpassword.failure',
        sequenceName: SEQ_PWRESET_NAME,
        handler: async (dialogContext) => {
            await injectPasswdResetFailureEvent(dialogContext);

            dialogContext.appendFulfillmentText();
            dialogContext.setCurrentParam('notifiedFailure', '1');

            return;
        }
    }));
}

module.exports = {registerModuleResetPassword};