import PicoAudio from "../PicoAudio/src/main.js";

class AdaptiveAudio {
    picoAudio;
    midiData = null;
    noteInfo = {
        treble: [],
        bass: [],
        percussion: [],
        byPitch: [],
        byLength: []
    };
    songInfo = {
        minPitch: null,
        maxPitch: null,
        minLength: null,
        maxLength: null
    }

    constructor(){
        this.picoAudio = new PicoAudio();
        this.picoAudio.init();
    }

    // PicoAudio Functions
    play(){
        this.picoAudio.play();
    }

    pause(){
        this.picoAudio.pause();
    }

    stop(){
        this.picoAudio.stop()
    }

    setStartTime(offset){
        this.picoAudio.setStartTime(offset);
    }

    setLooping(on){
        this.picoAudio.setLoop(on);
    }

    getMasterVolume(){
        return this.picoAudio.getMasterVolume();
    }

    setMasterVolume(volume){
        this.picoAudio.setMasterVolume(volume);
    }

    // New Functions //
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
            let note = this.#getNoteFromLocation(this.noteInfo.treble[n]);
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
            let note = this.#getNoteFromLocation(this.noteInfo.bass[n]);
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

    getSongInfo(){
        return {...this.songInfo};
    }

    // Private Functions //
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
            for (let n = 0; n < this.midiData.channels[c].notes.length; n++) {
                let noteLocation = {
                    channel: c,
                    note: n
                };
                let note = this.#getNoteFromLocation(noteLocation);

                if (note.pitch >= 60) {
                    this.noteInfo.treble.push(noteLocation);
                }
                else {
                    this.noteInfo.bass.push(noteLocation);
                }

                // Will be sorted later
                this.noteInfo.byLength.push(noteLocation);
                this.noteInfo.byPitch.push(noteLocation);
            }
        }

        this.noteInfo.byLength.sort((a, b) => {
            let noteA = this.#getNoteFromLocation(a);
            let noteB = this.#getNoteFromLocation(b);

            // set length if it does not exist
            if ("length" in a == false) {
                a.length = noteA.stop - noteA.start;
            } 
            if ("length" in b == false) {
                b.length = noteB.stop - noteB.start;
            } 
            
            return a.length - b.length;
        });

        this.noteInfo.byPitch.sort((a, b) => {
            let noteA = this.#getNoteFromLocation(a);
            let noteB = this.#getNoteFromLocation(b);

            // set pitch if it does not exist
            if ("pitch" in a == false) {
                a.pitch = noteA.pitch;
            } 
            if ("pitch" in b == false) {
                b.pitch = noteB.pitch;
            } 

            return a.pitch - b.pitch;
        });

        this.#makeSongInfo();
    }

    #makeSongInfo(){
        this.songInfo.maxPitch = this.noteInfo.byPitch[this.noteInfo.byPitch.length - 1].pitch;
        this.songInfo.minPitch = this.noteInfo.byPitch[0].pitch;
        this.songInfo.maxLength = this.noteInfo.byLength[this.noteInfo.byLength.length - 1].length;
        this.songInfo.minLength = this.noteInfo.byLength[0].length;
    }

    #getNoteFromLocation(noteLocation){
        return this.midiData.channels[noteLocation.channel].notes[noteLocation.note];
    }
}

export default AdaptiveAudio;