import PicoAudio from "../PicoAudio/src/main.js";

class AdaptiveAudio {
    picoAudio;
    midiData = null;

    constructor(){
        this.picoAudio = new PicoAudio();
        this.picoAudio.init();
    }

    play(){
        this.picoAudio.play();
    }

    pause(){
        this.picoAudio.pause();
    }

    setMidi(ArrayBuffer){
        const file = new Uint8Array(ArrayBuffer);
        const parsedFile = this.picoAudio.parseSMF(file);
        if (parsedFile != "Not Sandard MIDI File.") {
            this.midiData = parsedFile;
            this.picoAudio.setData(parsedFile);
            this.#setOriginalVelocity();
        }
        else {
            this.midiData = null;
        }
    }

    setChannelOn(channel, on){
        if (channel < 0 || channel > 15) {
            return;
        }

        for (let n = 0; n < this.picoAudio.playData.channels[channel].notes.length; n++){
            let note = this.picoAudio.playData.channel[channel].notes[n];
            if (on) {
                note.velocity = note.originalVelocity;
            }
            else {
                note.velocity = 0;
            }
        }
    }

    #setOriginalVelocity(){
        for (let c = 0; c < this.picoAudio.playData.channels.length; c++){
            for (let n = 0; n < this.picoAudio.playData.channels[c].notes.length; n++){
                let note = this.picoAudio.playData.channels[c].notes[n];
                note.originalVelocity = note.velocity;
            }
        }
    }
}

export default AdaptiveAudio;