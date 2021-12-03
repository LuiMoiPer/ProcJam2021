export default function stopAudioNode(tar, time, stopGainNode, isNoiseCut) {
    const isImmed = time <= this.context.currentTime; // Is it an immediate stop?

    // Reservation stop //
    let vol1Time = time-0.005;
    let stopTime = time;

    // Time settings //
    if (isImmed) { // Immediate stop
        if (!isNoiseCut) {
            stopTime = this.context.currentTime;
        } else {  // Noise cut
            vol1Time = this.context.currentTime;
            stopTime = this.context.currentTime+0.005;
        }
    }

    // Stopping the sound //
    try { // Normal sound stop processing
        if (!isNoiseCut) {
            tar.stop(stopTime);
        } else { // Noise cut (with a short fade-out at the end of the sound)
            tar.stop(stopTime);
            stopGainNode.gain.cancelScheduledValues(0);
            stopGainNode.gain.setValueAtTime(1, vol1Time);
            stopGainNode.gain.linearRampToValueAtTime(0, stopTime);
        }
    } catch(e) { // For iOS (stop cannot be used more than once, so mute with stopGainNode instead)
        stopGainNode.gain.cancelScheduledValues(0);
        if (!isNoiseCut) {
            stopGainNode.gain.setValueAtTime(0, stopTime);
        } else { // Noise cut (with a short fade-out at the end of the sound)
            stopGainNode.gain.setValueAtTime(1, vol1Time);
            stopGainNode.gain.linearRampToValueAtTime(0, stopTime);
        }
    }
}