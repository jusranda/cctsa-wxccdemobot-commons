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
const {google} = require('googleapis');

const CXTR_GOOGLECAL_NAME = 'googlecalendar';

/**
 * A Connector for the Redmine REST API.
 */
 class GoogleCalendarConnector extends Connector {
    /**
     * Construct a new GoogleCalendarConnector instance.
     * 
     * @example
     * const GoogleCalendarConnector = new GoogleCalendarConnector({
     *     calendarId: 'q54k3putxbjq8qjfed0tfemo98@group.calendar.google.com',
     *     serviceAccount: {
     *          "type": "service_account",
     *          "project_id": "cctsa-agent12-dewgt",
     *          "private_key_id": "21bg8013f64b7jy32f78ff9daa0817211q1r1367",
     *          "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCGKkwggSlAgEAAoIBVQC6Z+efXxJq4W+U\nJpdh6N8W+tUqT47ucfkjfywXeYYE4qUS0WqwUDDyfYXxA4Ze/iGghOh+WmF/89+y\nLTe3CgS6mMa8NW1SXCFq7Cf0p27jSfc7N2x7q7u9HPJjklsbe0JEyypVZGXDS1Gr\np7Rcm0zjCoH8uTGS8k21M6nCSM8zfF3atLyRrojAW6Sd9ouTRozf44UQdYrVIIlZ\nTQDPOpHKoo4KTlTO2HB9cNwAFCp56OilCXkUL7QsA11zmztqFmrNLSgj35IgD4zl\n+oTcOx2Rzg6BBbUmyb3cB1dnfsUUhq2QKgR2e5y2srO8Bgw47CV8n3MeyHUjFz9w\n2D1EruvVAgMBAAECggEABBgh6mf6enD9J7xDUNTcwIn+kJaSitLj7AyFi6HRW8ke\nRvq6brTL+9UzJ0zkW7Dp90kaCzCcJMNXCPiBL1sf0yOpIMMXEEX9kUuimGxB8j9n\nsSX8vajTupS+DzRMyR6c9vBJu/o1MBHBt8DlpFqLHA/ZND6zWUmhLcJ2pSc+r3Wv\nO76bKg47a9MdEmcmdE7icGY8UgXXKcLPfeWrcOkaZS4+ErFDOgBkjn+RFQQB4/jP\nlVTXcrKwJpKv6RETbOlid5oTmf1ILEC6XsOAnOav+KuJQFDAGCHt64xAYOuFXDzr\njCvcYFrOpn/OEht1+S89E1mHdXUtxLH00TaK5vKZUQKBgQDqbrrRHMOSm62uUZVs\nSTXRN13d7awF2NzegmJqQ/EUFU/CFYLbvlSlWlfOP2Yzny4j276SpO7sfSv9vlMN\nFqVPPvdWWdOIkOmWk2pW4GkMlEYg+hOhSg4QDEtK87HRW16A7nb5Gwa/EeNw87dz\nMOY8h3ae6RfiuK360ICWikIEPQKBgQDLgPwoj5siWIBnpFII5OWpcVgJxJ1GHZsw\nJr+ts++PQoe0tLK2zW8ZatjiRCzXD9Np4FxGUfONtDQ/L2b4mnn1t2wKnR1I2WWQ\nAEPlfR2Qf0Ne9ZDHV0L5YTtlHRUeM1+B/PxJ7v8aZXZKPGdbTzkomAEQ1190qCf7\n9zEyXGZHeQKBgQDaBj0sOYoRkUNHuYwz9ypb9xgPS/kOPw+6yJvqpGFTAjb5E7Rt\n1Wc3mPvMTt4n6ESrCLUGAOpLemYtSJJIu+Tl/HNfFY9LlSoI5fSh83b/Qe6uwKT8\n/bhyaFylylp3kHglhKGVLvNpQ6O46pCUSsf1Ry6kv7d9HbCAcOUGHHMlKQKBgQCE\nsLm6CMjygBpZeb8zpWxKK2loFRcnXK6PmvRoYmbVVl/958SPhSvnus9n2WQTZnJH\nGs+P2megAdv/Rv0xJChZmxuLYB50HawnVMTwob/hM9nN1PhtwewdhtSffXMDmiOw\nMjCeVINpxrZ2eSQ7WVC/sz0eqg/HlM1dcTRWzgCyoQKBgQCUF9KP0ZezFGrHtWxg\ntF6oX6mm0LytdOT3hy948McBkg52GWcrQmuVY/e+M64VJYyvh5BSRcEc+DfeCOe9\n1Ov+XdwmMsBG45+OBMR4hTc4r7apzB27jmk3QTfmnoO8b1hgNBIflIcELdyXesvs\nxWXaCwb4KP7CeVhs2QpE1LS30w==\n-----END PRIVATE KEY-----\n",
     *          "client_email": "cal-sched@cctsa-agent12-dewgt.iam.gserviceaccount.com",
     *          "client_id": "105169793025930566244",
     *          "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     *          "token_uri": "https://oauth2.googleapis.com/token",
     *          "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     *          "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/cal-sched%40tsa-agent2-yjie.iam.gserviceaccount.com"
     *     }
     * });
     * 
     * @param {Object} params The constructor parameters.
     */
    constructor(params) {
        if (params.calendarId == undefined) { throw new Error('calendarId is a required parameter for GoogleCalendarConnector objects.'); }
        if (params.serviceAccount == undefined) { throw new Error('serviceAccount is a required parameter for GoogleCalendarConnector objects.'); }

        // Create Google Calendar API client.
        params.endpoint = google.calendar('v3');

        params.name = CXTR_GOOGLECAL_NAME;
        params.params = params;

        super(params);

        /**
         * The Google calendar ID.
         * 
         * @private
         * @type {string}
         */
        this._calendarId = params.calendarId;

        /**
         * The Google service account details.
         * 
         * @private
         * @type {string}
         */
        this._serviceAccount = params.serviceAccount;

        /**
         * The Google service account authentication config.
         * 
         * @private
         * @type {Object}
         */
        this._serviceAccountAuth = new google.auth.JWT({
            email: this._serviceAccount.client_email,
            key: this._serviceAccount.private_key,
            scopes: 'https://www.googleapis.com/auth/calendar'
        });

        this.createCalendarEvent = this.createCalendarEvent.bind(this);
    }

    /**
     * Get the static name of the connector.
     * 
     * @returns the static name of the connector.
     */
    static name() {
        return CXTR_GOOGLECAL_NAME;
    }

    /**
     * Checks if the chosen calendar window is available.
     * 
     * @param {Date} dateTimeStart  The appointment start time.
     * @param {Date} dateTimeEnd    The appointment end time.
     * @returns true if the timeslot is available, otherwise, false;
     */
    async isAvailable(dateTimeStart, dateTimeEnd) {
        let result = true;
        return new Promise((resolve, reject) => {
            super.endpoint.events.list({ // List events for time period
                auth: this._serviceAccountAuth,
                calendarId: this._calendarId,
                timeMin: dateTimeStart.toISOString(),
                timeMax: dateTimeEnd.toISOString()
            }, (err, calendarResponse) => {
                if (err) {
                    console.error('err: '+err.stack);
                    reject(err || new Error('An error occured when booking the appointment'));
                } else {
                    console.log('calendarResponse: '+calendarResponse);
                    console.log('calendarResponse.stringify: '+JSON.stringify(calendarResponse));

                    if (calendarResponse.data.items.length > 0) {
                        result = false;
                    }

                    resolve(result);
                }
            });
        });
    }

    /**
     * Create a new Google Calendar event.
     * 
     * @param {Date} dateTimeStart        The start date/time of the event.
     * @param {Date} dateTimeEnd          The end date/time of the event.
     * @param {string} appointment_type     The appointment type.
     * @returns 
     */
    async createCalendarEvent (dateTimeStart, dateTimeEnd, appointment_type) {
        return new Promise((resolve, reject) => {
            super.endpoint.events.list({ // List events for time period
                auth: this._serviceAccountAuth,
                calendarId: this._calendarId,
                timeMin: dateTimeStart.toISOString(),
                timeMax: dateTimeEnd.toISOString()
            }, (err, calendarResponse) => {
                if (err) {
                    // Create event for the requested time period
                    
                    console.log('err: '+err);
                    console.log('calendarResponse: '+calendarResponse);
                    console.log('calendarResponse.stringify: '+JSON.stringify(calendarResponse));

                    // Check if there is a event already on the Calendar
                    reject(err || new Error('An error occured when booking the appointment'));
                } else if (calendarResponse.data.items.length > 0) {
                    // Create event for the requested time period
                    console.log('calendarResponse: '+calendarResponse);
                    console.log('calendarResponse.stringify: '+JSON.stringify(calendarResponse));

                    // Check if there is a event already on the Calendar
                    reject(err || new Error('Requested time conflicts with another appointment'));
                } else {
                    // Create event for the requested time period
                    console.log('calendarResponse: '+calendarResponse);
                    console.log('calendarResponse.stringify: '+JSON.stringify(calendarResponse));

                    super.endpoint.events.insert({
                        auth: this._serviceAccountAuth,
                        calendarId: this._calendarId,
                        resource: {
                            summary: appointment_type +' Appointment', description: appointment_type,
                            start: {dateTime: dateTimeStart},
                            end: {dateTime: dateTimeEnd},
                            // TODO: Fix Error: Service accounts cannot invite attendees without Domain-Wide Delegation of Authority.
                            //attendees: [
                            //    {'email': 'jusranda@cisco.com'},
                            //    {'email': 'justin@outofservice.org'}
                            //],
                        }
                    }, (err, event) => {
                        err ? reject(err) : resolve(event);
                    });
                }
            });
        });
    }
}

module.exports = {GoogleCalendarConnector};
