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

// Initializes the SmartHome.
function SmartHome() {
  document.addEventListener('DOMContentLoaded', function () {
    // Shortcuts to DOM Elements.
    this.denyButton = document.getElementById('demo-deny-button');
    this.userWelcome = document.getElementById('user-welcome');

    // Bind events.
    this.updateButton = document.getElementById('demo-washer-update');
    this.updateButton.addEventListener('click', this.updateState.bind(this));
    this.washer = document.getElementById('demo-washer');

    this.ac_updateButton = document.getElementById('demo-ac-update');
    this.ac_updateButton.addEventListener('click', this.ac_updateState.bind(this));
    this.ac = document.getElementById('demo-ac');

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

  this.smarthome.handleData();

  this.smarthome.washer.style.display = "block";
  this.smarthome.ac.style.display = "block";
}

SmartHome.prototype.setToken = (token) => {
  document.cookie = '__session=' + token + ';max-age=3600';
};

SmartHome.prototype.handleData = () => {
  const uid = this.uid;
  const elOnOff = document.getElementById('demo-washer-onOff');
  const elRunCycle = document.getElementById('demo-washer-runCycle');
  const elStartStopPaused = document.getElementById('demo-washer-startStopPaused');
  const elStartStopRunning = document.getElementById('demo-washer-startStopRunning');

  firebase.database().ref('/').child('washer').on("value", (snapshot) => {
    if (snapshot.exists()) {
      const washerState = snapshot.val();
      console.log(washerState)

      if (washerState.OnOff.on) elOnOff.MaterialSwitch.on();
      else elOnOff.MaterialSwitch.off();

      if (washerState.RunCycle.dummy) elRunCycle.MaterialSwitch.on();
      else elRunCycle.MaterialSwitch.off();

      if (washerState.StartStop.isPaused) elStartStopPaused.MaterialSwitch.on();
      else elStartStopPaused.MaterialSwitch.off();

      if (washerState.StartStop.isRunning) elStartStopRunning.MaterialSwitch.on();
      else elStartStopRunning.MaterialSwitch.off();

      const modes = [
        "demo-washer-mode-small",
        "demo-washer-mode-medium",
        "demo-washer-mode-large"
      ];
      modes.forEach((id) => {
        const label = document.getElementById(id);
        label.classList.remove("is-checked");
      });
      let targetLabel;

      switch(washerState.Modes.load){
        case "small":
          document.getElementById(`demo-washer-mode-small-in`).checked = true;
          targetLabel = document.getElementById("demo-washer-mode-small");
          break
        case "medium":
          document.getElementById(`demo-washer-mode-medium-in`).checked = true;
          targetLabel = document.getElementById("demo-washer-mode-small");
          break
        case "large":
          document.getElementById(`demo-washer-mode-large-in`).checked = true;
          targetLabel = document.getElementById("demo-washer-mode-small");
          break
      }
      if (targetLabel) {
        targetLabel.classList.add("is-checked");
      }


    }
  })

  const acOnOff = document.getElementById('demo-ac-onOff');
  firebase.database().ref('/').child('ac').on("value", (snapshot) => {
    if (snapshot.exists()) {
      const acState = snapshot.val();
      console.log(acState)

      if (acState.OnOff.on) acOnOff.MaterialSwitch.on();
      else acOnOff.MaterialSwitch.off();



      switch(acState.Degree.selectedDegree){
        case "28":
          document.getElementById(`demo-ac-degree-28-in`).checked = true;
          break
        case "27":
          document.getElementById(`demo-ac-degree-27-in`).checked = true;
          break
        case "26":
          document.getElementById(`demo-ac-degree-26-in`).checked = true;
          break
      }


    }
  })

}

SmartHome.prototype.updateState = () => {
  const elOnOff = document.getElementById('demo-washer-onOff');
  const elRunCycle = document.getElementById('demo-washer-runCycle');
  const elStartStopPaused = document.getElementById('demo-washer-startStopPaused');
  const elStartStopRunning = document.getElementById('demo-washer-startStopRunning');
  let selectedMode = 'small';

  // 檢查哪個模式被選中
  const modes = ['small', 'medium', 'large']
  for (const mode of modes) {
    const radio = document.getElementById(`demo-washer-mode-${mode}`);
    if (radio.classList.contains('is-checked')) {
      selectedMode = mode;
      break;
    }
  }  

  const pkg = {
    OnOff: { on: elOnOff.classList.contains('is-checked') },
    RunCycle: { dummy: elRunCycle.classList.contains('is-checked') },
    StartStop: {
      isPaused: elStartStopPaused.classList.contains('is-checked'),
      isRunning: elStartStopRunning.classList.contains('is-checked')
    },
    Modes: {
      load: selectedMode
    }
  };

  console.log(pkg);
  firebase.database().ref('/').child('washer').set(pkg);
}

SmartHome.prototype.ac_updateState = () => {
  const acOnOff = document.getElementById('demo-ac-onOff');
  let selectedDegree = '28';

  // 檢查哪個模式被選中
  const degrees = ['28', '27', '26']
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
}
// Load the SmartHome.
window.smarthome = new SmartHome();
