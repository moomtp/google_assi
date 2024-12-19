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

module.exports = {Washer};
