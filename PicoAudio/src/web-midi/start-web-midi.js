export default function startWebMIDI() {
    if (!navigator.requestMIDIAccess) return;
    // First time: Request full control of MIDI device from browser (requires use of SysEx)
    // Second time: Request MIDI access without SysEx when full control of a MIDI device is blocked
    let sysEx = this.settings.WebMIDIPortSysEx;
    const midiAccessSuccess = (midiAccess) => {
        const outputs = midiAccess.outputs;
        this.settings.WebMIDIPortOutputs = outputs;
        let output;
        if (this.settings.WebMIDIPort==-1) {
            this.settings.WebMIDIPortOutputs.forEach((o) => {
                if (!output) output = o;
            });
        } else {
            output = this.settings.WebMIDIPortOutputs.get(this.settings.WebMIDIPort);
        }
        this.settings.WebMIDIPortOutput = output;
        this.settings.WebMIDIPortSysEx = sysEx;
        if (output) {
            output.open();
            this.initStatus(); // Call to send a reset event (GM system on, etc.)
        }
        return outputs;
    };
    const midiAccessFailure = (err) => {
        console.log(err);
        if (sysEx) {
            sysEx = false;
            navigator.requestMIDIAccess({sysex: sysEx})
                .then(midiAccessSuccess)
                .catch(midiAccessFailure);
        }
    };
    navigator.requestMIDIAccess({sysex: sysEx})
        .then(midiAccessSuccess)
        .catch(midiAccessFailure);
    // Cut off the sound that is ringing at the end
    window.addEventListener('unload', () => {
        for (let t=0; t<16; t++) {
            this.settings.WebMIDIPortOutput.send([0xB0+t, 120, 0]);
            for (let i=0; i<128; i++) {
                this.settings.WebMIDIPortOutput.send([0x80+t, i, 0]);
            }
        }
    });
}