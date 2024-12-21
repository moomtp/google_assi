'use strict';

class AC {
  constructor() {
    this.deviceId = 'ac';
    this.deviceInfo = {
      manufacturer: 'Acme Co',
      model: 'acme-ac',
      hwVersion: '1.0',
      swVersion: '1.0.1',
    };
  }

  getDeviceSync() {
    return {
      id: this.deviceId,
      type: 'action.devices.types.AC_UNIT',
      traits: [
        'action.devices.traits.FanSpeed',
        'action.devices.traits.OnOff',
        'action.devices.traits.TemperatureSetting',
      ],
      name: {
        defaultNames: ['My ac'],
        name: 'AC',
        nicknames: ['AC'],
      },
      deviceInfo: this.deviceInfo,
      willReportState: true,
      attributes: {
        pausable: true,
        availableModes: [{
          name: '',
          name_values: [{
            name_synonym: ['load'],
            lang: 'en',
          }],
          settings: [{
            setting_name: 'cool',
            setting_values: [{
              setting_synonym: ['cool'],
              lang: 'en',
            }]
          }, {
            setting_name: 'heat',
            setting_values: [{
              setting_synonym: ['heat'],
              lang: 'en',
            }]
          }, {
            setting_name: 'fan',
            setting_values: [{
              setting_synonym: ['fan'],
              lang: 'en',
            }]
          }],
          ordered: true,
        }],
          temperatureRange: {
          minThresholdCelsius: 16,
          maxThresholdCelsius: 32
        },
        temperatureUnitForUX: 'C',
        commandOnlyTemperatureControl: false
      },
    };
  }

  async getDeviceStates(snapshotVal) {
    return {
      on: snapshotVal.OnOff.on,
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
      temperatureSetpointCelsius: snapshotVal.TemperatureControl.temperatureSetpointCelsius,
      // temperatureAmbientCelsius: snapshotVal.TemperatureControl.temperatureAmbientCelsius
    };
  }

  async executeCommand(command, params) {
    let state;
    switch (command) {
      case 'action.devices.commands.OnOff':
        state = { path: 'OnOff', state: { on: params.on } };
        break;
      case 'action.devices.commands.SetModes':
        state = { path: 'Modes', state: { load: params.updateModeSettings.load } };
        break;

      case 'action.devices.commands.ThermostatTemperatureSetpoint':
        state = {
          path: 'TemperatureControl',
          state: { 
            temperatureSetpointCelsius: params.temperature
          }
        };
        break;
      default:
        throw new Error(`Command ${command} not supported`);
    }
    return state;
  }

  getReportStatePayload(snapshot) {
    return {
      on: snapshot.OnOff.on,
      currentModeSettings: {
        load: snapshot.Modes.load,
      },
      temperatureSetpointCelsius: snapshot.TemperatureControl.temperatureSetpointCelsius,      
    };
  }
}

module.exports = AC;