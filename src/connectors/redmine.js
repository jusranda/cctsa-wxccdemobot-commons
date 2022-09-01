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

const { Connector,fmtLog } = require("codingforconvos");
const Redmine = require('axios-redmine');

const CXTR_REDMINE_NAME = 'redmine';

const CTX_AUTH = 'authentication';

const REDMINE_SOURCES = {
    'phone': 'Phone',
    'chat': 'Chat',
    'sms': 'SMS',
    'facebookMessenger': 'Facebook Messenger',
    'whatsapp': 'WhatsApp',
    'web': 'Web'
};

/**
 * A Connector for the Redmine REST API.
 */
class RedmineConnector extends Connector {
    /**
     * Construct a new RedmineConnector instance.
     * 
     * @example
     * const redmineConnector = New RedmineConnector({
     *     hostname: 'http://cctsa-redmine.outofservice.org',
     *     apiKey: 'abc123def456abc123def456abc123def456'
     * });
     * 
     * @param {Object} params The constructor parameters.
     */
    constructor(params) {
        if (params.hostname == undefined) { throw new Error('hostname is a required parameter for RedmineConnector objects.'); }
        if (params.apiKey == undefined) { throw new Error('apiKey is a required parameter for RedmineConnector objects.'); }

        // Create Redmine API client.
        const hostname = params.hostname;
        const config = {
            apiKey: params.apiKey,
            rejectUnauthorized: params.rejectUnauthorized
        };
        params.endpoint = new Redmine(hostname, config);

        params.name = CXTR_REDMINE_NAME;
        params.params = params;

        super(params);

        this._redmineUsersByEmail = [];
        this._redmineUsersByMobilePhoneFound = [];
        this._redmineNewIssue = {};

        this.findRedmineUsersByAccountId = this.findRedmineUsersByAccountId.bind(this);
        this.findRedmineUserByMobilePhone = this.findRedmineUserByMobilePhone.bind(this);
    }

    /**
     * Get the Redmine channel source.
     * 
     * @returns the Redmine channel source.
     */
    static redmineSource(wxccChannel) {
        return REDMINE_SOURCES[wxccChannel];
    }
    
    /**
     * Get the static name of the connector.
     * 
     * @returns the static name of the connector.
     */
    static name() {
        return CXTR_REDMINE_NAME;
    }

    /**
     * Parse the Redmine REST API user response into a more accessible format.
     * 
     * @param {Object} redmineUser  The Redmine REST API user response.
     * @returns a parsed Redmine User with accessible custom fields.
     */
    static createResponseUser(redmineUser) {
        let responseUser = {};
        responseUser.id = redmineUser.id;
        responseUser.login = redmineUser.login;
        responseUser.admin = redmineUser.admin;
        responseUser.firstName = redmineUser.firstname;
        responseUser.lastName = redmineUser.lastname;
        responseUser.mail = redmineUser.mail;
        responseUser.lastLoginOn = redmineUser.last_login_on;
        responseUser.passwdChangedOn = redmineUser.passwd_changed_on;
    
        redmineUser.custom_fields.forEach(cf => {
            switch (cf.name) {
                case 'Mobile Phone':
                    responseUser.mobileNumber = cf.value;
                    break;
                case 'Customer Account ID':
                    responseUser.accountNumber = cf.value;
                    break;
                case 'Account Tier':
                    responseUser.accountTier = cf.value;
                    break;
                case 'Account Status':
                    responseUser.accountStatus = cf.value;
                    break;
                case 'Preferred Language':
                    responseUser.preferredLanguage = cf.value;
                    break;
                case 'Open Case ID':
                    responseUser.openCaseId = cf.value;
                    break;
                case 'Advisory':
                    responseUser.advisory = cf.value;
                    break;
                default:
                    // do nothing for unknown customer fields.
                    break;
            }
        });
    
        return responseUser;
    }

    /**
     * Finds a list of Redmine Users by Email.
     * 
     * @param {string} email The email.
     * @returns a parsed Redmine User with accessible custom fields.
     */
     async findRedmineUsersByEmail(email) {
        this._redmineUsersByEmail = [];
        await super.endpoint
            .users({ include: 'memberships,groups' })
            .then(response => {
                response.data.users.forEach(user => {
                    user.customFieldsByName = {};
                    user.custom_fields.forEach(customField => {
                        user.customFieldsByName[customField.name] = customField;
                    });

                    if (user.mail === email) {
                        this._redmineUsersByEmail.push(RedmineConnector.createResponseUser(user));
                    }
                });
            })
            .catch(err => { console.error(err); });

        return this._redmineUsersByEmail;
    }

