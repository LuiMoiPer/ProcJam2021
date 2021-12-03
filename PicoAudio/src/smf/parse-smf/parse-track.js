import ParseUtil from '../../util/parse-util.js';

export default function parseTrack(info) {
    // Get data from the function caller //
    const smf = info.smf;
    let p = info.p;
    const header = info.header;
    const channels = info.channels;

    // Analysis of SMF track chunks. Create "SMF read order array" //
    //   Create an array that records the reading order of SMF while analyzing all tracks
    //   The reading order is sorted so that it is in delta time order in this analysis.
    //   When analyzing MIDI events in SMF, acquire "what byte of the MIDI file to look at next" from the above array and analyze it.
    //   The above array is used like an array with a list structure (the list structure speeds up the insert process of the array).
    // 
    // ■ Array image (json style) ■
    // [
    //     {
    //         tick : Tick ​​of this MIDI event,
    //         smfMesLength : Length of one MIDI event,
    //         smfPtr : In what byte of the MIDI file this MIDI event is,
    //         nextIndicesPtr : What position in the list array is the next object?
    //     },
    //     ...
    // ]
    // 
    // ■ Actual array image ■
    // [tick, smfMesLength, smfPtr, nextIndicesPtr, ...]

    const tempoTrack = [];
    const beatTrack = [];
    let songLength = 0;
    for (let t=0; t<header.trackcount; t++) {
        // "MTrk"
        if (smf[p] != 77 || smf[p+1] != 84 || smf[p+2] != 114 || smf[p+3] != 107)
            return "Irregular SMF.";
        p += 4;
        const endPoint = p + 4 + ParseUtil.getInt(smf, p, p+4);
        p += 4;
        let tick = 0;
        let tempo = 120;
        let tempoCurTick = 0;
        let tempoCurTime = 0;
        let lastState = 1;
        let dt;
        while (p<endPoint) {
            // DeltaTime
            if (lastState != null) {
                const lengthAry = ParseUtil.variableLengthToInt(smf, p, p+5);
                dt = lengthAry[0];
                tick += dt;
                p += lengthAry[1];
            }
            const cashP = p; // WebMIDI用
            // Events
            const mes0 = smf[p] >> 4; // Math.floor(smf[p] / 0x10)
            switch (mes0) {
                case 0x8: // Note OFF - 8[ch], Pitch, Velocity
                case 0x9: // Note ON - 9[ch], Pitch, Velocity
                case 0xA: // Polyfonic Key Pressure - A[ch], Pitch?, Velocity?
                case 0xB: // Control Change - B[ch],,
                case 0xE: // PitchBend Change - E[ch],,
                {
                    // Analyze after sorting by channel
                    lastState = smf[p];
                    const ch = channels[lastState&0x0F];
                    ParseUtil.chIndicesInsert(this, ch, tick, p, 3);
                    p += 3;
                    break;
                }
                case 0xC: // Program Change - C[ch],
                case 0xD: // Channel Pre - D[ch],
                {
                    // Analyze after sorting by channel
                    lastState = smf[p];
                    const ch = channels[lastState&0x0F];
                    ParseUtil.chIndicesInsert(this, ch, tick, p, 2);
                    p += 2;
                    break;
                }
                // SysEx Events or Meta Events - F[ch], ...
                case 0xF: {
                    //lastState = smf[p]; <- There is no running state
                    switch (smf[p]) {
                        case 0xF0:
                        case 0xF7: {
                            // SysEx Events
                            const lengthAry = ParseUtil.variableLengthToInt(smf, p+1, p+1+4);

                            // Master Volume
                            // 0xF0, size, 0x7f, 0x7f, 0x04, 0x01, 0xNN, volume, 0xF7
                            if (lengthAry[0] >= 7
                                && smf[p+2] == 0x7f
                                && smf[p+3] == 0x7f
                                && smf[p+4] == 0x04
                                && smf[p+5] == 0x01) {
                                // Insert Master Volume event on all channels
                                for (let i=0; i<16; i++) {
                                    const ch = channels[i];
                                    ParseUtil.chIndicesInsert(this, ch, tick, p, lengthAry[0]);
                                }
                            }

                            p += 1 + lengthAry[1] + lengthAry[0];
                            break;
                        }
                        case 0xF1:
                            p += 2;
                            break;
                        case 0xF2:
                            p += 3;
                            break;
                        case 0xF3:
                            p += 2;
                            break;
                        case 0xF6:
                        case 0xF8:
                        case 0xFA:
                        case 0xFB:
                        case 0xFC:
                        case 0xFE:
                            p += 1;
                            break;
                        case 0xFF: {
                            // Meta Events
                            switch (smf[p+1]) {
                                case 0x00:
                                case 0x01:
                                case 0x02:
                                case 0x03:
                                case 0x04:
                                case 0x05:
                                case 0x06:
                                case 0x07:
                                case 0x20:
                                    break;
                                case 0x2F:
                                    tick += (this.settings.isSkipEnding ? 0 : header.resolution) - dt;
                                    break;
                                case 0x51: // Tempo
                                    // Insert Tempo events on all channels
                                    for (let i=0; i<16; i++) {
                                        const ch = channels[i];
                                        ParseUtil.chIndicesInsert(this, ch, tick, p, 6);
                                    }
                                    tempoCurTime += (60 / tempo / header.resolution) * (tick - tempoCurTick);
                                    tempoCurTick = tick;
                                    tempo = 60000000/(smf[p+3]*0x10000 + smf[p+4]*0x100 + smf[p+5]);
                                    tempoTrack.push({
                                        timing: tick,
                                        time: tempoCurTime,
                                        value: tempo
                                    });
                                    break;
                                case 0x54:
                                    break;
                                case 0x58: // Beat
                                    beatTrack.push({
                                        timing: tick,
                                        value: [smf[p+3], Math.pow(2, smf[p+4])]
                                    });
                                    break;
                                case 0x59:
                                case 0x7F:
                                    break;
                            }
                            const lengthAry = ParseUtil.variableLengthToInt(smf, p+2, p+2+4);
                            p += 2 + lengthAry[1] + lengthAry[0];
                            break;
                        }
                    }
                    break;
                }
                default: {
                    if (lastState == null)
                        return "Irregular SMF. (" + p + " byte addr)";
                    p--;
                    smf[p] = lastState; // Overwrite
                    lastState = null;
                }
            }
            // WebMIDIAPI
            if (this.settings.isWebMIDI) {
                if (lastState != null) {
                    // Put all MIDI events in 17ch for WebMIDI
                    ParseUtil.chIndicesInsert(this, channels[16], tick, cashP, p - cashP);
                }
            }
        }
        if (!this.settings.isSkipEnding && songLength < tick) songLength = tick;
        // Initialize list array pointer
        for (let i=0; i<channels.length; i++) {
            channels[i].indicesCur = channels[i].indicesHead;
            channels[i].indicesPre = channels[i].indicesHead;
        }
    }

    // Returns data to the function caller //
    info.p = p;
    info.tempoTrack = tempoTrack;
    info.beatTrack = beatTrack;
    info.songLength = songLength;
    return info;
}
