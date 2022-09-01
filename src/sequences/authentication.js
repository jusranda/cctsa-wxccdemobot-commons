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
const { WebexConnectConnector } = require("../connectors/webexconnect");
const { RedmineConnector } = require("../connectors/redmine");

// Define Sequence Name Constants.
const SEQ_AUTH_NAME = 'authentication';

///////////////////////////////////////////////////////////
// Register Authentication Sequence and Intent Handlers. //
///////////////////////////////////////////////////////////

function createAndSendOtp(dialogContext) {
    if (dialogContext.params.secondChannel === 'sms') {
        createAndSendOtpBySms(dialogContext);
    } else {
        createAndSendOtpByEmail(dialogContext);
    }
}

function createAndSendOtpBySms(dialogContext) {
    let generatedOtp = WebexConnectConnector.createOtp();
    dialogContext.setCurrentParam('generatedOtp', generatedOtp);

    const wxConnectApi = dialogContext.connectorManager.get(WebexConnectConnector.name());
    wxConnectApi.sendOtpBySms(
        dialogContext.params.sessionId,
        dialogContext.params.smsNumber,
        generatedOtp,
        dialogContext.params.customerFirstName,
        dialogContext.params.companyName,
        dialogContext.params.interactionSource
    );
}

function createAndSendOtpByEmail(dialogContext) {
    let generatedOtp = WebexConnectConnector.createOtp();
    dialogContext.setCurrentParam('generatedOtp', generatedOtp);

    const wxConnectApi = dialogContext.connectorManager.get(WebexConnectConnector.name());
    wxConnectApi.sendOtpByEmail(
        dialogContext.params.sessionId,
        dialogContext.params.mail,
        generatedOtp,
        dialogContext.params.customerFirstName,
        dialogContext.params.companyName,
        dialogContext.params.interactionSource
    );
}

/**
 * Registers the sequences and intents for the authentication module.
 * 
 * @param {SequenceManager} sequenceManager The sequencer manager.
 * @param {IntentManager} intentManager     The intent manager.
 */