    /**
     * Finds a list of Redmine Users by Account ID.
     * 
     * @param {string} accountId The account ID.
     * @returns a parsed Redmine User with accessible custom fields.
     */
    async findRedmineUsersByAccountId(accountId) {
        this._redmineUsersByEmail = [];
        await super.endpoint
            .users({ include: 'memberships,groups' })
            .then(response => {
                response.data.users.forEach(user => {
                    user.customFieldsByName = {};
                    user.custom_fields.forEach(customField => {
                        user.customFieldsByName[customField.name] = customField;
                    });

                    let cfAccountId = user.customFieldsByName['Customer Account ID'].value;
                    if (cfAccountId === accountId) {
                        this._redmineUsersByEmail.push(RedmineConnector.createResponseUser(user));
                    }
                });
            })
            .catch(err => { console.error(err); });

        return this._redmineUsersByEmail;
    }

    /**
     * Finds a list of Redmine Users by Phone Number.
     * 
     * @param {string} phoneNumber  The Phone Number.
     * @returns a parsed Redmine User with accessible custom fields.
     */
    async findRedmineUserByMobilePhone(phoneNumber) {
        this._redmineUsersByMobilePhoneFound = [];
        await super.endpoint
            .users({ include: 'memberships,groups' })
            .then(response => {
                response.data.users.forEach(user => {
                    user.customFieldsByName = {};
                    user.custom_fields.forEach(customField => {
                        user.customFieldsByName[customField.name] = customField;
                    });
    
                    let cfPhoneNumber = user.customFieldsByName['Mobile Phone'].value;
                    if (cfPhoneNumber === phoneNumber) {
                        this._redmineUsersByMobilePhoneFound.push(RedmineConnector.createResponseUser(user));
                    }
                });
            })
            .catch(err => { console.error(err); });

        return this._redmineUsersByMobilePhoneFound;
    }

    /**
     * Resets a password for a Redmine user.
     */
    async resetRedmineUserPassword(redmineUserId,tempPw) {
        super.endpoint
            .get_user_by_id(redmineUserId, { include: 'memberships,groups' })
            .then(response => {
                response.data.user.password = tempPw;
                response.data.user.must_change_passwd = 'true';
                let updatedUser = { user: response.data.user };
    
                super.endpoint.update_user(redmineUserId, updatedUser, function(err, data) {
                    if (err) console.log(err);
                    console.log(data);
                });
            })
            .catch(err => { console.log(err); });
    }

    /**
     * Creates a new Redmine Issue.
     * 
     * @param {Object} newCase              The Redmine Issue data.
     * @param {DialogContext} dialogContext The dialog context.
     * @returns the newly created Redmine Issue.
     */
    async createRedmineTriage(newCase,dialogContext,triage) {
        let accountNumber = dialogContext.params.accountNumber; // accountId
        let source = RedmineConnector.redmineSource(dialogContext.params.interactionSource);
        let initiatorId = dialogContext.params.redmineUserId; // Initiator

        let subject = newCase.subject;
        let description = newCase.description;
        let trackerId = newCase.trackerId != undefined ? newCase.trackerId : 8; // Default tracker = 'Triage'
        let statusId = newCase.statusId != undefined ? newCase.statusId : 1; // Default status = 'New'
        let priorityId = newCase.priorityId != undefined ? newCase.priorityId : 4; // Default priority = 'Normal'

        this._redmineNewIssue = {};
        const issue = {
            issue: {
                project_id: 11,
                subject: subject,
                description: description,
                //assigned_to_id: 5, // jusranda
                tracker_id: trackerId,
                status_id: statusId,
                priority_id: priorityId,
                custom_fields: [
                    { id: 5, value: accountNumber }, // Customer ID
                    { id: 12, value: source }, // Source
                    { id: 13, value: initiatorId }, // Initiator.
                    { id: 15, value: triage.symptoms }, // Symptoms
                    { id: 16, value: triage.countryName }, // Countries Visited (< 14 Days)
                    { id: 17, value: triage.diagnosedWithCovid },
                    { id: 18, value: triage.diagnosedWithCovidDate },
                    { id: 19, value: triage.livesWithCovid }
                ],
            }
        };

        await super.endpoint
            .create_issue(issue)
            .then(response => {
                this._redmineNewIssue = response.data.issue;
            })
            .catch(err => { console.log(err); });

        return this._redmineNewIssue;
    }

