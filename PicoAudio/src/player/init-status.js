export default function initStatus(isSongLooping, isLight) {
    // If you are using WebMIDI, take measures against repeated hits of initStatus () //
    if (this.settings.isWebMIDI) { 
        if (this.states.webMIDIWaitState != null) return;
    }

    // If playing, stop //
    this.stop(isSongLooping);

    // Initialize states //
    this.states = {
        isPlaying: false,
        startTime: 0,
        stopTime: 0,
        stopFuncs: [],
        webMIDIWaitState: null,
        webMIDIStopTime: this.states.webMIDIStopTime,
        playIndices: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        updateBufTime: this.states.updateBufTime,
        updateBufMaxTime: this.states.updateBufMaxTime,
        updateIntervalTime: this.states.updateIntervalTime,
        latencyLimitTime: this.states.latencyLimitTime,
        noteOnAry: [],
        noteOffAry: []
    };

    // WebMIDI initialization / reset message transmission //
    if (this.settings.isWebMIDI && !isLight) {
        if (isSongLooping)
            return;
        if (this.settings.WebMIDIPortOutput == null) {
            this.startWebMIDI();
            return;
        }
        if (this.settings.WebMIDIPortSysEx) {
            // GM1 system on
            this.settings.WebMIDIPortOutput.send([0xF0, 0x7E, 0x7F, 0x09, 0x01, 0xF7]);
        } else {
            // Since the use of SysEx has been refused, reset the setting value to the initial value as much as possible.
            for (let t=0; t<16; t++) {
                this.settings.WebMIDIPortOutput.send([0xC0+t, 0]);
                this.settings.WebMIDIPortOutput.send([0xE0+t, 0, 64]);
                // The deviation per pitch may be severe. I'm not sure.
                this.settings.WebMIDIPortOutput.send([0xB0+t, 100, 0]);
                this.settings.WebMIDIPortOutput.send([0xB0+t, 101, 0]);
                this.settings.WebMIDIPortOutput.send([0xB0+t, 6, 2]); //pitchbend
                this.settings.WebMIDIPortOutput.send([0xB0+t, 100, 1]);
                this.settings.WebMIDIPortOutput.send([0xB0+t, 96, 0]);
                this.settings.WebMIDIPortOutput.send([0xB0+t, 97, 64]); //tuning?
                this.settings.WebMIDIPortOutput.send([0xB0+t, 7, 100]); // volume
                this.settings.WebMIDIPortOutput.send([0xB0+t, 10, 64]); // pan
                this.settings.WebMIDIPortOutput.send([0xB0+t, 11, 127]); // expression
                //this.settings.WebMIDIPortOutput.send([0xB0+t, 91, 40]); // Comment out because it may be set to an effect other than reverb
                //this.settings.WebMIDIPortOutput.send([0xB0+t, 93, 0]); // Comment out because there may be no sound because it is set to an effect other than chorus
                this.settings.WebMIDIPortOutput.send([0xB0+t, 98, 0]);
                this.settings.WebMIDIPortOutput.send([0xB0+t, 99, 0]);
                //this.settings.WebMIDIPortOutput.send([0xB0+t, 121, 0]);
                this.settings.WebMIDIPortOutput.send([0xB0+t, 122, 0]);
            }
        }
    }
}