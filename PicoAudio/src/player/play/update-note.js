import ArrayUtil from '../../util/array-util.js';
import ParseUtil from '../../util/parse-util.js';
import {Performance} from '../../util/ponyfill.js';

export default class UpdateNote {
    /**
     * Initialize variables for processing every 1ms
     */
    static init(picoAudio, currentTime) {
        this.updatePreTime = Performance.now();
        this.pPreTime = Performance.now();
        this.cPreTime = picoAudio.context.currentTime * 1000;
        this.pTimeSum = 0;
        this.cTimeSum = 0;
        this.cnt = 0;
        this.initCurrentTime = currentTime;
    }

    /**
     * Callback called every 1ms during playback
     * (Actually, it is called every 4ms at the shortest due to browser restrictions)
     * @returns {number} Current time
     */
    static update(picoAudio) {
        const context = picoAudio.context;
        const settings = picoAudio.settings;
        const states = picoAudio.states;
        const baseLatency = picoAudio.baseLatency;
        const updateNowTime = Performance.now();
        const updatePreTime = this.updatePreTime;
        let pPreTime = this.pPreTime;
        let cPreTime = this.cPreTime;
        let pTimeSum = this.pTimeSum;
        let cTimeSum = this.cTimeSum;
        let cnt = this.cnt;

        // Monitor if the sound is heavy (anti-freeze) //
        //   Calculate the time difference between performance.now () and AudioContext.currentTime
        //   If AudioContext.currentTime is delayed, it is judged that processing has failed.
        let updateBufTime = updateNowTime - updatePreTime;
        const pTime = updateNowTime;
        const cTime = context.currentTime * 1000;
        pTimeSum += pTime - pPreTime;
        cTimeSum += cTime - cPreTime;
        pPreTime = pTime;
        cPreTime = cTime;
        const latencyTime = pTimeSum - cTimeSum;
        states.latencyTime = latencyTime;

        // If the sound is heavy, increase the limit to activate the load reduction process. //
        if (latencyTime >= 100) { // currentTime is slow (sound is heavy)
            states.latencyLimitTime += latencyTime;
            cTimeSum += 100;
        } else if (latencyTime <= -100) { // currentTime is fast (error)
            cTimeSum = pTimeSum;
        } else {
            if (states.latencyLimitTime > 0) { // currentTime is just right
                states.latencyLimitTime -= updateBufTime*0.003;
                if (states.latencyLimitTime < 0) states.latencyLimitTime = 0;
            }
        }

        // Automatically adjusts the degree of look-ahead of notes (it becomes heavy if you make too many reservations) //
        states.updateIntervalTime = updateBufTime;
        if (states.updateBufTime < updateBufTime) { // If the look-ahead is delayed
            states.updateBufTime = updateBufTime;
        } else { // When there is a margin in the read-ahead amount
            // Gradually reduce the amount of look-ahead //
            if (states.updateBufMaxTime > 350) {
                states.updateBufMaxTime -= states.updateBufMaxTime*0.002;
            }
            // Increase the read-ahead amount little by little //
            if (states.updateBufTime < 20) {
                states.updateBufTime += states.updateBufTime*0.0005;
            }
            if (states.updateBufMaxTime >= 10 && states.updateBufMaxTime < 340) {
                states.updateBufMaxTime += states.updateBufMaxTime*0.002;
            }
        }
        // When the read-ahead amount is insufficient
        if (states.updateBufTime > states.updateBufMaxTime) {
            if (updateBufTime >= 900 && states.latencyLimitTime <= 150) {
                // Background playback if it looks like background and is not heavy
                states.updateBufMaxTime += updateBufTime;
            } else { // generally
                const tempTime = updateBufTime - states.updateBufMaxTime;
                states.updateBufTime = states.updateBufMaxTime;
                
                // If the look-ahead amount is small, increase it.
                if (states.updateBufMaxTime < 10) {
                    states.updateBufTime = states.updateBufMaxTime;
                    states.updateBufMaxTime *= 1.25;
                } else {
                    states.updateBufMaxTime += tempTime / 2;
                }
            }
            if (states.updateBufMaxTime > 1100) states.updateBufMaxTime = 1100;
        }

        // If the sound is too heavy, reduce the look-ahead to reduce the load //
        if (states.latencyLimitTime > 150) {
            cTimeSum = pTimeSum;
            states.latencyLimitTime -= 5;
            if (states.latencyLimitTime > 1000) states.latencyLimitTime = 1000;
            // Make note look-ahead considerably smaller (freeze countermeasures)
            states.updateBufMaxTime = 1;
            states.updateBufTime = 1;
            updateBufTime = 1;
        }

        // Playback process //
        for (let ch=0; ch<16; ch++) {
            const notes = picoAudio.playData.channels[ch].notes;
            let idx = states.playIndices[ch];
            for (; idx<notes.length; idx++) {
                const note = notes[idx];
                const curTime = cnt == 0 ? this.initCurrentTime - states.startTime
                    : context.currentTime - states.startTime;
                // Skip the finished notes without playing
                if (curTime >= note.stopTime) continue;
                // (When playing from the middle with the seek bar) The one whose startTime has passed does not sound
                if (cnt == 0 && curTime > note.startTime + baseLatency) continue;
                // Performance start time-Performance reservation or performance start when the look-ahead time (note reservation) is reached
                if (curTime < note.startTime - states.updateBufTime/1000) break;

                // Playback processing of PicoAudio sound source //
                if (!settings.isWebMIDI) { 
                    // Keep the look-ahead amount small when the number of reserved notes is likely to increase rapidly. //
                    if (states.stopFuncs.length >= 350 && states.updateBufTime < 1000) {
                        states.updateBufTime = 12;
                        states.updateBufMaxTime = states.updateBufTime;
                    }

                    // Retro mode (chord restriction mode) //
                    if (settings.maxPoly != -1 || settings.maxPercPoly != -1) {
                        let polyCnt = 0;
                        let percCnt = 0;
                        states.stopFuncs.forEach((tar) => {
                            if (!tar.note) return;
                            if (tar.note.channel != 9) {
                                if (note.start >= tar.note.start && note.start < tar.note.stop) {
                                    polyCnt++;
                                }
                            } else {
                                if (note.start == tar.note.start) {
                                    percCnt++;
                                }
                            }
                        });
                        if ((note.channel != 9 && polyCnt >= settings.maxPoly)
                            || (note.channel == 9 && percCnt >= settings.maxPercPoly)) {
                            continue;
                        }
                    }

                    // Playback processing for one note (playback with WebAudio) //
                    const stopFunc =
                        note.channel != 9 ? picoAudio.createNote(note)
                        : picoAudio.createPercussionNote(note);
                    if (!stopFunc) continue; // 無音の場合、処理しない
                    picoAudio.pushFunc({
                        note: note,
                        stopFunc: stopFunc
                    });
                }
                states.noteOnAry.push(note);
            }
            // Remember how far you played notes and start processing from there the next callback
            states.playIndices[ch] = idx;
        }

        // Monitor if it's time for noteOn //
        this.checkNoteOn(picoAudio);

        // Monitor if it's time for noteOff //
        this.checkNoteOff(picoAudio);

        // WebMIDI playback process //
        if (settings.isWebMIDI && settings.WebMIDIPortOutput != null) {
            const messages = picoAudio.playData.messages;
            const smfData = picoAudio.playData.smfData;
            let idx = states.playIndices[16]; // 17ch is for Web MIDI
            for (; idx<messages.length; idx++) {
                const message = messages[idx];
                const curTime = context.currentTime - states.startTime;

                // Skip the finished notes without playing
                if (curTime > message.time + 1) continue;
                // Performance start time-Performance reservation or performance start when the look-ahead time (note reservation) is reached
                if (curTime < message.time - 1) break;

                // The process of sending a MIDI message via WebMIDI //
                const pLen = message.smfPtrLen;
                const p = message.smfPtr;
                const time = message.time;
                const state = smfData[p];
                if (state!=0xff) {
                    try {
                        if (state==0xF0 || state==0xF7) {
                            // sysEx MIDI messages
                            if (settings.WebMIDIPortSysEx) {
                                // Remove length information into a pure SysEx message
                                const lengthAry = ParseUtil.variableLengthToInt(smfData, p+1, p+1+4);
                                const sysExStartP = p+1+lengthAry[1];
                                const sysExEndP = sysExStartP+lengthAry[0];
                                const webMIDIMes = new Uint8Array(1 + lengthAry[0]);
                                webMIDIMes[0] = state;
                                const size = sysExEndP - sysExStartP;
                                for (let i=0; i<size; i++)
                                    webMIDIMes[i+1] = smfData[sysExStartP + i];
                                settings.WebMIDIPortOutput.send(webMIDIMes,
                                    (time - context.currentTime + Performance.now()/1000 + states.startTime) * 1000);
                            }
                        } else {
                            // MIDI messages other than sysEx
                            const sendMes = [];
                            for (let i=0; i<pLen; i++) sendMes.push(smfData[p+i]);
                            settings.WebMIDIPortOutput.send(sendMes,
                                (time - context.currentTime + Performance.now()/1000 + states.startTime) * 1000);
                        }
                    } catch(e) {
                        console.log(e, p, pLen, time, state);
                    }
                }
            }
            // Remember how far you sent messages and start processing from there the next callback
            states.playIndices[16] = idx;
        }

        // Count the number of times a 1ms callback is called
        cnt ++;

        // Reflect variables //
        this.updatePreTime = updateNowTime;
        this.pPreTime = pPreTime;
        this.cPreTime = cPreTime;
        this.pTimeSum = pTimeSum;
        this.cTimeSum = cTimeSum;
        this.cnt = cnt;
    }

