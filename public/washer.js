'use strict';


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
