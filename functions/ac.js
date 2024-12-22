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
      type: 'action.devices.types.THERMOSTAT',
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
      willReportState: true,

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
        thermostatTemperatureUnit: "C",
        // commandOnlyTemperatureSetting: true,
        // queryOnlyTemperatureSetting: false

      },
    };
  }

  async getDeviceStates(snapshotVal) {
    return {
      on: snapshotVal.OnOff.on,
      online: true,
      currentFanSpeedSetting: snapshotVal.SetFanSpeed.fanSpeed,
      thermostatMode: snapshotVal.TemperatureControl.thermostatMode,
      thermostatTemperatureAmbient: snapshotVal.TemperatureControl.thermostatTemperatureSetpoint,
      thermostatTemperatureSetpoint: snapshotVal.TemperatureControl.thermostatTemperatureSetpoint,

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
        state = { path: 'SetFanSpeed', state: { fanSpeed: params.fanSpeed } };
        break;

      case 'action.devices.commands.ThermostatTemperatureSetpoint':
        state = {
          path: 'TemperatureControl',
          state: { 
            // thermostatMode: params.currentMode,
            // thermostatTemperatureAmbient:  params.thermostatTemperatureAmbient,
            thermostatTemperatureSetpoint : params.thermostatTemperatureSetpoint
          }
        };
        break;

      case 'action.devices.commands.ThermostatSetMode':
        state = { path: 'TemperatureControl', state: { thermostatMode: params.thermostatMode } };
        break;
      default:
        functions.logger.Error("exction command on exec : ", {command})
        throw new Error(`Command ${command} not supported`);
    }
    return state;
  }

  getReportStatePayload(snapshot) {
    return {
      on: snapshot.OnOff.on,
      fanSpeed: snapshot.SetFanSpeed.fanSpeed,
      thermostatMode: snapshot.TemperatureControl.thermostatMode,
      thermostatTemperatureAmbient: snapshot.TemperatureControl.thermostatTemperatureSetpoint,      
      thermostatTemperatureSetpoint: snapshot.TemperatureControl.thermostatTemperatureSetpoint,      
    };
  }
}

module.exports = AC;