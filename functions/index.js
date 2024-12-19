/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const functions = require('firebase-functions');
const {smarthome} = require('actions-on-google');
const {google} = require('googleapis');
const util = require('util');
const admin = require('firebase-admin');

const Washer = require('./washer')

// Initialize Firebase
admin.initializeApp();
const firebaseRef = admin.database().ref('/');
// Initialize Homegraph
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/homegraph'],
});
const homegraph = google.homegraph({
  version: 'v1',
  auth: auth,
});
// Hardcoded user ID
const USER_ID = '123';

const washer = new Washer

exports.login = functions.https.onRequest((request, response) => {
  if (request.method === 'GET') {
    functions.logger.log('Requesting login page');
    response.send(`
    <html>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <body>
        <form action="/login" method="post">
          <input type="hidden"
            name="responseurl" value="${request.query.responseurl}" />
          <button type="submit" style="font-size:14pt">
            Link this service to Google
          </button>
        </form>
      </body>
    </html>
  `);
  } else if (request.method === 'POST') {
    // Here, you should validate the user account.
    // In this sample, we do not do that.
    const responseurl = decodeURIComponent(request.body.responseurl);
    functions.logger.log(`Redirect to ${responseurl}`);
    return response.redirect(responseurl);
  } else {
    // Unsupported method
    response.send(405, 'Method Not Allowed');
  }
});

exports.fakeauth = functions.https.onRequest((request, response) => {
  const responseurl = util.format('%s?code=%s&state=%s',
      decodeURIComponent(request.query.redirect_uri), 'xxxxxx',
      request.query.state);
  functions.logger.log(`Set redirect as ${responseurl}`);
  return response.redirect(
      `/login?responseurl=${encodeURIComponent(responseurl)}`);
});

exports.faketoken = functions.https.onRequest((request, response) => {
  const grantType = request.query.grant_type ?
    request.query.grant_type : request.body.grant_type;
  const secondsInDay = 86400; // 60 * 60 * 24
  const HTTP_STATUS_OK = 200;
  functions.logger.log(`Grant type ${grantType}`);

  let obj;
  if (grantType === 'authorization_code') {
    obj = {
      token_type: 'bearer',
      access_token: '123access',
      refresh_token: '123refresh',
      expires_in: secondsInDay,
    };
  } else if (grantType === 'refresh_token') {
    obj = {
      token_type: 'bearer',
      access_token: '123access',
      expires_in: secondsInDay,
    };
  }
  response.status(HTTP_STATUS_OK)
      .json(obj);
});

const app = smarthome();

// sync request from google assistant
// in onSync you need to list all of the device list and status
app.onSync((body) => {
// Implement full SYNC response
  return {
    requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
    payload: {
      agentUserId: USER_ID,
      devices: [washer.getDeviceSync()],
    },
  };
});

// query firebase data by deviceId
const queryFirebase = async (deviceId) => {
  const snapshot = await firebaseRef.child(deviceId).once('value');
  return snapshot.val();
};

// eslint-disable-next-line
const queryDevice = async (deviceId) => {
  const data = await queryFirebase(deviceId);
  return await washer.getDeviceStates(data);
  // TODO : Define device states to return
  // return {
  //   on : data.on,
  //   isPaused: data.isPaused,
  //   isRunning: data.isRunning,
  //   currentRunCycle: [{
  //     currentCycle: 'rinse',
  //     nextCycle: 'spin',
  //     lang: 'en',
  //   }],
  //   currentTotalRemainingTime: 1212,
  //   currentCycleRemainingTime: 301,
  //   // Add currentModeSettings
  //   currentModeSettings: {
  //     load: data.load},
  // };
};

app.onQuery(async(body) => {
  // TODO: Implement QUERY response
  const {requestId} = body;
  const payload = {
    devices: {},
  };
  const queryPromises = [];
  const intent = body.inputs[0];
  for (const device of intent.payload.devices) {
    const deviceId = device.id;
    queryPromises.push(
        queryDevice(deviceId)
            .then((data) => {
              // Add response to device payload
              payload.devices[deviceId] = data;
            }) );
  }
  // Wait for all promises to resolve
  await Promise.all(queryPromises);
  return {
    requestId: requestId,
    payload: payload,
  };
});

