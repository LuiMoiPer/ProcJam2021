import PicoAudio from "../PicoAudio/src/main.js";

class AdaptiveAudio {
    picoAudio;
    midiData = null;
    noteInfo = {
        treble: [],
        bass: [],
        percussion: []
    }

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

    setLooping(on){
        this.picoAudio.setLoop(on);
    }

    setMidi(ArrayBuffer){
        const parsedFile = this.picoAudio.parseSMF(new Uint8Array(ArrayBuffer));
        if (parsedFile == "Not Sandard MIDI File.") {
            this.midiData = null;
            return;
        }

        this.midiData = parsedFile;
        this.picoAudio.setData(parsedFile);
        this.#setOriginalVelocity();
        this.#makeNoteInfo();
    }

    setChannelOn(channel, on){
        if (channel < 0 || channel > 15) {
            return;
        }

        for (let n = 0; n < this.picoAudio.playData.channels[channel].notes.length; n++){
            let note = this.picoAudio.playData.channels[channel].notes[n];
            if (on) {
                note.velocity = note.originalVelocity;
            }
            else {
                note.velocity = 0;
            }
        }
    }

    setTrebleOn(on){
        for (let n = 0; n < this.noteInfo.treble.length; n++){
            let noteLocation = this.noteInfo.treble[n];
            let note = this.picoAudio.playData.channels[noteLocation.channel].notes[noteLocation.note];
            if (on) {
                note.velocity = note.originalVelocity;
            }
            else {
                note.velocity = 0;
            }
        }
    }

    setBassOn(on){
        for (let n = 0; n < this.noteInfo.bass.length; n++){
            let noteLocation = this.noteInfo.bass[n];
            let note = this.picoAudio.playData.channels[noteLocation.channel].notes[noteLocation.note];
            if (on) {
                note.velocity = note.originalVelocity;
            }
            else {
                note.velocity = 0;
            }
        }
    }

    getMidiData(){
        return this.midiData;
    }

    #setOriginalVelocity(){
        for (let c = 0; c < this.picoAudio.playData.channels.length; c++){
            for (let n = 0; n < this.picoAudio.playData.channels[c].notes.length; n++){
                let note = this.picoAudio.playData.channels[c].notes[n];
                note.originalVelocity = note.velocity;
            }
        }
    }

    #makeNoteInfo(){
        for (let c = 0; c < this.midiData.channels.length; c++) {
            console.log(c);
            for (let n = 0; n < this.midiData.channels[c].notes.length; n++) {
                let note = this.midiData.channels[c].notes[n];
                let noteLocation = {
                    channel: c,
                    note: n
                };

                if (note.pitch >= 60) {
                    this.noteInfo.treble.push(noteLocation);
                }
                else {
                    this.noteInfo.bass.push(noteLocation);
                }
            }
        }
    }
}

export default AdaptiveAudio;