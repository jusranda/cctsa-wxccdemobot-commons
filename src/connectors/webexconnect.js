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

const CXTR_WXCONNECT_NAME = 'webexconnect';

/**
 * A Connector for the Webex Connect API.
 */
 class WebexConnectConnector extends Connector {
    /**
     * Construct a new WebexConnectConnector instance.
     * 
     * @example
     * const webexConnectConnector = New WebexConnectConnector({
     *     smsSendOtpUrl: 'http://examplesmssendotpurl.com',
     *     smsPwResetUrl: 'http://examplesmspasswordreseturl.com'
     * });
     * 
     * @param {Object} params The constructor parameters.
     */
    constructor(params) {
        if (params.smsSendOtpUrl == undefined) { throw new Error('smsSendOtpUrl is a required parameter for webexConnectConnector objects.'); }
        if (params.smsPwResetUrl == undefined) { throw new Error('smsPwResetUrl is a required parameter for webexConnectConnector objects.'); }

        params.endpoint = axios;
        params.name = CXTR_WXCONNECT_NAME;
        params.params = params;

        super(params);

        this.sendOtpBySms = this.sendOtpBySms.bind(this);
        this.sendPwresetLinkBySms = this.sendPwresetLinkBySms.bind(this);
    }

    /**
     * Generates a 4-digit one-time-passcode (OTP) number.
     * @returns a 4-digit one-time-passcode (OTP) number.
     */
    static createOtp() {
        let otp = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
        return otp;
    }
    
    /**
     * Sends an one-time-passcode (OTP) by SMS.
     * 
     * @param {string} sessionId        The Dialogflow ES session ID.
     * @param {string} smsDest          The SMS destination phone number.
     * @param {string} pin              The 4-digit one-time-passcode (OTP).
     * @param {string} customerName     The customer first name.
     * @param {string} companyName      The company name.
     * @param {string} contactChannel   The interaction channel name.
     */
    async sendOtpBySms(sessionId,smsDest,pin,customerName,companyName,contactChannel) {
        var data = `{
            "name": "${customerName}",
            "smsDest": "${smsDest}",
            "pin": "${pin}",
            "sessionId": "${sessionId}",
            "companyName": "${companyName}",
            "contactChannel": "${contactChannel}"
        }`;
        
        console.log(JSON.stringify(data));
        axios.post(super.params.smsSendOtpUrl, data, {
            headers:{ 'Content-Type': 'application/json'}
        })
        .then((response) => {
            console.log("Success");
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
     * Sends a password reset link by SMS.
     * 
     * @param {string} sessionId        The Dialogflow ES session ID.
     * @param {string} smsDest          The SMS destination phone number.
     * @param {string} customerName     The customer first name.
     * @param {string} companyName      The company name.
     * @param {string} contactChannel   The interaction channel name.
     * @param {string} tempPw           The new temporary password.
     */
    async sendPwresetLinkBySms(sessionId,smsDest,customerName,companyName,contactChannel,tempPw) {
        var data = `{
            "name": "${customerName}",
            "smsDest": "${smsDest}",
            "tempPw": "${tempPw}",
            "sessionId": "${sessionId}",
            "companyName": "${companyName}",
            "contactChannel": "${contactChannel}"
        }`;
        
        console.log(JSON.stringify(data));
        axios.post(super.params.smsPwResetUrl, data, {
            headers:{ 'Content-Type': 'application/json'}
        })
        .then((response) => {
            console.log('Success');
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

module.exports = {CXTR_WXCONNECT_NAME,WebexConnectConnector};