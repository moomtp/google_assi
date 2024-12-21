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
        availableFanSpeeds: {
          speeds: [
            {
              speed_name: "low_key",
              speed_values: [
                {
                  speed_synonym: [
                    "Low",
                    "Slow"
                  ],
                  lang: "en"
                }
              ]
            },
            {
              speed_name: "high_key",
              speed_values: [
                {
                  speed_synonym: [
                    "High",
                    "Speed 2"
                  ],
                  lang: "en"
                }
              ]
            }
          ],
          ordered: true
        },
        availableThermostatModes: [
          "off",
          "cool",
          "fan-only",
          "on"
        ],
        thermostatTemperatureUnit: "C"
      },
    };
  }

  async getDeviceStates(snapshotVal) {
    return {
      on: snapshotVal.OnOff.on,
      currentFanSpeedSetting: snapshotVal.SetFanSpeed.currentFanSpeed,
      thermostatMode: snapshotVal.thermostatMode,
      thermostatTemperatureAmbient: 25,
      thermostatTemperatureSetpoint: snapshotVal.TemperatureControl.temperatureSetpointCelsius,

      // temperatureSetpointCelsius: snapshotVal.TemperatureControl.temperatureSetpointCelsius,
      // temperatureAmbientCelsius: snapshotVal.TemperatureControl.temperatureAmbientCelsius
    };
  }

  async executeCommand(command, params) {
    let state;
    switch (command) {
      case 'action.devices.commands.OnOff':
        state = { path: 'OnOff', state: { on: params.on } };
        break;
      case 'action.devices.commands.SetFanSpeed':
        state = { path: 'SetFanSpeed', state: { fanSpeed: params.currentFanSpeed } };
        break;

      case 'action.devices.commands.ThermostatTemperatureSetpoint':
        state = {
          path: 'TemperatureControl',
          state: { 
            thermostatTemperatureSetpoint : params.temperatureSetpointCelsius
          }
        };
        break;

      case 'action.devices.commands.ThermostatSetMode':
        state = { path: 'ThermostatMode', state: { thermostatMode: params.currentMode } };
        break;
      default:
        throw new Error(`Command ${command} not supported`);
    }
    return state;
  }

  getReportStatePayload(snapshot) {
    return {
      on: snapshot.OnOff.on,
      fanSpeed: snapshot.SetFanSpeed.currentFanSpeed,
      thermostatMode: snapshot.thermostatMode.currentMode,
      thermostatTemperatureSetpoint: snapshot.TemperatureControl.temperatureSetpointCelsius,      
    };
  }
}

module.exports = AC;