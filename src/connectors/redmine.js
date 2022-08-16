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
const Redmine = require('axios-redmine');

const CXTR_REDMINE_NAME = 'redmine';

class RedmineConnector extends Connector {
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

        this._redmineUsersByAccountFound = [];
        this._redmineUsersByMobilePhoneFound = [];
        this._redmineNewIssue = {};

        this.findRedmineUsersByAccountId = this.findRedmineUsersByAccountId.bind(this);
        this.findRedmineUserByMobilePhone = this.findRedmineUserByMobilePhone.bind(this);
    }

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

    async findRedmineUsersByAccountId(accountId) {
        this._redmineUsersByAccountFound = [];
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
                        this._redmineUsersByAccountFound.push(RedmineConnector.createResponseUser(user));
                    }
                });
            })
            .catch(err => { console.error(err); });

        return this._redmineUsersByAccountFound;
    }

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

    async createRedmineIssue(subject,description,accountNumber,source,initiatorId) {
        this._redmineNewIssue = {};
        const issue = {
            issue: {
                project_id: 11,
                subject: subject,
                description: description,
                //assigned_to_id: 5, // jusranda
                priority_id: 4, // Normal
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
}

module.exports = {CXTR_REDMINE_NAME,RedmineConnector};