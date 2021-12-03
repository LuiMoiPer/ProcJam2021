import RandomUtil from '../util/random-util.js';
import InterpolationUtil from '../util/interpolation-util.js';

export default function init(argsObj) {
    if (this.isStarted) return;
    this.isStarted = true;

    const audioContext = argsObj && argsObj.audioContext;
    const picoAudio = argsObj && argsObj.picoAudio;

    // Generate AudioContext //
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = audioContext ? audioContext : new AudioContext();

    // Master volume //
    // Bit one gainNode before destination to change the volume in real time
    this.masterGainNode = this.context.createGain();
    this.masterGainNode.gain.value = this.settings.masterVolume;

    // Virtual sample rate //
    const sampleRate = this.context.sampleRate;
    const sampleRateVT = sampleRate >= 48000 ? 48000 : sampleRate;

    // White noise //
    if (picoAudio && picoAudio.whitenoise) { // Reuse
        this.whitenoise = picoAudio.whitenoise;
    } else {
        RandomUtil.resetSeed(); // Fix random number pattern (do not use Math.random ())
        // Since the sound changes depending on the sample rate of the playback environment //
        // Create a sound source once at a virtual sample rate //
        const seLength = 1;
        const sampleLength = sampleRate * seLength;
        const sampleLengthVT = sampleRateVT * seLength;
        const vtBufs = [];
        for (let ch=0; ch<2; ch++) {
            vtBufs.push(new Float32Array(sampleLengthVT));
            const vtBuf = vtBufs[ch];
            for (let i=0; i<sampleLengthVT; i++) {
                const r = RandomUtil.random();
                vtBuf[i] = r * 2 - 1;
            }
        }
        // Convert a virtual sample rate sound source to a production sound source //
        this.whitenoise = this.context.createBuffer(2, sampleLength, sampleRate);
        InterpolationUtil.lerpWave(this.whitenoise, vtBufs);
    }

    // Impulse response voice data creation for reverb //
    if (picoAudio && picoAudio.impulseResponse) { // 使いまわし
        this.impulseResponse = picoAudio.impulseResponse;
    } else {
        RandomUtil.resetSeed(); // Fix random number pattern (do not use Math.random ())
        // Since the sound changes depending on the sample rate of the playback environment //
        // Create a sound source once at a virtual sample rate //
        const seLength = 3.5;
        const sampleLength = sampleRate * seLength;
        const sampleLengthVT = sampleRateVT * seLength;
        const vtBufs = [];
        for (let ch=0; ch<2; ch++) {
            vtBufs.push(new Float32Array(sampleLengthVT));
            const vtBuf = vtBufs[ch];
            for (let i=0; i<sampleLengthVT; i++) {
                const v = ((sampleLengthVT - i) / sampleLengthVT);
                const s = i / sampleRateVT;
                const d = (s < 0.030 ? 0 : v)
                    * (s >= 0.030 && s < 0.031 ? v*2 : v)
                    * (s >= 0.040 && s < 0.042 ? v*1.5 : v)
                    * (s >= 0.050 && s < 0.054 ? v*1.25 : v)
                    * RandomUtil.random() * 0.2 * Math.pow((v-0.030), 4);
                vtBuf[i] = d;
            }
        }
        // Convert a virtual sample rate sound source to a production sound source //
        this.impulseResponse = this.context.createBuffer(2, sampleLength, this.context.sampleRate);
        InterpolationUtil.lerpWave(this.impulseResponse, vtBufs);
    }

    // Create and connect AudioNode for reverb //
    this.convolver = this.context.createConvolver();
    this.convolver.buffer = this.impulseResponse;
    this.convolver.normalize = true;
    this.convolverGainNode = this.context.createGain();
    this.convolverGainNode.gain.value = this.settings.reverbVolume;
    this.convolver.connect(this.convolverGainNode);
    this.convolverGainNode.connect(this.masterGainNode);
    this.masterGainNode.connect(this.context.destination);

    // Create and connect AudioNode for chorus //
    this.chorusDelayNode = this.context.createDelay();
    this.chorusGainNode = this.context.createGain();
    this.chorusOscillator = this.context.createOscillator();
    this.chorusLfoGainNode = this.context.createGain();
    this.chorusDelayNode.delayTime.value = 0.025;
    this.chorusLfoGainNode.gain.value = 0.010;
    this.chorusOscillator.frequency.value = 0.05;
    this.chorusGainNode.gain.value = this.settings.chorusVolume;
    this.chorusOscillator.connect(this.chorusLfoGainNode);
    this.chorusLfoGainNode.connect(this.chorusDelayNode.delayTime);
    this.chorusDelayNode.connect(this.chorusGainNode);
    this.chorusGainNode.connect(this.masterGainNode);
    this.masterGainNode.connect(this.context.destination);
    this.chorusOscillator.start(0);

    // Latency settings //
    this.baseLatency = this.context.baseLatency || this.baseLatency;
    if (this.settings.baseLatency != -1) {
        this.baseLatency = this.settings.baseLatency;
    }
}