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

const { RedmineConnector } = require("./connectors/redmine");
const { JdsConnector } = require("./connectors/jds");
const { DialogContext } = require("codingforconvos/src/contexts");

/**
 * Constructs a JDS Person object.
 * 
 * @param {DialogContext} dialogContext The dialog context.
 * @returns the newly created JDS Person object.
 */
function getJdsPerson(dialogContext) {
    let person = {};

    person.identityAlias = getIdentityAlias(dialogContext);
    person.identityAliasType = getIdentityAliasType(dialogContext);
    person.firstName = dialogContext.params.customerFirstName;
    person.lastName = dialogContext.params.customerLastName;
    person.phone = '+1'+dialogContext.params.identityPhoneNumber;
    person.email = dialogContext.params.identityEmail;

    return person;
}

const IDENTITY_ALIAS = new Map();
IDENTITY_ALIAS.set('phone', getIdentityPhoneNumber);
IDENTITY_ALIAS.set('chat', getIdentityEmail);
IDENTITY_ALIAS.set('sms', getIdentitySmsNumber);
IDENTITY_ALIAS.set('facebookMessenger', getIdentityFbMessengerId);
IDENTITY_ALIAS.set('whatsapp', getIdentityWhatsAppNumber);
IDENTITY_ALIAS.set('web', getIdentityEmail);

const IDENTITY_ALIAS_TYPES = new Map();
IDENTITY_ALIAS_TYPES.set('phone', 'phone');
IDENTITY_ALIAS_TYPES.set('chat', 'email');
IDENTITY_ALIAS_TYPES.set('sms', 'phone');
IDENTITY_ALIAS_TYPES.set('facebookMessenger', 'customerId');
IDENTITY_ALIAS_TYPES.set('whatsapp', 'phone');
IDENTITY_ALIAS_TYPES.set('web', 'email');

/**
 * Return the session property representing the in-use channel identity.
 * 
 * @param {DialogContext} dialogContext The dialog context.
 * @returns the session property representing the in-use channel identity.
 */
function getIdentityAlias(dialogContext) {
    if (IDENTITY_ALIAS.has(dialogContext.params.wxccChannel)) {
        return IDENTITY_ALIAS.get(dialogContext.params.wxccChannel)(dialogContext);
    }
    return getIdentityPhoneNumber(dialogContext);
}

/**
 * Return the session property representing the in-use channel identity type.
 * 
 * @param {DialogContext} dialogContext The dialog context.
 * @returns the session property representing the in-use channel identity type.
 */
 function getIdentityAliasType(dialogContext) {
    if (IDENTITY_ALIAS_TYPES.has(dialogContext.params.wxccChannel)) {
        return IDENTITY_ALIAS_TYPES.get(dialogContext.params.wxccChannel);
    }
    return 'phone';
}

/**
 * Return the session property representing the phone number identity.
 * 
 * @param {DialogContext} dialogContext 
 * @returns the session property representing the phone number identity.
 */
function getIdentityPhoneNumber(dialogContext) {
    return '+1'+dialogContext.params.callingNumber;
}

/**
 * Return the session property representing the SMS identity.
 * 
 * @param {DialogContext} dialogContext 
 * @returns the session property representing the SMS identity.
 */
function getIdentitySmsNumber(dialogContext) {
    return '+1'+dialogContext.params.smsNumber;
}

/**
 * Return the session property representing the WhatsApp identity.
 * 
 * @param {DialogContext} dialogContext 
 * @returns the session property representing the WhatsApp identity.
 */
function getIdentityWhatsAppNumber(dialogContext) {
    return '+1'+dialogContext.params.whatsAppNumber;
}

/**
 * Return the session property representing the Facebook Messenger identity.
 * 
 * @param {DialogContext} dialogContext 
 * @returns the session property representing the Facebook Messenger identity.
 */
 function getIdentityFbMessengerId(dialogContext) {
    return dialogContext.params.fbMessengerId;
}

/**
 * Return the session property representing the Email identity.
 * 
 * @param {DialogContext} dialogContext 
 * @returns the session property representing the Email identity.
 */
function getIdentityEmail(dialogContext) {
    return dialogContext.params.mail;
}

/**
 * Injects a JDS event with parameters.
 * 
 * @param {DialogContext} dialogContext The dialog context.
 * @param {string} origin               The JDS event origin value.
 * @param {Object} dataParams           The JDS event data parameters.
 */
async function injectJdsEvent(dialogContext, origin, dataParams) {
    let jdsPerson = getJdsPerson(dialogContext);

    //let stringPerson = JSON.stringify(jdsPerson);
    //console.log(`injectJdsEvent().person: ${stringPerson}`);

    let channelType = JdsConnector.channelType(dialogContext.params.wxccChannel);

    dialogContext.connectorManager.get(JdsConnector.name()).injectJdsEvent(dialogContext.params.uuid, {
        person: jdsPerson,
        type: 'bot',
        source: `${channelType} Virtual Assistant`,
        origin: origin,
        channelType: channelType,
        dataParams: dataParams
    });
}

/**
 * Create a Redmine issue using a named template, and update session context.
 * 
 * @param {DialogContext} dialogContext The dialog context.
 * @param {string} caseTemplateName     The case template name, or uses active sequence name if blank.
 * @returns the newly created Redmine issue.
 */
async function createRedmineIssue (dialogContext, caseTemplateName='|') {
    const redmineApi = dialogContext.connectorManager.get(RedmineConnector.name());

    const templateName = (caseTemplateName !== '|') ? caseTemplateName : dialogContext.params.sequenceCurrent;

    let newCase = RedmineConnector.caseTemplate(templateName)(dialogContext);
            
    const redmineNewIssue = await redmineApi.createRedmineIssue(newCase, dialogContext);
    console.log('redmineNewIssue.id: '+redmineNewIssue.id);

    dialogContext.connectorManager.get(RedmineConnector.name()).updateRedmineIssueNotes(redmineNewIssue.id, newCase.note);

    dialogContext.setSessionParams({
        'ticketNumber': redmineNewIssue.id.toString(),
        'redmineOpenCaseId': redmineNewIssue.id.toString()
    });

    return redmineNewIssue;
}

/**
 * Normalize a phone number into 10D format.
 * @param {string} phoneNumber   The phone number.
 * @returns the 10D formatted phone number.
 */
function format10dPhoneNumber(phoneNumber) {
    if (phoneNumber.indexOf('+') === 0) {
        return phoneNumber.substring(2); // Strip +1
    }
    if (phoneNumber.indexOf('1') === 0) {
        return phoneNumber.substring(1); // Strip 1
    }
    return phoneNumber;
}

module.exports = {injectJdsEvent,createRedmineIssue,getJdsPerson,format10dPhoneNumber,getIdentityAlias};