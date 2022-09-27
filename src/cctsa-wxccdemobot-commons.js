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
const { IntentManager, SequenceManager } = require("codingforconvos");

const { format10dPhoneNumber } = require("./common");
const { registerModuleWelcome } = require("./sequences/welcome");
const { registerModuleAuthentication } = require("./sequences/authentication");
const { registerModuleReasonForContact } = require("./sequences/reasonforcontact");
const { registerModuleResetPassword } = require("./sequences/resetpasswd");
const { registerModuleCommon } = require("./sequences/common");
const { registerModuleCovidScreen } = require("./sequences/covidscreen");
const { registerModuleAppointmentBooking } = require("./sequences/apptbooking");
const { WebexCcConnector } = require("./connectors/wxcc");
const { RedmineConnector } = require("./connectors/redmine");
const { WebexConnectConnector } = require("./connectors/webexconnect");
const { GoogleCalendarConnector } = require("./connectors/googlecalendar");
const { JdsConnector } = require("./connectors/jds");

/**
 * Registers the sequences and intents for all commons modules.
 * 
 * @param {ConvoClient} convoClient The convo client.
 */
function registerCommonModules(convoClient) {
    registerModuleWelcome(convoClient);
    registerModuleAuthentication(convoClient);
    registerModuleReasonForContact(convoClient);
    registerModuleResetPassword(convoClient);
    registerModuleCommon(convoClient);
}

module.exports = {registerCommonModules,registerModuleCovidScreen,registerModuleAppointmentBooking,WebexCcConnector,RedmineConnector,WebexConnectConnector,GoogleCalendarConnector,JdsConnector,format10dPhoneNumber};