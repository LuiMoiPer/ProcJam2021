import UpdateNote from './play/update-note.js';
import {Number_MAX_SAFE_INTEGER} from '../util/ponyfill.js';

export default function play(isSongLooping) {
    const context = this.context;
    const settings = this.settings;
    const trigger = this.trigger;
    const states = this.states;

    // Chrome Audio Policy measures //
    if (context.resume) context.resume();

    // If playing, do not process //
    if (states.isPlaying) return;

    // For WebMIDI, wait a moment and then play //
    if (settings.isWebMIDI && !isSongLooping) {
        // When using the Web MIDI API, if you wait about 800ms from stop(), the sound will not be buggy.
        if (states.webMIDIWaitState != "completed") {
            if (states.webMIDIWaitState != "waiting") { // play() Countermeasures for repeated hits
                // Execute play() 1000ms after stop()
                states.webMIDIWaitState = "waiting";
                let waitTime = 1000 - (context.currentTime - states.webMIDIStopTime)*1000;
                if (states.webMIDIStopTime == 0) waitTime = 1000; //Wait a moment when you open the MIDI Port and call it for the first time
                setTimeout(() => {
                    states.webMIDIWaitState = "completed";
                    states.isPlaying = false;
                    this.play();
                }, waitTime);
            }
            return;
        } else {
            states.webMIDIWaitState = null;
        }
    }

    // Prepare variables //
    const currentTime = context.currentTime;
    this.isPlayed = true;
    states.isPlaying = true;
    states.startTime = !states.startTime && !states.stopTime ? currentTime : (states.startTime + currentTime - states.stopTime);
    states.stopFuncs = [];

    // Skip the opening margin //
    if (settings.isSkipBeginning) {
        const firstNoteOnTime = this.firstNoteOnTime;
        if (-states.startTime + currentTime < firstNoteOnTime) {
            this.setStartTime(firstNoteOnTime + states.startTime - currentTime);
        }
    }

    // Book end song callback //
    let reserveSongEnd;
    const reserveSongEndFunc = () => {
        this.clearFunc("rootTimeout", reserveSongEnd);
        const finishTime = (settings.isCC111 && this.cc111Time != -1) ? this.lastNoteOffTime : this.getTime(Number_MAX_SAFE_INTEGER);
        if (finishTime - context.currentTime + states.startTime <= 0) {
            // Song ends after the scheduled time
            trigger.songEnd();
            this.onSongEnd();
            this.fireEvent('songEnd');
        } else {
            // If it is still playing due to processing failure, reserve to call the song end callback after 1ms
            reserveSongEnd = setTimeout(reserveSongEndFunc, 1);
            this.pushFunc({
                rootTimeout: reserveSongEnd,
                stopFunc: () => { clearTimeout(reserveSongEnd); }
            });
        }
    };
    const finishTime = settings.isCC111 && this.cc111Time != -1
        ? this.lastNoteOffTime
        : this.getTime(Number_MAX_SAFE_INTEGER);
    const reserveSongEndTime = (finishTime - context.currentTime + states.startTime) * 1000;
    reserveSongEnd = setTimeout(reserveSongEndFunc, reserveSongEndTime);
    this.pushFunc({
        rootTimeout: reserveSongEnd,
        stopFunc: () => { clearTimeout(reserveSongEnd); }
    });

    // Notify callback of playback start //
    trigger.play();
    this.fireEvent('play');

    // Preparing callbacks every 1ms //
    UpdateNote.init(this, currentTime);

    // Start callback every 1ms //
    const reserve = setInterval(() => {
        UpdateNote.update(this);
    }, 1);
    this.pushFunc({
        rootTimeout: reserve,
        stopFunc: () => { clearInterval(reserve); }
    });
}