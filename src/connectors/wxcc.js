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

const { Connector } = require("codingforconvos");
const axios = require('axios');
const { format10dPhoneNumber } = require("../common");

const CXTR_WXCC_NAME = 'wxcc';

/**
 * A Connector for the Webex Connect API.
 */
 class WebexCcConnector extends Connector {
    /**
     * Construct a new WebexCcConnector instance.
     * 
     * @example
     * const webexCcConnector = New WebexCcConnector();
     * 
     * @param {Object} params The constructor parameters.
     */
    constructor(params={}) {
        params.endpoint = axios;
        params.name = CXTR_WXCC_NAME;
        params.params = (params != undefined) ? params : {};
        params.sessionParams = {
            // Session and Channel Information
            sessionId: '',
            sessionInitialized: '0',
            interactionId: '',
            wxccChannel: '',
            interactionSource: '',
                
            origCallingNumber: '',
            callingNumber: '',
            origCalledNumber: '',
            calledNumber: '',
            origSmsNumber: '',
            smsNumber: '',
            origWhatsAppNumber: '',
            whatsAppNumber: '',
            origFbMessengerId: '',
            fbMessengerId: '',
            mail: '',
                
            identityPhoneNumber: '',
            identityEmail: '',

            secondChannel: '',
            secondChannelAlias: '',
            secondChannelAddrType: '',
                
            // Dialog Management
            helpCounter: '0',
            fallbackCounter: '0',
            noInputCounter: '0',
            sequenceCurrent: 'welcome',
            sequenceStack: '',
            lastEvent: '',
            lastAction: '',
            lastFulfillmentText: '',
            fulfillmentBuffer: '',
            offeredAgent: '0',
            offeredAgentAccepted: '0',
            offeredAgentDeclined: '0',
            triggeredSkill: '0',
            sayGoodbye: '0',
            saidGoodbye: '0'
        };

        params.populateFromPayload = (context, dialogContext) => {
            let payload = dialogContext.payload;

            let wxccChannel = (payload.wxccChannel) ? payload.wxccChannel : '';
            context.parameters.wxccChannel = wxccChannel;
            context.parameters.interactionId = (payload.RCK) ? payload.RCK : '';
            context.parameters.interactionSource = (wxccChannel !== '') ? wxccChannel : ((dialogContext.dialogflowAgent.requestSource === undefined || dialogContext.dialogflowAgent.requestSource == null) ? 'chat' : dialogContext.dialogflowAgent.requestSource);
            
            context.parameters.mail = (payload.email) ? payload.email : '';

            context.parameters.chatFormName = (payload.chatFormName) ? payload.chatFormName : '';
            context.parameters.chatFormReason = (payload.chatFormReason) ? payload.chatFormReason : '';

            context.parameters.origCallingNumber = (payload.ANI) ? payload.ANI : '';
            context.parameters.callingNumber = format10dPhoneNumber(context.parameters.origCallingNumber);

            context.parameters.origCalledNumber = (payload.DNIS) ? payload.DNIS : '';
            context.parameters.calledNumber = format10dPhoneNumber(context.parameters.origCalledNumber);

            context.parameters.origSmsNumber = (payload.smsNumber) ? payload.smsNumber : '';
            context.parameters.smsNumber = (context.parameters.origSmsNumber !== '') ? format10dPhoneNumber(context.parameters.origSmsNumber) : context.parameters.callingNumber;

            context.parameters.origWhatsAppNumber = (payload.whatsAppNumber) ? payload.whatsAppNumber : '';
            context.parameters.whatsAppNumber = (context.parameters.origWhatsAppNumber !== '') ? format10dPhoneNumber(context.parameters.origWhatsAppNumber) : '';

            context.parameters.origFbMessengerId = (payload.fbMessengerId) ? payload.fbMessengerId : '';
            context.parameters.fbMessengerId = context.parameters.origFbMessengerId; // TODO: Look up profile information from Facebook API.

            context.parameters.secondChannel = (context.parameters.interactionSource === 'sms') ? 'email' : 'sms';
            context.parameters.secondChannelAlias = (context.parameters.interactionSource === 'sms') ? 'email' : 'text';
            context.parameters.secondChannelAddrType = (context.parameters.interactionSource === 'sms') ? 'address' : 'phone number';

            return context;
        }

        super(params);
    }

    /**
     * Get the static name of the connector.
     * 
     * @returns the static name of the connector.
     */
    static name() {
        return CXTR_WXCC_NAME;
    }
}

module.exports = {WebexCcConnector};