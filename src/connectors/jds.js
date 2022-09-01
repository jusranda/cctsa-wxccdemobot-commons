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

const CXTR_JDS_NAME = 'jds';

const JDS_CHANNEL_TYPES = {
    'phone': 'telephony',
    'chat': 'Chat',
    'sms': 'SMS',
    'facebookMessenger': 'Messenger',
    'whatsapp': 'WhatsApp',
    'web': 'Web'
};

/**
 * A Connector for the Webex Connect API.
 */
 class JdsConnector extends Connector {
    /**
     * Construct a new JdsConnector instance.
     * 
     * @example
     * const JdsConnector = New JdsConnector({
     *     jdsUrl: 'https://jds-us1.cjaas.cisco.com',
     *     dsSasToken: 'SharedAccessSignature so=cctsa&sn=sandbox&ss=ds&sp=rw&...'
     * });
     * 
     * @param {Object} params The constructor parameters.
     */
    constructor(params) {
        if (params == undefined) { throw new Error('params is a required for constructing WebexConnectConnector objects.'); }
        if (params.jdsUrl == undefined) { throw new Error('jdsUrl is a required parameter for constructing WebexConnectConnector objects.'); }
        if (params.dsSasToken == undefined) { throw new Error('dsSasToken is a required parameter for constructing WebexConnectConnector objects.'); }
        
        params.endpoint = axios;
        params.name = CXTR_JDS_NAME;
        params.params = params;

        super(params);

        this.injectJdsEvent = this.injectJdsEvent.bind(this);
    }

    static channelType(wxccChannel) {
        return JDS_CHANNEL_TYPES[wxccChannel];
    }

    /**
     * Get the static name of the connector.
     * 
     * @returns the static name of the connector.
     */
    static name() {
        return CXTR_JDS_NAME;
    }

    /**
     * Generates a 36-character UUID.
     * @returns a 36-character UUID.
     */
    static createUuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Inject a customer journey data services event.
     * 
     * @param {string} uuid     The UUID for the JDS event.
     * @param {string} params   The parameters for the JDS event.
     */
    async injectJdsEvent(uuid, params) {
        let now = Date.now();
        let url = super.params.jdsUrl+'/events/v1/journey';

        // Validate the input parameters.
        if (params == undefined) { throw new Error('parameters object for creating JDS event objects is missing.'); }
        if (params.person == undefined) { throw new Error('person is a required parameter for creating JDS event objects.'); }
        if (params.origin == undefined) { throw new Error('origin is a required parameter for creating JDS event objects.'); }
        if (params.channelType == undefined) { throw new Error('channelType is a required parameter for creating JDS event objects.'); }

        let stringParams = JSON.stringify(params);
        console.log(`JdsConnector.injectJdsEvent().params: ${stringParams}`);

        let stringPerson = JSON.stringify(params.person);
        console.log(`JdsConnector.injectJdsEvent().params.person: ${stringPerson}`);

        let type = (params.type != undefined) ? params.type : 'manual';
        let source = (params.source != undefined) ? params.source : 'web';
        let previously = (params.previously != undefined) ? params.previously : '12345';

        let eventParams = {
            "taskId": uuid,
            //"origin": params.origin,
            "origin": params.origin,
            "createdTime": Date.now(),
            "channelType": params.channelType,
            "firstName": params.person.firstName,
            "lastName": params.person.lastName,
            "phone": params.person.phone,
            "email": params.person.email
        }

        for (var param in params.dataParams) {
            if (Object.prototype.hasOwnProperty.call(params.dataParams, param)) {
                eventParams[param] = params.dataParams[param];
            }
        }

        let data = {
            "id": uuid,
            "previously": previously,
            "time": now.toString(),
            "specVersion": "1.0",
            "type": type,
            "source": source,
            "person": params.person.identityAlias,
            "dataContentType": "application/json",
            "data": eventParams
        };

        
        //let dataString = JSON.stringify(data);
        //console.log(`data: ${dataString}`);
        
        //let eventParamsString = JSON.stringify(eventParams);
        //console.log(`eventParams: ${eventParamsString}`);

        axios.post(url, data, {
            headers:{
                'Content-Type': 'application/json',
                'Authorization': super.params.dsSasToken
            }
        })
        .then((response) => {
            console.log("Success - "+response.status+' '+response.data);
        })
        .catch((error) => {
            console.log("Error - Start");
            if (error.response) {
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            }
            console.log("Error - End");
        });
    }
}

module.exports = {JdsConnector};