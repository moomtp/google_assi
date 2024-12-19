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
// import Front_Washer from "./washer.js";


function SmartHome() {
  document.addEventListener('DOMContentLoaded', function () {
    // Shortcuts to DOM Elements.
    this.denyButton = document.getElementById('demo-deny-button');
    this.userWelcome = document.getElementById('user-welcome');

    // Initialize AC component
    this.ac_updateButton = document.getElementById('demo-ac-update');
    this.ac_updateButton.addEventListener('click', this.ac_updateState.bind(this));
    this.ac = document.getElementById('demo-ac');

    // Initialize Request Sync
    this.requestSync = document.getElementById('request-sync');
    this.requestSync.addEventListener('click', async () => {
      try {
        const response = await fetch('/requestsync');
        console.log(response.status == 200 ?
          'Request SYNC success!' : `Request SYNC unexpected status: ${response.status}`);
      } catch (err) {
        console.error('Request SYNC error', err);
      }
    });

    this.initFirebase();
    this.initWeb();
  }.bind(this));
}

SmartHome.prototype.initFirebase = () => {
  // Initiates Firebase.
  console.log("Initialized Firebase");
};

SmartHome.prototype.initWeb = () => {
  console.log("Logged in as default user");
  this.uid = "123";
  this.smarthome.userWelcome.innerHTML = "Welcome!";

  // Initialize Washer
  this.washer = new Front_Washer();

  this.washer.show();

  // Initialize AC display
  this.smarthome.ac.style.display = "block";

  // Handle AC data
  this.smarthome.handleACData();
};

SmartHome.prototype.setToken = (token) => {
  document.cookie = '__session=' + token + ';max-age=3600';
};

SmartHome.prototype.handleACData = () => {
  const acOnOff = document.getElementById('demo-ac-onOff');
  firebase.database().ref('/').child('ac').on("value", (snapshot) => {
    if (snapshot.exists()) {
      const acState = snapshot.val();
      console.log(acState)

      if (acState.OnOff.on) acOnOff.MaterialSwitch.on();
      else acOnOff.MaterialSwitch.off();

      switch(acState.Degree.selectedDegree) {
        case "28":
          document.getElementById(`demo-ac-degree-28-in`).checked = true;
          break;
        case "27":
          document.getElementById(`demo-ac-degree-27-in`).checked = true;
          break;
        case "26":
          document.getElementById(`demo-ac-degree-26-in`).checked = true;
          break;
      }
    }
  });
};

SmartHome.prototype.ac_updateState = () => {
  const acOnOff = document.getElementById('demo-ac-onOff');
  let selectedDegree = '28';

  const degrees = ['28', '27', '26'];
  for (const degree of degrees) {
    const radio = document.getElementById(`demo-ac-degree-${degree}`);
    if (radio.classList.contains('is-checked')) {
      selectedDegree = degree;
      break;
    }
  }  

  const pkg = {
    OnOff: { on: acOnOff.classList.contains('is-checked') },
    Degree: {selectedDegree}
  };

  console.log(pkg);
  firebase.database().ref('/').child('ac').set(pkg);
};

// Load the SmartHome.
window.smarthome = new SmartHome();