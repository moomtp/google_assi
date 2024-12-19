'use strict';

class Washer {
  constructor() {
    this.deviceId = 'washer';
    this.deviceInfo = {
      manufacturer: 'Acme Co',
      model: 'acme-washer',
      hwVersion: '1.0',
      swVersion: '1.0.1',
    };
  }

  getDeviceSync() {
    return {
      id: this.deviceId,
      type: 'action.devices.types.WASHER',
      traits: [
        'action.devices.traits.OnOff',
        'action.devices.traits.StartStop',
        'action.devices.traits.RunCycle',
        'action.devices.traits.Modes',
      ],
      name: {
        defaultNames: ['My Washer'],
        name: 'Washer',
        nicknames: ['Washer'],
      },
      deviceInfo: this.deviceInfo,
      willReportState: true,
      attributes: {
        pausable: true,
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

  async getDeviceStates(snapshotVal) {
    return {
      on: snapshotVal.OnOff.on,
      isPaused: snapshotVal.StartStop.isPaused,
      isRunning: snapshotVal.StartStop.isRunning,
      currentRunCycle: [{
        currentCycle: 'rinse',
        nextCycle: 'spin',
        lang: 'en',
      }],
      currentTotalRemainingTime: 1212,
      currentCycleRemainingTime: 301,
      currentModeSettings: {
        load: snapshotVal.Modes.load
      },
    };
  }

  async executeCommand(command, params) {
    let state;
    switch (command) {
      case 'action.devices.commands.OnOff':
        state = { path: 'OnOff', state: { on: params.on } };
        break;
      case 'action.devices.commands.StartStop':
        state = { path: 'StartStop', state: { isRunning: params.start } };
        break;
      case 'action.devices.commands.PauseUnpause':
        state = { path: 'StartStop', state: { isPaused: params.pause } };
        break;
      case 'action.devices.commands.SetModes':
        state = { path: 'Modes', state: { load: params.updateModeSettings.load } };
        break;
      default:
        throw new Error(`Command ${command} not supported`);
    }
    return state;
  }

  getReportStatePayload(snapshot) {
    return {
      on: snapshot.OnOff.on,
      isPaused: snapshot.StartStop.isPaused,
      isRunning: snapshot.StartStop.isRunning,
      currentModeSettings: {
        load: snapshot.Modes.load,
      },
    };
  }
}

module.exports = Washer;