class SmartHomeError extends Error{
  constructor(errorCode, message){
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
  }
}

// add secondary user verify
class ChallengeNeededError extends SmartHomeError{
  constructor(suvType){
    super('challengeNeeded', suvType);
    this.suvType = suvType;
  }
}

const updateDevice = async (execution, deviceId) => {
  // TODO: Add commands to change device states
  const {params, command} = execution;
  // const {challenge, params, command} = execution; // Add secnod check
  let state; let ref;
  switch (command) {
     case 'action.devices.commands.OnOff':
     state = {on: params.on};
     ref = firebaseRef.child(deviceId).child('OnOff');
     break;
  
    case 'action.devices.commands.StartStop':
      state = {isRunning: params.start};
      ref = firebaseRef.child(deviceId).child('StartStop');
      break;
    case 'action.devices.commands.PauseUnpause':
      state = {isPaused: params.pause};
      ref = firebaseRef.child(deviceId).child('StartStop');
      break;

    // TODO : add setmodes command
    case 'action.devices.commands.SetModes':
      state = {load : params.updateModeSettings.load};
      ref = firebaseRef.child(deviceId).child('Modes');
      break;
  }

  // functions.logger.error("This is an command log", command);

  return ref.update(state)
      .then(() => state);
};

app.onExecute(async (body) => {
  // TODO: Implement EXECUTE response
  const {requestId} = body;
  // Execution results are grouped by status
  const result = {
    ids: [],
    status: 'SUCCESS',
    states: {
      online: true,
    },
  };

  const executePromises = [];
  const intent = body.inputs[0];
  for (const command of intent.payload.commands) {
    for (const device of command.devices) {
      for (const execution of command.execution) {
        executePromises.push(
            updateDevice(execution, device.id)
                .then((data) => {
                  result.ids.push(device.id);
                  Object.assign(result.states, data);
                })
                .catch((error) =>{
                  functions.logger.error('EXECUTE', device.id, error);
                  result.ids.push(device.id);
                  if(error instanceof SmartHomeError){
                    result.status = 'ERROR';
                    result.errorCode = error.errorCode;
                    if(error instanceof ChallengeNeededError){
                      result.challengeNeededError = {
                        type: error.suvType
                      };
                    }
                  }
                })
              );
      }
    }
  }

  await Promise.all(executePromises);
  return {
    requestId: requestId,
    payload: {
      commands: [result],
    },
  };
});

app.onDisconnect((body, headers) => {
  functions.logger.log('User account unlinked from Google Assistant');
  // Return empty response
  return {};
});

exports.smarthome = functions.https.onRequest(app);

exports.requestsync = functions.https.onRequest(async (request, response) => {
  response.set('Access-Control-Allow-Origin', '*');
  functions.logger.info(`Request SYNC for user ${USER_ID}`);

  // TODO: Call HomeGraph API for user '123'
  // response.status(500).send(`Request SYNC not implemented`);
  try {
    const res = await homegraph.devices.requestSync({
      requestBody: {
        agentUserId: USER_ID,
      },
    });
    functions.logger.info('Request sync response:', res.status, res.data);
    response.json(res.data);
  } catch (err) {
    functions.logger.error(err);
    response.status(500).send(`Error requesting sync: ${err}`);
  }
});

/**
 * Send a REPORT STATE call to the homegraph when data for any device id
 * has been changed.
 */
exports.reportstate = functions.database.ref('{deviceId}').onWrite(
    async (change, context) => {
      functions.logger.info('Firebase write event triggered Report State');

      // TODO: Get latest state and call HomeGraph API
      const snapshot = change.after.val();

      const requestBody = {
        requestId: 'ff36a3cc', /* Any unique ID */
        agentUserId: USER_ID,
        payload: {
          devices: {
            states: {
              /* Report the current state of our washer */
              [context.params.deviceId]: {
                on: snapshot.OnOff.on,
                isPaused: snapshot.StartStop.isPaused,
                isRunning: snapshot.StartStop.isRunning,
                // Add currentModeSettings
                currentModeSettings: {
                  load: snapshot.Modes.load,
                },
              },
            },
          },
        },
      };

      const res = await homegraph.devices.reportStateAndNotification({
        requestBody,
      });
      functions.logger.info('Report state response:', res.status, res.data);
    });
