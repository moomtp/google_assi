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
const AC = require('./ac')
const Fan = require('./fan')

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

const washer = new Washer();
const ac = new AC();
const fan = new Fan();

const devices = {
  'washer': washer,
  'ac': ac,
  'fan': fan  
};

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
      devices: [
        washer.getDeviceSync(),
        ac.getDeviceSync(),
        fan.getDeviceSync()
      ],
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
  const device = devices[deviceId];
  if(!device){ throw new Error(`Device ${devcie} not found`);}

  const data = await queryFirebase(deviceId);

  return await device.getDeviceStates(data);
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
          payload.devices[deviceId] = data;
        })
        .catch((error) => {
          functions.logger.error(`Error querying device ${deviceId}:`, error);
          payload.devices[deviceId] = { errorCode: 'deviceOffline' };
        })
    );
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
  // Add commands to change device states
  const device = devices[deviceId];
  if(!device) throw new Error(`Devcie ${deviceId} not found`);

  const {params, command} = execution;
  // const {challenge, params, command} = execution; // Add secnod check
  const commandResult = await device.executeCommand(command, params);
  const ref = firebaseRef.child(deviceId).child(commandResult.path);

  // functions.logger.error("This is a command ", {command});
  // functions.logger.error("This is a params ", {params});
  // functions.logger.error("This is a command result", {commandResult});
  // functions.logger.error("This is a ref", ref);

  return ref.update(commandResult.state)
      .then(() => commandResult.state);
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

      const deviceId = context.params.deviceId;
      const device = devices[deviceId];
      if(!device){
        functions.logger.error(`Devcie ${deviceId} not found`);
        return;
      } 
      // Get latest state and call HomeGraph API
      const snapshot = change.after.val();
      const deviceStates = device.getReportStatePayload(snapshot);

      const requestBody = {
        requestId: 'ff36a3cc', /* Any unique ID */
        agentUserId: USER_ID,
        payload: {
          devices: {
            states: {
              /* Report the current state of our washer */
              [deviceId] : deviceStates,
            },
          },
        },
      };

      functions.logger.info('Report deviceId:', {deviceId});
      functions.logger.info('Report deviceStates:', {deviceStates});
      functions.logger.info('Report requestBody:', {requestBody});

      // TODO : here should be a report message function
      const res = await homegraph.devices.reportStateAndNotification(
        requestBody,
      );
      functions.logger.info('Report state response:', res.status, res.data);
    });
