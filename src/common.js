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

function getJdsPerson(dialogContext) {
    let person = {};

    person.identityAlias = getIdentityAlias(dialogContext);
    person.firstName = dialogContext.params.customerFirstName;
    person.lastName = dialogContext.params.customerLastName;
    person.phone = dialogContext.params.callingNumber;
    person.email = dialogContext.params.mail;

    return person;
}

const IDENTITY_ALIAS = new Map();
IDENTITY_ALIAS.set('phone', getIdentityPhoneNumber);
IDENTITY_ALIAS.set('chat', getIdentityEmail);
IDENTITY_ALIAS.set('sms', getIdentitySmsNumber);
IDENTITY_ALIAS.set('facebookMessenger', getIdentityFbMessengerId);
IDENTITY_ALIAS.set('whatsApp', getIdentityWhatsAppNumber);
IDENTITY_ALIAS.set('web', getIdentityEmail);

function getIdentityAlias(dialogContext) {
    if (IDENTITY_ALIAS.has(dialogContext.params.wxccChannel)) {
        return IDENTITY_ALIAS.get(dialogContext.params.wxccChannel)(dialogContext);
    }
    return getIdentityPhoneNumber(dialogContext);
}

function getIdentityPhoneNumber(dialogContext) {
    return dialogContext.params.callingNumber;
}

function getIdentitySmsNumber(dialogContext) {
    return dialogContext.params.smsNumber;
}

function getIdentityWhatsAppNumber(dialogContext) {
    return dialogContext.params.whatsAppNumber;
}

function getIdentityFbMessengerId(dialogContext) {
    return dialogContext.params.fbMessengerId;
}

function getIdentityEmail(dialogContext) {
    return dialogContext.params.mail;
}

async function injectJdsEvent(dialogContext, origin, dataParams) {
    let jdsPerson = getJdsPerson(dialogContext);

    //let stringPerson = JSON.stringify(jdsPerson);
    //console.log(`injectJdsEvent().person: ${stringPerson}`);

    let channelType = JdsConnector.channelType(dialogContext.params.wxccChannel);

    dialogContext.connectorManager.get(JdsConnector.name()).injectJdsEvent(dialogContext.params.uuid, {
        person: jdsPerson,
        type: 'bot',
        source: `Virtual Assistant on ${channelType}`,
        origin: origin,
        channelType: channelType,
        dataParams: dataParams
    });
}

async function createRedmineIssue (dialogContext) {
    const redmineApi = dialogContext.connectorManager.get(RedmineConnector.name());
    let newCase = dialogContext.currentSequence.createCase(dialogContext.contextManager, dialogContext.dialogflowAgent, dialogContext.sessionParams);
            
    const redmineNewIssue = await redmineApi.createRedmineIssue(newCase, dialogContext);
    console.log('redmineNewIssue.id: '+redmineNewIssue.id);

    dialogContext.connectorManager.get(RedmineConnector.name()).updateRedmineIssueNotes(redmineNewIssue.id, newCase.note);

    dialogContext.setSessionParams({
        'ticketNumber': redmineNewIssue.id.toString(),
        'redmineOpenCaseId': redmineNewIssue.id.toString()
    });

    return redmineNewIssue;
}

module.exports = {injectJdsEvent,createRedmineIssue,getJdsPerson};