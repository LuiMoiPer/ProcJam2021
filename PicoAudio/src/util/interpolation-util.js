/**
 * Class that provides interpolation
 */
export default class InterpolationUtil {
    /**
     * Linear interpolation of waveform
     * @param {AudioBuffer} buffer AudioBuffer to put the interpolation result
     * @param {Array} vtBufs Array of virtual sound sources ([Float32Array, Float32Array])
     */
    static lerpWave(buffer, vtBufs) {
        // Convert a virtual sample rate sound source to a production sound source //
        const bufferSize = buffer.getChannelData(0).length;
        const vtBufsSize = vtBufs[0].length;
        if (bufferSize == vtBufsSize) { // No need for linear interpolation //
            for (let ch=0; ch<2; ch++) {
                const data = buffer.getChannelData(ch);
                const vtBuf = vtBufs[ch];
                for (let i=0; i<bufferSize; i++) {
                    data[i] = vtBuf[i];
                }
            }
        } else { // Linear interpolation //
            const ratio = vtBufsSize / bufferSize;
            for (let ch=0; ch<2; ch++) {
                const data = buffer.getChannelData(ch);
                const vtBuf = vtBufs[ch];
                for (let i=0; i<bufferSize; i++) {
                    // Create waveform while linearly interpolating //
                    // TODO The sound is still a little strange, so it may be better to change to spline correction. //
                    const idxF = i * ratio;
                    const idx1 = Math.trunc(idxF);
                    const idx2 = (idx1 + 1) % vtBufsSize;
                    const idxR = idxF - idx1;
                    const w = vtBuf[idx1] * (1 - idxR) + vtBuf[idx2] * idxR;
                    data[i] = w;
                }
            }
        }
    }
}