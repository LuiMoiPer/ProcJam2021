export default function stop(isSongLooping) {
    const states = this.states;

    // If not playing, do nothing //
    if (states.isPlaying == false) return;

    // Put the status in the stopped state. Call the end process //
    states.isPlaying = false;
    states.stopTime = this.context.currentTime;
    states.stopFuncs.forEach((n) => { // Call the stop function of the sound being played
        n.stopFunc();
    });
    states.stopFuncs = [];
    states.playIndices.forEach((n, i, ary) => {
        ary[i] = 0;
    });
    states.noteOnAry = [];
    states.noteOffAry = [];

    // Send stop message when playing on WebMIDI //
    if (this.settings.isWebMIDI) {
        if (isSongLooping)
            return;
        if (this.settings.WebMIDIPortOutput == null)
            return;
        states.webMIDIStopTime = this.context.currentTime;
        setTimeout(() => {
            for (let t=0; t<16; t++) {
                this.settings.WebMIDIPortOutput.send([0xB0+t, 120, 0]);
            }
        }, 1000);
    }

    // Notify callback of outage //
    this.trigger.stop();
    this.fireEvent('pause');
    this.fireEvent('stop');
}