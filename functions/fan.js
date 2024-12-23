'use strict';

class Fan {
  constructor() {
    this.deviceId = 'fan';
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
      type: 'action.devices.types.FAN',
      traits: [
        'action.devices.traits.FanSpeed',
        'action.devices.traits.OnOff',
        // 'action.devices.traits.TemperatureSetting',
      ],
      name: {
        defaultNames: ['My fan'],
        name: 'fan',
        nicknames: ['Fan'],
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
                  "lang": "en"
                },
              ]
            },
            {
              speed_name: "high_key",
              speed_values: [
                {
                  "speed_synonym": [
                    "High"
                  ],
                  lang: "en"
                },
              ]
            }
          ],
        ordered: true
      },

      },
    };
  }

  async getDeviceStates(snapshotVal) {
    return {
      on: snapshotVal.OnOff.on,
      online: true,
      currentFanSpeedSetting: snapshotVal.SetFanSpeed.fanSpeed,
      // thermostatMode: snapshotVal.TemperatureControl.thermostatMode,
      // thermostatTemperatureAmbient: snapshotVal.TemperatureControl.thermostatTemperatureSetpoint,
      // thermostatTemperatureSetpoint: snapshotVal.TemperatureControl.thermostatTemperatureSetpoint,

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

      // case 'action.devices.commands.ThermostatTemperatureSetpoint':
      //   state = {
      //     path: 'TemperatureControl',
      //     state: { 
            // thermostatMode: params.currentMode,
            // thermostatTemperatureAmbient:  params.thermostatTemperatureAmbient,
      //       thermostatTemperatureSetpoint : params.thermostatTemperatureSetpoint
      //     }
      //   };
      //   break;

      // case 'action.devices.commands.ThermostatSetMode':
      //   state = { path: 'TemperatureControl', state: { 
      //     thermostatMode: params.thermostatMode,
          // thermostatTemperatureAmbient:  params.thermostatTemperatureAmbient,
          // thermostatTemperatureSetpoint : params.thermostatTemperatureSetpoint
        // } };
        // break;
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
      // thermostatMode: snapshot.TemperatureControl.thermostatMode,
      // thermostatTemperatureAmbient: snapshot.TemperatureControl.thermostatTemperatureSetpoint,      
      // thermostatTemperatureSetpoint: snapshot.TemperatureControl.thermostatTemperatureSetpoint,      
    };
  }
}

module.exports = Fan;