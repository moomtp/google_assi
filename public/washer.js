'use strict';


class Washer{
  static firebaseRef = null;
  constructor(firebaseRef){
    this.firebaseRef = firebaseRef;
  }

  query = async(data)=>{
    const snapshot = await this.firebaseRef.child('washer').once('value'); 

    const snapshotVal = snapshot.val();

    return {
      on : snapshotVal.OnOff.on,
      isPaused: snapshotVal.StartStop.isPaused,
      isRunning: snapshotVal.StartStop.isRunning,
      currentRunCycle: [{
        currentCycle: 'rinse',
        nextCycle: 'spin',
        lang: 'en',
      }],
      currentTotalRemainingTime: 1212,
      currentCycleRemainingTime: 301,
      // Add currentModeSettings
      currentModeSettings: {
        load: snapshotVal.Modes.load},
    };

  }

  update = async(params, command)=>{
    let state; let ref;
    switch (command) {
      case 'action.devices.commands.OnOff':
        state = {on: params.on};
        ref = this.firebaseRef.child(deviceId).child('OnOff');
        break;

      case 'action.devices.commands.StartStop':
        state = {isRunning: params.start};
        ref = this.firebaseRef.child(deviceId).child('StartStop');
        break;
      case 'action.devices.commands.PauseUnpause':
        state = {isPaused: params.pause};
        ref = this.firebaseRef.child(deviceId).child('StartStop');
        Break;

      case 'action.devices.command.SetModes':
        state = {load : params.updateModeSettings.load};
        ref = this.firebaseRef.child(deviceId).child('Modes');
        break;
    }
    
    return ref.update(state)
        .then(() => state);
  }

  // g var's
  //
  id = 'washer';

  device_info = {
    id: 'washer',
    type: 'action.devices.types.WASHER',
    traits: [
      'action.devices.traits.OnOff',
      'action.devices.traits.StartStop',
      'action.devices.traits.RunCycle',
      // Add Modes trait
      'action.devices.traits.Modes',
    ],
    name: {
      defaultNames: ['My Washer'],
      name: 'Washer',
      nicknames: ['Washer'],
    },
    deviceInfo: {
      manufacturer: 'Acme Co',
      model: 'acme-washer',
      hwVersion: '1.0',
      swVersion: '1.0.1',
    },

    willReportState: true,

    attributes: {
      pausable: true,
      //Add availableModes
      availableModes: [{
        name: 'load',
        name_values: [{
          name_synonym: ['load'],
          lang: 'en',
        }],
        settings: [{
          setting_name: 'small',
          setting_values: [{
            setting_synonym: ['small'],
            lang: 'en',
          }]
        }, {
          setting_name: 'medium',
          setting_values: [{
            setting_synonym: ['medium'],
            lang: 'en',
          }]
        }, {
          setting_name: 'large',
          setting_values: [{
            setting_synonym: ['large'],
            lang: 'en',
          }]
        }],
        ordered: true,
      }],
    },
  };

}

// washer.js
class Front_Washer {
  constructor() {
    this.initializeElements();
    this.bindEvents();
    this.setupFirebase();
  }

  initializeElements() {
    this.updateButton = document.getElementById('demo-washer-update');
    this.washer = document.getElementById('demo-washer');
    this.elOnOff = document.getElementById('demo-washer-onOff');
    this.elRunCycle = document.getElementById('demo-washer-runCycle');
    this.elStartStopPaused = document.getElementById('demo-washer-startStopPaused');
    this.elStartStopRunning = document.getElementById('demo-washer-startStopRunning');
  }

  bindEvents() {
    this.updateButton.addEventListener('click', this.updateState.bind(this));
  }

  setupFirebase() {
    firebase.database().ref('/').child('washer').on("value", (snapshot) => {
      if (snapshot.exists()) {
        this.handleWasherState(snapshot.val());
      }
    });
  }

  handleWasherState(washerState) {
    // Handle OnOff state
    if (washerState.OnOff.on) this.elOnOff.MaterialSwitch.on();
    else this.elOnOff.MaterialSwitch.off();

    // Handle RunCycle state
    if (washerState.RunCycle.dummy) this.elRunCycle.MaterialSwitch.on();
    else this.elRunCycle.MaterialSwitch.off();

    // Handle StartStop states
    if (washerState.StartStop.isPaused) this.elStartStopPaused.MaterialSwitch.on();
    else this.elStartStopPaused.MaterialSwitch.off();

    if (washerState.StartStop.isRunning) this.elStartStopRunning.MaterialSwitch.on();
    else this.elStartStopRunning.MaterialSwitch.off();

    // Handle Modes
    this.updateModeDisplay(washerState.Modes.load);
  }

  updateModeDisplay(selectedLoad) {
    const modes = ["small", "medium", "large"];
    
    // Reset all modes
    modes.forEach((mode) => {
      const label = document.getElementById(`demo-washer-mode-${mode}`);
      label.classList.remove("is-checked");
    });

    // Set selected mode
    document.getElementById(`demo-washer-mode-${selectedLoad}-in`).checked = true;
    const targetLabel = document.getElementById(`demo-washer-mode-${selectedLoad}`);
    targetLabel.classList.add("is-checked");
  }

  updateState() {
    let selectedMode = 'small';
    const modes = ['small', 'medium', 'large'];

    // Check which mode is selected
    for (const mode of modes) {
      const radio = document.getElementById(`demo-washer-mode-${mode}`);
      if (radio.classList.contains('is-checked')) {
        selectedMode = mode;
        break;
      }
    }

    const pkg = {
      OnOff: { on: this.elOnOff.classList.contains('is-checked') },
      RunCycle: { dummy: this.elRunCycle.classList.contains('is-checked') },
      StartStop: {
        isPaused: this.elStartStopPaused.classList.contains('is-checked'),
        isRunning: this.elStartStopRunning.classList.contains('is-checked')
      },
      Modes: {
        load: selectedMode
      }
    };

    firebase.database().ref('/').child('washer').set(pkg);
  }

  show() {
    this.washer.style.display = "block";
  }
}

// Export the class

// export default Front_Washer;
window.Front_Washer = Front_Washer;
// module.exports = {Washer};
