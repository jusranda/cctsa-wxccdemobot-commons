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
    constructor(params) {
        if (params == undefined) { throw new Error('params is a required parameter for WebexCcConnector objects.'); }

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