    /**
     * Monitor if it's time for noteOn
     * @param {PicoAudio} picoAudio PicoAudio instance
     */
    static checkNoteOn(picoAudio) {
        const context = picoAudio.context;
        const trigger = picoAudio.trigger;
        const states = picoAudio.states;
        const noteOnAry = picoAudio.states.noteOnAry;
        const noteOffAry = picoAudio.states.noteOffAry;

        for (let i=0; i<noteOnAry.length; i++) {
            const tempNote = noteOnAry[i];
            const nowTime = context.currentTime - states.startTime;
            if (tempNote.startTime - nowTime <= 0) {
                ArrayUtil.delete(noteOnAry, i); // noteOnAry.splice(i, 1); Speed ​​up
                noteOffAry.push(tempNote);

                // Event firing
                if (trigger.isNoteTrigger) trigger.noteOn(tempNote);
                picoAudio.fireEvent('noteOn', tempNote);

                i--;
            }
        }
    }

    /**
     * Monitor if it's time for noteOff
     * @param {PicoAudio} picoAudio PicoAudio instance
     */
    static checkNoteOff(picoAudio) {
        const context = picoAudio.context;
        const trigger = picoAudio.trigger;
        const states = picoAudio.states;
        const noteOffAry = picoAudio.states.noteOffAry;

        for (let i=0; i<noteOffAry.length; i++) {
            const tempNote = noteOffAry[i];
            const nowTime = context.currentTime - states.startTime;
            if ((tempNote.channel != 9 && tempNote.stopTime - nowTime <= 0)
                || (tempNote.channel == 9 && tempNote.drumStopTime - nowTime <= 0)) {
                ArrayUtil.delete(noteOffAry, i); // noteOffAry.splice(i, 1); Speed ​​up
                picoAudio.clearFunc("note", tempNote);

                // Event firing
                if (trigger.isNoteTrigger) trigger.noteOff(tempNote);
                picoAudio.fireEvent('noteOff', tempNote);

                i--;
            }
        }
    }
}