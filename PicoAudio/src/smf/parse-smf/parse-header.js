import ParseUtil from '../../util/parse-util.js';

export default function parseHeader(info) {
    // Get data from the function caller //
    const smf = info.smf;

    // Analyze SMF header chunks //
    let p = 4; 
    const header = {};
    header.size = ParseUtil.getInt(smf, 4, 8);
    header.format = smf[9];
    header.trackcount = ParseUtil.getInt(smf, 10, 12);
    header.timemanage = smf[12];
    header.resolution = ParseUtil.getInt(smf, 12, 14); // TODO 0 division by zero prevention. When the 15th bit is 1, https://sites.google.com/site/yyagisite/material/smfspec#ConductorTrack
    p += 4 + header.size;

    // Prepare variables //
    const channels = [];
    const chSize = this.settings.isWebMIDI ? 17 : 16; // Make 17ch for WebMIDI to put all events in 17ch
    for (let i=0; i<chSize; i++) {
        const channel = {};
        channels.push(channel);
        // Create an index array that records the order in which smf is read //
        // Use a typed array like an array with a list structure (speed up the insertion process by making it a list structure)
        // [tick, smfMesLength, smfPtr, nextIndicesPtr, ...]
        channel.indices = [];
        channel.indicesLength = 0;
        channel.indicesHead = -1; // First pointer
        channel.indicesFoot = 0; // Pointer at the end
        channel.indicesCur = 0; // Pointer for current insert
        channel.indicesPre = 0; // Pointer for previous insert
        channel.notes = [];
    }

    // Returns data to the function caller //
    info.p = p;
    info.header = header;
    info.channels = channels;
    return info;
}