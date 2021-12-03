/**
 * Find time (seconds) from tick
 * @param {number} tick
 * @returns {number} time (seconds)
 */
export default function getTime(tick) {
    let imid = -1;

    // Search for tick if there is a tempo change //
    if (this.tempoTrack && this.tempoTrack.length >= 1) {
        // If the last tick is exceeded, the last time is returned //
        if (tick >= this.tempoTrack[this.tempoTrack.length-1].timing) {
            return this.tempoTrack[this.tempoTrack.length-1].time;
        }
        // Find a tick with a binary search //
        let imin = 0;
        let imax = this.tempoTrack.length - 1;
        while (true) {
            imid = Math.floor(imin + (imax - imin) / 2);
            const tempTiming = this.tempoTrack[imid].timing;
            if (tick < tempTiming) {
                imax = imid - 1;
            } else if (tick > tempTiming) {
                imin = imid + 1;
            } else {
                break;
            }
            if (imin > imax) {
                if (tick < tempTiming) imid--;
                break;
            }
        }
    }

    let time = 0;
    let baseTiming = 0;
    let tempo = 120;
    if (imid >= 0) { // If you search for tick and find it
        // Get the tick closest to the argument tick
        const tempoObj = this.tempoTrack[imid];
        time = tempoObj.time;
        baseTiming = tempoObj.timing;
        tempo = tempoObj.value;
    }

    // Calculate time from tick
    // Time of the tick closest to the argument tick + Calculate the remaining time from the argument tick = Current time
    time += (60 / tempo / this.settings.resolution) * (tick - baseTiming);
    return time;
}