    /**
     * Creates a new Redmine Issue.
     * 
     * @param {Object} newCase              The Redmine Issue data.
     * @param {DialogContext} dialogContext The dialog context.
     * @returns the newly created Redmine Issue.
     */
    async createRedmineIssue(newCase,dialogContext) {
        let accountNumber = dialogContext.params.accountNumber; // accountId
        let source = RedmineConnector.redmineSource(dialogContext.params.interactionSource);
        let initiatorId = dialogContext.params.redmineUserId; // Initiator

        let subject = newCase.subject;
        let description = newCase.description;
        let trackerId = newCase.trackerId != undefined ? newCase.trackerId : 7; // Default tracker = 'Case'
        let statusId = newCase.statusId != undefined ? newCase.statusId : 1; // Default status = 'New'
        let priorityId = newCase.priorityId != undefined ? newCase.priorityId : 4; // Default priority = 'Normal'

        this._redmineNewIssue = {};
        const issue = {
            issue: {
                project_id: 11,
                subject: subject,
                description: description,
                //assigned_to_id: 5, // jusranda
                tracker_id: trackerId,
                status_id: statusId,
                priority_id: priorityId,
                custom_fields: [
                    { id: 5, value: accountNumber },
                    { id: 12, value: source },
                    { id: 13, value: initiatorId } // Request initiator.  FIXME: Pass this in as a variable.
                ],
            }
        };

        await super.endpoint
            .create_issue(issue)
            .then(response => {
                this._redmineNewIssue = response.data.issue;
            })
            .catch(err => { console.log(err); });

        return this._redmineNewIssue;
    }

    /**
     * Updates nodes for a Redmine Issue.
     * 
     * @param {number} issueId       The Redmine Issue ID.
     * @param {string} notes         The notes.
     * @param {Boolean} privateFlag   The note privacy flag.
     */
    async updateRedmineIssueNotes(issueId,notes,privateFlag='false') {
        const issue = {
            issue: {
                id: issueId,
                notes: notes,
                private_notes: privateFlag
            }
        };

        super.endpoint
            .update_issue(issueId, issue)
            .then(response => {
                console.log('HTTP PUT '+response.status);
            })
            .catch(err => { console.log(err); });
    }

    static populateFromRedmineUser(ctxSessionProps, redmineUser) {
        ctxSessionProps.parameters.smsNumber = redmineUser.mobileNumber;
        ctxSessionProps.parameters.redmineUserId = Math.floor(redmineUser.id).toString(); // convert from float->int->string
        ctxSessionProps.parameters.mail = redmineUser.mail;
        ctxSessionProps.parameters.customerFirstName = redmineUser.firstName;
        ctxSessionProps.parameters.customerLastName = redmineUser.lastName;
        ctxSessionProps.parameters.redmineOpenCaseId = redmineUser.openCaseId;
        ctxSessionProps.parameters.accountNumber = redmineUser.accountNumber;
        ctxSessionProps.parameters.accountTier = redmineUser.accountTier;
        ctxSessionProps.parameters.accountStatus = redmineUser.accountStatus;
        ctxSessionProps.parameters.preferredLanguage = redmineUser.preferredLanguage;
        ctxSessionProps.parameters.advisory = redmineUser.advisory;
    
        return ctxSessionProps;
    }
    
