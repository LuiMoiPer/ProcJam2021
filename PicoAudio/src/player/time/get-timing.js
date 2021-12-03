/**
 * Find the tick from time (seconds)
 * @param {number} time
 * @returns {number} tick
 */
export default function getTiming(time) {
    let imid = -1;

    // Search for time if there is a tempo change //
    if (this.tempoTrack && this.tempoTrack.length >= 1) {
        // If the last time is exceeded, the last tick is returned
        if (time >= this.tempoTrack[this.tempoTrack.length-1].time) {
            return this.tempoTrack[this.tempoTrack.length-1].timing;
        }
        // Find time with binary search
        let imin = 0;
        let imax = this.tempoTrack.length - 1;
        while (true) {
            imid = Math.floor(imin + (imax - imin) / 2);
            const tempTime = this.tempoTrack[imid].time;
            if (time < tempTime) {
                imax = imid - 1;
            } else if (time > tempTime) {
                imin = imid + 1;
            } else {
                break;
            }
            if (imin > imax) {
                if (time < tempTime) imid--;
                break;
            }
        }
    }

    let baseTime = 0;
    let tick = 0;
    let tempo = 120;
    if (imid >= 0) { // If you search for time and find it
        // Get the time closest to the argument time
        const tempoObj = this.tempoTrack[imid];
        baseTime = tempoObj.time;
        tick = tempoObj.timing;
        tempo = tempoObj.value;
    }

    // Calculate tick from time
    // Tick ​​of time closest to argument time + Calculate remaining tick from current time = Current tick
    tick += (time - baseTime) / (60 / tempo / this.settings.resolution);
    return tick;
}