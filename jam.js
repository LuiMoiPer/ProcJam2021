import PicoAudio from './PicoAudio/src/main.js';

const picoAudio = new PicoAudio();

const fileInputElem = document.getElementById('midi-file');
let parsedData = null;
fileInputElem.addEventListener('change', () => {
    const file = fileInputElem.files[0];
    const fileReader = new FileReader();
    fileReader.onload = () => {
        const standardMidiFile = new Uint8Array(fileReader.result);
        parsedData = picoAudio.parseSMF(standardMidiFile);
        picoAudio.setData(parsedData);
        makeChannelInfo();
    };
    fileReader.readAsArrayBuffer(file);
});

const startButton = document.createElement("button");
startButton.innerText = "Start";
startButton.addEventListener("click", () => {
    picoAudio.init();
    picoAudio.play();
});
document.body.appendChild(startButton);

const stopButton = document.createElement("button");
stopButton.innerText = "Stop";
stopButton.addEventListener("click", () => {
    picoAudio.init();
    picoAudio.pause();
});
document.body.appendChild(stopButton);

function makeChannelInfo(){
    let channelInfo = document.getElementById('ChannelInfo');
    if (channelInfo != null) {
        channelInfo.parentNode.removeChild(channelInfo);
    }

    channelInfo = document.createElement("p");
    channelInfo.id = 'ChannelInfo';
    channelInfo.innerText = "Channel Info: "
    document.body.appendChild(channelInfo);

    if (parsedData == null) {
        return;
    }
    
    for (let i = 0; i < parsedData.channels.length; i++) {
        const channel = document.createElement("p");
        channel.id = `channel${i}`;
        channel.innerText = `Notes in channel ${i}: ${parsedData.channels[i].notes.length}`;
        channelInfo.appendChild(channel);
    }
};