    static async populateFromRedmineLookup(ctxSessionProps, dialogContext) {
        if (ctxSessionProps.parameters.callingNumber !== '') {
            console.log(fmtLog('populateFromRedmineLookup', 'Lookup Redmine User by Calling Number '+ctxSessionProps.parameters.callingNumber, dialogContext));
            return await RedmineConnector.populateFromRedmineMobileNumber(ctxSessionProps, ctxSessionProps.parameters.callingNumber, dialogContext);
        } else if (ctxSessionProps.parameters.smsNumber !== '') {
            console.log(fmtLog('populateFromRedmineLookup', 'Lookup Redmine User by SMS Number '+ctxSessionProps.parameters.smsNumber, dialogContext));
            return await RedmineConnector.populateFromRedmineMobileNumber(ctxSessionProps, ctxSessionProps.parameters.smsNumber, dialogContext);
        } else if (ctxSessionProps.parameters.mail !== '') {
            console.log(fmtLog('populateFromRedmineLookup', 'Lookup Redmine User by Email '+ctxSessionProps.parameters.mail, dialogContext));
            return await RedmineConnector.populateFromRedmineEmail(ctxSessionProps, ctxSessionProps.parameters.mail, dialogContext);
        }
        return ctxSessionProps;
    }
    
    static async populateFromRedmineMobileNumber(ctxSessionProps, phoneNumber, dialogContext) {
        console.log('Creating the CTX_AUTH sequence.');
        let context = dialogContext.getOrCreateCtx(CTX_AUTH);
    
        console.log('findRedmineUserByMobilePhone: '+phoneNumber);
        const redmineUsersByMobilePhoneFound = await dialogContext.connectorManager.get(RedmineConnector.name()).findRedmineUserByMobilePhone(phoneNumber);
    
        if (redmineUsersByMobilePhoneFound.length === 0) {
            context.parameters.phoneNumberNotFound = '1';
            dialogContext.dialogflowAgent.context.set(context);
            return ctxSessionProps;
        }
    
        let resultUser = redmineUsersByMobilePhoneFound[0]; // TODO: Handle multiple user disambiguation in future.
        if (resultUser.mobileNumber == null) {
            console.log('Mobile Phone field not found for user: '+JSON.stringify(resultUser));
            context.parameters.phoneNumberNotFound = '1';
            dialogContext.dialogflowAgent.context.set(context);
            return ctxSessionProps;
        }
    
        context.parameters.phoneNumberFound = '1';
        context.parameters.validatedBy = 'Calling Number';
        dialogContext.dialogflowAgent.context.set(context);
    
        ctxSessionProps.parameters.customerIdentified = '1';
        ctxSessionProps.parameters.customerIdentifiedBy = 'Calling Number';
        dialogContext.dialogflowAgent.context.set(ctxSessionProps);
    
        ctxSessionProps = RedmineConnector.populateFromRedmineUser(ctxSessionProps, resultUser);
        dialogContext.dialogflowAgent.context.set(ctxSessionProps);
    
        console.log('findRedmineUserByMobilePhone: ' + JSON.stringify(resultUser));
    
        return ctxSessionProps;
    }

    static async populateFromRedmineEmail(ctxSessionProps, email, dialogContext) {
        console.log('Creating the CTX_AUTH sequence.');
        let context = dialogContext.getOrCreateCtx(CTX_AUTH);
    
        console.log('populateFromRedmineEmail: '+email);
        const redmineUsersByEmailFound = await dialogContext.connectorManager.get(RedmineConnector.name()).findRedmineUsersByEmail(email);
    
        if (redmineUsersByEmailFound.length === 0) {
            context.parameters.emailNotFound = '1';
            dialogContext.dialogflowAgent.context.set(context);
            return ctxSessionProps;
        }
    
        let resultUser = redmineUsersByEmailFound[0]; // TODO: Handle multiple user disambiguation in future.
        if (resultUser.mail == null) {
            console.log('email field not found for user: '+JSON.stringify(resultUser));
            context.parameters.emailNotFound = '1';
            dialogContext.dialogflowAgent.context.set(context);
            return ctxSessionProps;
        }
    
        context.parameters.emailFound = '1';
        context.parameters.validatedBy = 'Email';
        dialogContext.dialogflowAgent.context.set(context);
    
        ctxSessionProps.parameters.customerIdentified = '1';
        ctxSessionProps.parameters.customerIdentifiedBy = 'Email';
        dialogContext.dialogflowAgent.context.set(ctxSessionProps);
    
        ctxSessionProps = RedmineConnector.populateFromRedmineUser(ctxSessionProps, resultUser);
        dialogContext.dialogflowAgent.context.set(ctxSessionProps);
    
        console.log('populateFromRedmineEmail: ' + JSON.stringify(resultUser));
    
        return ctxSessionProps;
    }
        
}

module.exports = {RedmineConnector};