function registerModuleAuthentication(sequenceManager,intentManager) {
    // Register Sequence.
    sequenceManager.registerSequence(new Sequence({
        name: SEQ_AUTH_NAME, // Sequence name, also used for Dialogflow context name.
        activity: 'verifying your identity', // Activity description, used in course correction.
        authRequired: false,
        breakIntents: [ // Intents that break from the core flow before attempting sequence navigation.
            { action: 'auth.sendotp', trigger: '1' },
            //{ action: 'auth.sendotp.fallback', trigger: '1' },
            { action: 'auth.getaccount', trigger: '1' },
            //{ action: 'auth.getaccount.fallback', trigger: '1' }
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
            emailFound: '',
            emailNotFound: '',
            usernameFound: '',
            usernameNotFound: '',
            receivedOtp: ''
        },
        createCase: (dialogContext) => { // Create a case.
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
                console.log(fmtLog('authentication.navigate', 'Sending Event AuthRequired', dialogContext));
                let event = dialogContext.respondWithEvent('AuthRequired', dialogContext.params.lastFulfillmentText);
                return;
            }
    
            if (dialogContext.params.customerIdentified === '1') {
                if (context.parameters.validationComplete === '0' && context.parameters.validationReceived === '1' && context.parameters.validationStatus === '1') {
                    console.log(fmtLog('authentication.navigate', 'Sending Event AuthOtpSuccess', dialogContext));
                    let event = dialogContext.respondWithEvent('AuthOtpSuccess', dialogContext.params.lastFulfillmentText);
                    return;
                }
    
                if (context.parameters.validationComplete === '0' && context.parameters.validationReceived === '1' && context.parameters.validationStatus === '2') {
                    console.log(fmtLog('authentication.navigate', 'Sending Event AuthOtpFailure', dialogContext));
                    let event = dialogContext.respondWithEvent('AuthOtpFailure', dialogContext.params.lastFulfillmentText);
                    return;
                }
    
                if (context.parameters.validationComplete === '0' && context.parameters.validationReceived === '0') {
                    console.log(fmtLog('authentication.navigate', 'Sending Event AuthSendOtp', dialogContext));
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
                        console.log(fmtLog('authentication.navigate', 'Calling popSequenceAndNavigate', dialogContext));
                        dialogContext.deleteCtx('skillresetpasswordsms-followup'); // TODO: I think I can remove these, but make sure.
                        dialogContext.popSequenceAndNavigate(SEQ_AUTH_NAME);
                        return;
                    }
                }
    
                console.log(fmtLog('authentication.navigate', 'Calling popSequenceAndNavigate', dialogContext));
                dialogContext.deleteCtx('skillresetpasswordsms-followup'); // TODO: I think I can remove these, but make sure.
                dialogContext.popSequenceAndNavigate(SEQ_AUTH_NAME);
            }
    
            if (dialogContext.params.customerIdentified === '0') {
                if (context.parameters.receivedAccountNumber !== '' && context.parameters.accountNumberNotFound === '1') {
                    console.log(fmtLog('authentication.navigate', 'Sending Event AuthInvalidAccount', dialogContext));
                    let event = dialogContext.respondWithEvent('AuthInvalidAccount', dialogContext.params.lastFulfillmentText);
                    return;
                }
                
                console.log(fmtLog('authentication.navigate', 'Sending Event AuthGetAccount', dialogContext));
                let event = dialogContext.respondWithEvent('AuthGetAccount', dialogContext.params.lastFulfillmentText);
                return;
            }
    
            console.log(fmtLog('authentication.navigate', 'action: '+dialogContext.currentAction+', lastFulfillmentText: '+dialogContext.params.lastFulfillmentText, dialogContext));
            dialogContext.respondWithText();
            return;
        }
    }));

    
    
    // Register Intent Handlers.
    intentManager.registerIntent(new Intent({
        action: 'auth.required',
        sequenceName: SEQ_AUTH_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            dialogContext.setCurrentParam('advisedAuthRequired', '1');
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'auth.getaccount',
        sequenceName: SEQ_AUTH_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'auth.getaccount.value',
        sequenceName: SEQ_AUTH_NAME,
        handler: async (dialogContext) => {
            const redmineApi = dialogContext.connectorManager.get(RedmineConnector.name());
    
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParam('receivedAccountNumber', dialogContext.inparams.accountnumber);
    
            const redmineUsersByAccountFound = await redmineApi.findRedmineUsersByAccountId(dialogContext.inparams.accountnumber);
    
            if (redmineUsersByAccountFound.length === 0) {
                dialogContext.setCurrentParam('accountNumberNotFound', '1');
                dialogContext.deleteCtx('Authgetaccount-followup');
                return;
            }
    
            let resultUser = redmineUsersByAccountFound[0]; // TODO: Handle multiple user disambiguation in future.
            if (resultUser.mobileNumber == null) {
                console.error('Mobile Phone field not found for user: '+JSON.stringify(resultUser));
                dialogContext.setCurrentParam('accountNumberNotFound', '1');
                dialogContext.deleteCtx('Authgetaccount-followup');
                return;
            }
    
            dialogContext.setCurrentParams({
                'accountNumberFound': '1',
                'validatedBy': 'Account Number'
            });
            dialogContext.setSessionParams({
                'customerIdentified': '1',
                'smsNumber': resultUser.mobileNumber,
                'redmineUserId': Math.floor(resultUser.id).toString(), // Convert from float->int->string
                'mail': resultUser.mail,
                'customerFirstName': resultUser.firstName,
                'customerLastName': resultUser.lastName,
                'redmineOpenCaseId': resultUser.openCaseId,
                'accountNumber': resultUser.accountNumber,
                'accountTier': resultUser.accountTier,
                'accountStatus': resultUser.accountStatus,
                'preferredLanguage': resultUser.preferredLanguage
            });
    
            console.log('resultUser: ' + JSON.stringify(resultUser));
    
            dialogContext.deleteCtx('Authgetaccount-followup');
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'auth.invalidaccount',
        sequenceName: SEQ_AUTH_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParam('receivedAccountNumber', '');
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'auth.sendotp',
        sequenceName: SEQ_AUTH_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            createAndSendOtp(dialogContext);
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'auth.sendotp.confirmation.notreceived',
        sequenceName: SEQ_AUTH_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setSessionParam('customerValidated', '0');
            dialogContext.setCurrentParams ({
                'validationComplete': '1',
                'validationReceived': '1',
                'validationStatus': '2'
            });
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'auth.sendotp.value',
        sequenceName: SEQ_AUTH_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParam('receivedOtp', dialogContext.inparams.otp);
    
            if (dialogContext.ctxparams.generatedOtp === dialogContext.ctxparams.receivedOtp) {
                dialogContext.setSessionParam('customerValidated', '1');
                dialogContext.setCurrentParams ({
                    'validationReceived': '1',
                    'validationStatus': '1'
                });
            } else {
                dialogContext.setSessionParam('customerValidated', '0');
                dialogContext.setCurrentParams ({
                    'validationReceived': '1',
                    'validationStatus': '2'
                });
            }
    
            dialogContext.deleteCtx('authenticationsendotp-followup');
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'auth.sendotp.success',
        sequenceName: SEQ_AUTH_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            dialogContext.setCurrentParam('validationComplete', '1');
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'auth.sendotp.failure',
        sequenceName: SEQ_AUTH_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            dialogContext.setCurrentParam('validationComplete', '1');
            return;
        }
    }));
}

module.exports = {registerModuleAuthentication};