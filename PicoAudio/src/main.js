import picoAudioConstructor from './init/constructor.js';
import init from './init/init.js';

import setData from './player/set-data.js';
import initStatus from './player/init-status.js';
import play from './player/play.js';
import stop from './player/stop.js';

import createBaseNote from './player/sound-source/create-base-note.js';
import createNote from './player/sound-source/create-note.js';
import createPercussionNote from './player/sound-source/create-percussion-note.js';

import stopAudioNode from './player/stop-manager/stop-audio-node.js';
import pushFunc from './player/stop-manager/push-func.js';
import clearFunc from './player/stop-manager/clear-func.js';

import getTime from './player/time/get-time.js';
import getTiming from './player/time/get-timing.js';

import parseSMF from './smf/parse-smf.js';

import startWebMIDI from './web-midi/start-web-midi.js';

class PicoAudio {
    /**
     * PicoAudio class constructor
     * @param {Object} argsObj
     */
    constructor(argsObj) {
        picoAudioConstructor.call(this, argsObj);
    }

    /**
     * Initialization and preparation
     * @param {Object} argsObj
     */
    init(argsObj) {
        return init.call(this, argsObj);
    }

    /**
     * Analyze MIDI files (SMF)
     * @param {Uint8Array} smf Uint8Array object containing the contents of a MIDI file
     * @returns {Object} An object that contains information for playback
     */
    parseSMF(smf) {
        return parseSMF.call(this, smf);
    }

    /**
     * Set the data for playback
     * @param {Object} data Object returned by PicoAudio.parseSMF ()
     */
    setData(data) {
        return setData.call(this, data);
    }

    /**
     * reproduction
     * @param {boolean} _isSongLooping Arguments used inside PicoAudio
     */
    play(_isSongLooping) {
        return play.call(this, _isSongLooping);
    }

    /**
     * Stop for a while
     * @param {boolean} _isSongLooping Arguments used inside PicoAudio
     */
    pause(_isSongLooping) {
        return stop.call(this, _isSongLooping);
    }

    /**
     * stop
     * @param {boolean} _isSongLooping Arguments used inside PicoAudio
     */
    stop(_isSongLooping) {
        return stop.call(this, _isSongLooping);
    }

    /**
     * reset
     * @param {boolean} _isSongLooping Arguments used inside PicoAudio
     * @param {boolean} _isLight Arguments used inside PicoAudio
     */
    initStatus(_isSongLooping, _isLight) {
        return initStatus.call(this, _isSongLooping, _isLight);
    }

    setStartTime(offset) {
        this.states.startTime -= offset;
    }

    // Time relationship //
    /**
     * Find time (seconds) from tick
     * @param {number} tick
     * @returns {number} time (seconds)
     */
    getTime(tick) {
        return getTime.call(this, tick);
    }
    /**
     * Find the tick from time (seconds)
     * @param {number} time
     * @returns {number} tick
     */
    getTiming(time) {
        return getTiming.call(this, time);
    }

    // Playback / sound source related //
    /**
     * Playback processing (sounds with oscillator of Web Audio API, etc.)
     * @param {Object} option
     * @param {boolean} isDrum
     * @param {boolean} isExpression
     * @param {boolean} nonChannel
     * @param {boolean} nonStop
     * @returns {Object} Returns AudioNode and parameters
     */
    createBaseNote(option, isDrum, isExpression, nonChannel, nonStop) {
        return createBaseNote.call(this, option, isDrum, isExpression, nonChannel, nonStop);
    }
    /**
     * Sound source (other than percussion)
     * @param {Object} option
     * @returns {Object} Returns a function that stops the sound
     */
    createNote(option) {
        return createNote.call(this, option);
    }
    /**
     * Percussion sound source
     * @param {Object} option
     * @returns {Object} Returns a function that stops the sound
     */
    createPercussionNote(option) {
        return createPercussionNote.call(this, option);
    }

    // Stop management related //
    stopAudioNode(tar, time, stopGainNode, isNoiseCut) {
        return stopAudioNode.call(this, tar, time, stopGainNode, isNoiseCut);
    }
    pushFunc(tar) {
        return pushFunc.call(this, tar);
    }
    clearFunc(tar1, tar2) {
        return clearFunc.call(this, tar1, tar2);
    }

    /**
     * Web MIDI API
     */
    startWebMIDI() {
        return startWebMIDI.call(this);
    }

    // Interface related //
    addEventListener(type, func) {
        // type = EventName (play, stop, noteOn, noteOff, songEnd)
        this.events.push({type: type, func: func});
    }
    removeEventListener(type, func) {
        for (let i = this.events.length; i >= 0; i--) {
            if (event.type == type && event.func === func) {
                this.events.splice(i, 1);
            }
        }
    }
    removeAllEventListener(type) {
        for (let i = this.events.length; i >= 0; i--) {
            if (event.type == type) {
                this.events.splice(i, 1);
            }
        }
    }
    fireEvent(type, option) {
        this.events.forEach((event) => {
            if (event.type == type) {
                try {
                    event.func(option);
                } catch(e) {
                    console.log(e);
                }
            }
        });
    }

    setOnSongEndListener(listener) { this.onSongEndListener = listener; }
    onSongEnd() {
        if (this.onSongEndListener) {
            const isStopFunc = this.onSongEndListener();
            if (isStopFunc) return;
        }
        if (this.settings.loop) {
            this.initStatus(true);
            if (this.settings.isCC111 && this.cc111Time != -1) {
                this.setStartTime(this.cc111Time);
            }
            this.play(true);
        }
    }
    gethannels() { return this.channels; }
    setChannels(channels) {
        channels.forEach((channel, idx) => {
            this.channels[idx] = channel;
        });
    }
    initChannels() {
        for (let i=0; i<16; i++) {
            this.channels[i] = [0,0,1];
        }
    }
    getMasterVolume() { return this.settings.masterVolume; }
    setMasterVolume(volume) {
        this.settings.masterVolume = volume;
        if (this.isStarted) {
            this.masterGainNode.gain.value = this.settings.masterVolume;
        }
    }
    isLoop() { return this.settings.loop; }
    setLoop(loop) { this.settings.loop = loop; }
    isWebMIDI() { return this.settings.isWebMIDI; }
    setWebMIDI(enable) { this.settings.isWebMIDI = enable; }
    isCC111() { return this.settings.isCC111; }
    setCC111(enable) { this.settings.isCC111 = enable; }
    isReverb() { return this.settings.isReverb; }
    setReverb(enable) { this.settings.isReverb = enable; }
    getReverbVolume() { return this.settings.reverbVolume; }
    setReverbVolume(volume) { this.settings.reverbVolume = volume; }
    isChorus() { return this.settings.isChorus; }
    setChorus(enable) { this.settings.isChorus = enable; }
    getChorusVolume() { return this.settings.chorusVolume; }
    setChorusVolume(volume) { this.settings.chorusVolume = volume; }
}

export default PicoAudio;