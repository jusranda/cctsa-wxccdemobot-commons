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

const { registerModuleWelcome } = require("./sequences/welcome");
const { registerModuleAuthentication } = require("./sequences/authentication");
const { registerModuleReasonForContact } = require("./sequences/reasonforcontact");
const { RedmineConnector,CXTR_REDMINE_NAME } = require("./connectors/redmine");

/**
 * Registers the sequences and intents for all commons modules.
 * 
 * @param {SequenceManager} sequenceManager The sequencer manager.
 * @param {IntentManager} intentManager     The intent manager.
 */
function registerCommonModules(sequenceManager, intentManager) {
    registerModuleWelcome(sequenceManager, intentManager);
    registerModuleAuthentication(sequenceManager, intentManager);
    registerModuleReasonForContact(sequenceManager, intentManager);
}

module.exports = {registerCommonModules,RedmineConnector,CXTR_REDMINE_NAME};