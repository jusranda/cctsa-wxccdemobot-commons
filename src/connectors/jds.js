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
    // FIXME: Work with BU on NOT_A_NUMBER on issue.
    //'phone': 'telephony',
    'phone': 'IVR',
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
     *     jdsUrl: 'https://jds-xxx.cjaas.cisco.com',
     *     dsSasToken: '...'
     * });
     * 
     * @param {Object} params The constructor parameters.
     */
    constructor(params) {
        if (params == undefined) { throw new Error('params is a required for constructing WebexConnectConnector objects.'); }
        if (params.jdsUrl == undefined) { throw new Error('jdsUrl is a required parameter for constructing WebexConnectConnector objects.'); }
        if (params.dsSasToken == undefined) { throw new Error('dsSasToken is a required parameter for constructing WebexConnectConnector objects.'); }
        if (params.tapeSasToken == undefined) { throw new Error('tapeSasToken is a required parameter for constructing WebexConnectConnector objects.'); }
        
        params.endpoint = axios;
        params.name = CXTR_JDS_NAME;
        params.params = params;
        params.sessionParams = {
            uuid: JdsConnector.createUuid()
        };

        super(params);

        this.injectJdsEvent = this.injectJdsEvent.bind(this);
        this.fetchJdsEvents = this.fetchJdsEvents.bind(this);
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
        const url = super.params.jdsUrl+'/events/v1/journey';

        // Validate the input parameters.
        if (params == undefined) { throw new Error('parameters object for creating JDS event objects is missing.'); }
        if (params.person == undefined) { throw new Error('person is a required parameter for creating JDS event objects.'); }
        if (params.origin == undefined) { throw new Error('origin is a required parameter for creating JDS event objects.'); }
        if (params.channelType == undefined) { throw new Error('channelType is a required parameter for creating JDS event objects.'); }

        const stringParams = JSON.stringify(params);
        console.log(`JdsConnector.injectJdsEvent().params: ${stringParams}`);

        const stringPerson = JSON.stringify(params.person);
        console.log(`JdsConnector.injectJdsEvent().params.person: ${stringPerson}`);

        const type = (params.type != undefined) ? params.type : 'test';
        const source = (params.source != undefined) ? params.source : 'web';
        const previously = (params.previously != undefined) ? params.previously : '12345';

        const eventParams = {
            "taskId": uuid,
            // FIXME: Work with BU on NOT_A_NUMBER on issue.
            //"origin": (dialogContext.params.wxccChannel !== 'phone') ? params.origin : params.person.identityAlias, 
            "origin": params.origin, 
            "createdTime": Date.now().toString(),
            "channelType": params.channelType,
            "firstName": params.person.firstName,
            "lastName": params.person.lastName,
            "phone": params.person.phone,
            "email": params.person.email
        }

        for (let param in params.dataParams) {
            if (Object.prototype.hasOwnProperty.call(params.dataParams, param)) {
                eventParams[param] = params.dataParams[param];
            }
        }

        const data = {
            "id": uuid,
            "previously": previously,
            "time": new Date().toISOString(),
            "specversion": "1.0",
            "type": type,
            "source": source.replace(/\s+/g, ''), // Remove spaces to comply with uri-reference scheme.
            "identity": params.person.identityAlias,
            "identitytype": params.person.identityAliasType,
            "datacontenttype": "application/json",
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

    /**
     * Retrieve customer journey data events for a person.
     * 
     * @param {string} personAlias  The person alias.
     * @param {Object} params       The optional parameters to control pagination and window size.
     * @returns the JDS event tape.
     */
    async fetchJdsEvents(personAlias, params={}) {
        let url = super.params.jdsUrl+'/v1/journey/streams/historic/';

        // Validate the input parameters.
        if (personAlias == undefined) { throw new Error('personAlias object for creating JDS event objects is missing.'); }
        
        console.log(`JdsConnector.fetchJdsEvents().personAlias: ${personAlias}`);
        url = url+personAlias;

        let finalResponse = {};
        await axios.get(url, {
            params: params,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': super.params.tapeSasToken
            }
        })
        .then((response) => {
            console.log("Success - "+response.status+' '+response.data);

            finalResponse = response.data;
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

        return finalResponse;
    }
}

module.exports = {JdsConnector};