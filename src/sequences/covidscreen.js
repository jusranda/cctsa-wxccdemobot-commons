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

const { Intent, IntentManager, Sequence, SequenceManager, fmtLog } = require("codingforconvos");
const { RedmineConnector } = require("../connectors/redmine");

// Define Sequence Name Constants.
const SEQ_COVIDSCREEN_NAME = 'covidscreen';

/**
 * Registers the sequences and intents for the authentication module.
 * 
 * @param {SequenceManager} sequenceManager The sequencer manager.
 * @param {IntentManager} intentManager     The intent manager.
 */
 function registerModuleCovidScreen(sequenceManager,intentManager) {
    // Register Sequence.
    sequenceManager.registerSequence(new Sequence({
        name: SEQ_COVIDSCREEN_NAME, // Sequence name, also used for Dialogflow context name.
        activity: 'completing your Covid-19 in-person admittance questionnaire', // Activity description, used in course correction.
        authRequired: false,
        breakIntents: [ // Intents that break from the core flow before attempting sequence navigation.
            { action: 'skill.covidscreen.required', trigger: '1' },
            { action: 'skill.covidscreen.declined', trigger: '1' },
            { action: 'skill.covidscreen.complete.triagenumber', trigger: '1' },
            { action: 'skill.covidscreen.complete.rebookappt', trigger: '1' },
            { action: 'skill.covidscreen.q1a', trigger: '1' },
            { action: 'skill.covidscreen.q1b', trigger: '1' },
            { action: 'skill.covidscreen.q2', trigger: '1' },
            { action: 'skill.covidscreen.q3', trigger: '1' },
            { action: 'skill.covidscreen.q4a', trigger: '1' },
            { action: 'skill.covidscreen.q4b', trigger: '1' },
            { action: 'skill.covidscreen.q5a', trigger: '1' },
            { action: 'skill.covidscreen.q5b', trigger: '1' },
            { action: 'skill.covidscreen.q6a', trigger: '1' },
            { action: 'skill.covidscreen.q6b', trigger: '1' },
        ],
        params: {
            accepted: '0',
            declined: '0',

            q1acomplete: '0',
            q1aresult: '',
            q1brequired: '0',
            q1bcomplete: '0',
            q1bresult: '',

            q2complete: '0',
            q2result: '',

            q3complete: '0',
            q3result: '',

            q4acomplete: '0',
            q4aresult: '',
            q4brequired: '0',
            q4bcomplete: '0',
            q4bresult: '',

            q5acomplete: '0',
            q5aresult: '',
            q5brequired: '0',
            q5bcomplete: '0',
            q5bresult: '',

            q6acomplete: '0',
            q6aresult: '',
            q6brequired: '0',
            q6bcomplete: '0',
            q6bresult: '',

            triagePassOrFail: '',
            triageNumber: '',
            rebookOffered: '0',
            rebookAccepted: '0',
            rebookDeclined: '0'
        },
        createCase: (contextManager, agent, ctxSessionProps) => { // Create a case.
            let newCase = {
                subject: 'Failed to identify navigate conversation.',
                description: 'Something went wrong.',
                note: 'Case created.'
            };
            return newCase;
        },
        navigate: (dialogContext) => { // Navigate the sequence forward.
            let context = dialogContext.getOrCreateCtx(SEQ_COVIDSCREEN_NAME);

            if (context.parameters.triagePassOrFail !== '') {
                if (context.parameters.triagePassOrFail === 'pass') {
                    let event = dialogContext.respondWithEvent('CovidScreenTriageNumber');
                    return;
                } else {
                    if (context.parameters.rebookOffered === '0') {
                        let event = dialogContext.respondWithEvent('CovidScreenRebookAppt');
                        return;
                    }

                    if (context.parameters.rebookAccepted === '1') {
                        let event = dialogContext.respondWithEvent('EscalateToAgent', dialogContext.params.lastFulfillmentText);
                        return;
                    } else {
                        dialogContext.resetOfferedAgentFlags();
                        console.log('Calling popSequenceAndNavigate');
                        dialogContext.popSequenceAndNavigate(SEQ_COVIDSCREEN_NAME);
                        return;
                    }
                }
            }

            if (context.parameters.accepted === '0' && context.parameters.declined === '0') {
                let event = dialogContext.respondWithEvent('CovidScreenRequired');
                return;
            }
    
            if (context.parameters.declined === '1') {
                let event = dialogContext.respondWithEvent('CovidScreenDeclined');
                return;
            }
    
            if (context.parameters.accepted === '1') {
                if (context.parameters.q1acomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ1A');
                    return;
                }
                if (context.parameters.q1brequired === '1' && context.parameters.q1bcomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ1B');
                    return;
                }

                if (context.parameters.q2complete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ2');
                    return;
                }

                if (context.parameters.q3complete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ3');
                    return;
                }

                if (context.parameters.q4acomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ4A');
                    return;
                }
                if (context.parameters.q4brequired === '1' && context.parameters.q4bcomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ4B');
                    return;
                }

                if (context.parameters.q5acomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ5A');
                    return;
                }
                if (context.parameters.q5brequired === '1' && context.parameters.q5bcomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ5B');
                    return;
                }

                if (context.parameters.q6acomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ6A');
                    return;
                }

                if (context.parameters.q6brequired === '1' && context.parameters.q6bcomplete === '0') {
                    let event = dialogContext.respondWithEvent('CovidScreenQ6B');
                    return;
                }

                let event = dialogContext.respondWithEvent('CovidScreenComplete');
                return;
            }
    
            console.log(fmtLog('authentication.navigate', 'action: '+dialogContext.currentAction+', lastFulfillmentText: '+dialogContext.params.lastFulfillmentText, dialogContext));
            dialogContext.respondWithText();
            return;
        }
    }));

    function summarizeTriage (dialogContext) {
        let context = dialogContext.getOrCreateCtx(SEQ_COVIDSCREEN_NAME);

        let triage = {};
        let symptoms = [];

        let passOrFail = 'pass';

        triage.diagnosedWithCovid = context.parameters.q1aresult;
        if (triage.diagnosedWithCovid === 'true') {
            passOrFail = 'fail';
            triage.diagnosedWithCovidDate = context.parameters.q1bresult;
        }

        triage.livesWithCovid = context.parameters.q2result;

        if (context.parameters.q3result === 'true') {
            passOrFail = 'fail';
            symptoms.push('fever');
        }

        if (context.parameters.q4aresult === 'true') {
            passOrFail = 'fail';
            symptoms = symptoms.concat(context.parameters.q4bresult);
        }
        if (context.parameters.q5aresult === 'true') {
            passOrFail = 'fail';
            symptoms = symptoms.concat(context.parameters.q5bresult);
        }

        if (context.parameters.q6aresult === 'true') {
            passOrFail = 'fail';
            triage.countryName = context.parameters.q6bresult;
        }
        triage.symptoms = symptoms;

        triage.passOrFail = passOrFail;

        return triage;
    }
    
    // Register Intent Handlers.
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.required',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            return;
        }
    }));
    intentManager.registerIntents({
        actions: [
            'skill.covidscreen.required.confirmation.yes',
            'skill.covidscreen.required.confirmation.able'
        ],
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'accepted': '1',
                'declined': '0'
            });
            dialogContext.deleteCtx('skillcovidscreenrequired-followup');
            return;
        }
    });
    intentManager.registerIntents({
        actions: [
            'skill.covidscreen.required.confirmation.no',
            'skill.covidscreen.required.confirmation.notable'
        ],
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'declined': '1'
            });
            dialogContext.deleteCtx('skillcovidscreenrequired-followup');
            return;
        }
    });

    intentManager.registerIntents({
        actions: [
            'skill.covidscreen.q1a',
            'skill.covidscreen.q1b',
            'skill.covidscreen.q2',
            'skill.covidscreen.q3',
            'skill.covidscreen.q4a',
            'skill.covidscreen.q4b',
            'skill.covidscreen.q5a',
            'skill.covidscreen.q5b',
            'skill.covidscreen.q6a',
            'skill.covidscreen.q6b'
        ],
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.appendFulfillmentText();
            return;
        }
    });

    // Question #1 Intents
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q1a.confirmation.yes',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q1acomplete': '1',
                'q1aresult': 'true',
                'q1brequired': '1'
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q1a.confirmation.no',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q1acomplete': '1',
                'q1aresult': 'false',
                'q1brequired': '0'
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q1b.confirmation.yes',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q1bcomplete': '1',
                'q1bresult': 'true' // FIXME: this should be an input parameter.
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q1b.confirmation.no',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q1bcomplete': '1',
                'q1bresult': 'false' // FIXME: this should be an input parameter.
            });
            return;
        }
    }));

    function registerCommonCovidQuestion(questionId) {
        intentManager.registerIntent(new Intent({
            action: 'skill.covidscreen.'+questionId+'.confirmation.yes',
            sequenceName: SEQ_COVIDSCREEN_NAME,
            handler: (dialogContext) => {
                dialogContext.setFulfillmentText();
                dialogContext.setCurrentParams({
                    [questionId+'complete']: '1',
                    [questionId+'result']: 'true'
                });
                return;
            }
        }));
        intentManager.registerIntent(new Intent({
            action: 'skill.covidscreen.'+questionId+'.confirmation.no',
            sequenceName: SEQ_COVIDSCREEN_NAME,
            handler: (dialogContext) => {
                dialogContext.setFulfillmentText();
                dialogContext.setCurrentParams({
                    [questionId+'complete']: '1',
                    [questionId+'result']: 'false'
                });
                return;
            }
        }));
    }

    const commonQuestions = ['q2', 'q3'];
    commonQuestions.forEach(questionId => registerCommonCovidQuestion(questionId));

    // Question #4 Intents
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q4a.healthcare.symptoms',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q4acomplete': '1',
                'q4aresult': 'true',
                'q4bcomplete': '1',
                'q4bresult': dialogContext.inparams.symptoms
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q4a.confirmation.yes',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q4acomplete': '1',
                'q4aresult': 'true',
                'q4brequired': '1'
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q4a.confirmation.no',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q4acomplete': '1',
                'q4aresult': 'false',
                'q4brequired': '0'
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q4b.healthcare.symptoms',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q4bcomplete': '1',
                'q4bresult': dialogContext.inparams.symptoms
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q4b.confirmation.yes',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q4bcomplete': '1',
                'q4bresult': 'true' // FIXME: this should be an input parameter.
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q4b.confirmation.no',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q4bcomplete': '1',
                'q4bresult': 'false' // FIXME: this should be an input parameter.
            });
            return;
        }
    }));

    // Question #5 Intents
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q5a.healthcare.symptoms',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q5acomplete': '1',
                'q5aresult': 'true',
                'q5bcomplete': '1',
                'q5bresult': dialogContext.inparams.symptoms
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q5a.confirmation.yes',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q5acomplete': '1',
                'q5aresult': 'true',
                'q5brequired': '1'
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q5a.confirmation.no',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q5acomplete': '1',
                'q5aresult': 'false',
                'q5brequired': '0'
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q5b.healthcare.symptoms',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q5bcomplete': '1',
                'q5bresult': dialogContext.inparams.symptoms
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q5b.confirmation.yes',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q5bcomplete': '1',
                'q5bresult': 'true' // FIXME: this should be an input parameter.
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q5b.confirmation.no',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q5bcomplete': '1',
                'q5bresult': 'false' // FIXME: this should be an input parameter.
            });
            return;
        }
    }));

    // Question #6 Intents
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q6a.common.countries',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q6acomplete': '1',
                'q6aresult': 'true',
                'q6bcomplete': '1',
                'q6bresult': dialogContext.inparams.countryName
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q6a.confirmation.yes',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q6acomplete': '1',
                'q6aresult': 'true',
                'q6brequired': '1'
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q6a.confirmation.no',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q6acomplete': '1',
                'q6aresult': 'false',
                'q6brequired': '0'
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q6b.common.countries',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q6bcomplete': '1',
                'q6bresult': dialogContext.inparams.countryName
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q6b.confirmation.yes',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q6bcomplete': '1',
                'q6bresult': 'true' // FIXME: this should be an input parameter.
            });
            return;
        }
    }));
    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.q6b.confirmation.no',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'q6bcomplete': '1',
                'q6bresult': 'false' // FIXME: this should be an input parameter.
            });
            return;
        }
    }));


    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.complete',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: async (dialogContext) => {
            dialogContext.appendFulfillmentText();

            const triage = summarizeTriage(dialogContext);
            const newCase = {};
            newCase.subject = 'Covid-19 In-person Admittance Triage Complete';
            newCase.description = dialogContext.params.customerFirstName+' has completed the Covid-19 admittance screening required before arriving for in-person appointments.';

            if (triage.passOrFail === 'pass') {
                dialogContext.setCurrentParam('triagePassOrFail', 'pass');
                newCase.statusId = 12;
            } else {
                dialogContext.setCurrentParam('triagePassOrFail', 'fail');
                newCase.statusId = 6;
            }

            const redmineApi = dialogContext.connectorManager.get(RedmineConnector.name());
            const redmineNewTriage = await redmineApi.createRedmineTriage(newCase, dialogContext, triage);
        
            console.log('redmineNewTriage.id: '+redmineNewTriage.id);

            dialogContext.setSessionParam('redmineOpenCaseId', redmineNewTriage.id);
            dialogContext.setCurrentParam('triageNumber', redmineNewTriage.id);

            //console.log('Calling popSequenceAndNavigate '+SEQ_COVIDSCREEN_NAME);
            //dialogContext.popSequenceAndNavigate(SEQ_COVIDSCREEN_NAME);
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.complete.triagenumber',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: async (dialogContext) => {
            dialogContext.appendFulfillmentText();
            return;
        }
    }));

    intentManager.registerIntent(new Intent({
        action: 'skill.covidscreen.complete.rebookappt',
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: async (dialogContext) => {
            dialogContext.appendFulfillmentText();
            return;
        }
    }));

    intentManager.registerIntents({
        actions: [
            'skill.covidscreen.complete.rebookappt.confirmation.yes',
            'skill.covidscreen.complete.rebookappt.confirmation.able'
        ],
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'rebookOffered': '1',
                'rebookAccepted': '1',
                'rebookDeclined': '0'
            });
            return;
        }
    });
    intentManager.registerIntents({
        actions: [
            'skill.covidscreen.complete.rebookappt.confirmation.no',
            'skill.covidscreen.complete.rebookappt.confirmation.notable'
        ],
        sequenceName: SEQ_COVIDSCREEN_NAME,
        handler: (dialogContext) => {
            dialogContext.setFulfillmentText();
            dialogContext.setCurrentParams({
                'rebookOffered': '1',
                'rebookAccepted': '0',
                'rebookDeclined': '1'
            });
            return;
        }
    });

}

module.exports = {registerModuleCovidScreen};