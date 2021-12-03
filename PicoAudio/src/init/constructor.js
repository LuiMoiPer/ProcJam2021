/*
argsObj {
    debug,
    audioContext,
    picoAudio,
    etc (this.settings.xxx)
}
*/
export default function picoAudioConstructor(argsObj) {
    this.debug = false;
    this.isStarted = false;
    this.isPlayed = false;
    this.settings = {
        masterVolume: 1,
        generateVolume: 0.15,
        tempo: 120,
        basePitch: 440,
        resolution: 480,
        isWebMIDI: false,
        WebMIDIPortOutputs: null,
        WebMIDIPortOutput: null,
        WebMIDIPort: -1, // -1:auto
        WebMIDIPortSysEx: true, // Whether to take full control of the MIDI device (whether to use SysEx) (can only be used with https)
        isReverb: true, // Whether to turn on the reverb
        reverbVolume: 1.5,
        initReverb: 10,
        isChorus: true,
        chorusVolume: 0.5,
        isCC111: true,
        loop: false,
        isSkipBeginning: false, // Skip the opening margin
        isSkipEnding: true, // Skip trailing blanks
        holdOnValue: 64,
        maxPoly: -1, // Polyphony -1:infinity
        maxPercPoly: -1, // Polyphony (percussion) -1:infinity
        isOfflineRendering: false, // TODO Create performance data before playing
        isSameDrumSoundOverlap: false, // Do you allow the sounds of the same drum to overlap?
        baseLatency: -1 // Latency settings -1:auto
    };

    // Overwrite if the setting value is specified in argsObj
    rewriteVar(this, argsObj, "debug");
    for (let key in this.settings) {
        rewriteVar(this.settings, argsObj, key);
    }

    this.events = [];
    this.trigger = {
        isNoteTrigger: true,
        play: ()=>{},
        stop: ()=>{},
        noteOn: ()=>{},
        noteOff: ()=>{},
        songEnd: ()=>{}
    };
    this.states = {
        isPlaying: false,
        startTime: 0,
        stopTime: 0,
        stopFuncs: [],
        webMIDIWaitState: null,
        webMIDIStopTime: 0,
        playIndices: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        updateBufTime: 100,
        updateBufMaxTime: 350,
        updateIntervalTime: 0,
        latencyLimitTime: 0
    };
    this.hashedDataList = [];
    this.hashedMessageList = [];
    this.playData = null;
    this.channels = [];
    this.tempoTrack = [
        { timing: 0, value: 120 },
        { timing: 0, value: 120 }
    ];
    this.cc111Time = -1;
    this.onSongEndListener = null;
    this.baseLatency = 0.01;

    // Channel settings (timbre, attenuation, volume) //
    for (let i=0; i<17; i++) {
        this.channels.push([0, 0, 1]);
    }

    // If there is AudioContext, initialize it as it is, otherwise use init () to initialize using AudioContext
    if (argsObj && argsObj.audioContext) {
        this.init(argsObj);
    }
}

function rewriteVar(dist, src, hensu) {
    if (src && src[hensu] != null && dist && dist[hensu] != null) {
        dist[hensu] = src[hensu];
    }
}