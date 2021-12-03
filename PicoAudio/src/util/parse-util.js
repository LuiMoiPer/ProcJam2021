export default class ParseUtil {
    /**
     * Convert the "data length" contained in the byte array to a number
     * @param {Uint8Array} arr Byte array
     * @param {number} startIdx Location of the starting point of the data length(index)
     * @param {number} endIdx Location of the end point of the data length(index) - 1
     * @returns {number} Data length
     */
    static getInt(arr, startIdx, endIdx) {
        let value = 0;
        for (let i=startIdx; i<endIdx; i++) {
            value = (value << 8) + arr[i];
        }
        return value;
    }

    /**
     * Convert the "variable length data length" contained in the byte array to a number
     * @param {Uint8Array} arr Byte array
     * @param {number} startIdx Location of the starting point of the data length (index)
     * @param {number} endIdx End point location of data length (index) -1 (There can be many end point locations)
     * @returns {Array} [Data length, number of bytes of "variable length data length"]
     */
    static variableLengthToInt(arr, startIdx, endIdx) {
        let i = startIdx;
        let value = 0;
        while (i < endIdx-1 && arr[i] >= 0x80) {
            if (i < startIdx+4) value = (value<<7) + (arr[i]-0x80);
            i++;
        }
        value = (value<<7) + arr[i];
        i++;
        return [value, i-startIdx];
    }

    /**
     * Insert into an array in delta time order
     * @param {PicoAudio} that PicoAudio instance
     * @param {number} ch Channel number
     * @param {number} time Delta time
     * @param {number} p Location of the target MIDI event (position in SMF data)
     * @param {number} len MIDI event length
     */
    static chIndicesInsert(that, ch, time, p, len) {
        const indices = ch.indices;

        // Insert into list array in delta time order //
        if (ch.indicesLength >= 4 && time < indices[ch.indicesFoot]) {
            // Insert //
            while (ch.indicesCur != -1) {
                if (time<indices[ch.indicesCur]) {
                    if (ch.indicesCur == ch.indicesHead) {
                        ch.indicesHead = ch.indicesLength;
                    } else {
                        indices[ch.indicesPre+3] = ch.indicesLength;
                    }
                    indices[ch.indicesLength] = time;
                    indices[ch.indicesLength+1] = len;
                    indices[ch.indicesLength+2] = p;
                    indices[ch.indicesLength+3] = ch.indicesCur;
                    ch.indicesPre = ch.indicesLength;
                    ch.indicesLength += 4;
                    break;
                }
                ch.indicesPre = ch.indicesCur;
                ch.indicesCur = indices[ch.indicesCur+3];
            }
        } else {
            // Push //
            if (ch.indicesLength >= 4) {
                indices[ch.indicesFoot+3] = ch.indicesLength;
            } else {
                ch.indicesHead = 0;
            }
            ch.indicesFoot = ch.indicesLength;
            indices[ch.indicesLength] = time;
            indices[ch.indicesLength+1] = len;
            indices[ch.indicesLength+2] = p;
            indices[ch.indicesLength+3] = -1;
            ch.indicesLength += 4;
        }
    }
}