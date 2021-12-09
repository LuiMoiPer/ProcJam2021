import PicoAudio from './PicoAudio/src/main.js';

const picoAudio = new PicoAudio();

makeSongButton("88KeysButton", "88 Keys", "./Midi/88Keys_Chase.mid");
makeSongButton("SanteriaButton", "Santeria", "./Midi/Santeria.mid");
makeSongButton("OneWingedAngelButton", "One Winged Angel", "./Midi/OneWingedAngel.mid");

let parsedData = null;
const fileInputElem = document.createElement("input");
fileInputElem.type = "file";
fileInputElem.id = "midi-file";
fileInputElem.accept = "audio/midi";
fileInputElem.addEventListener('change', () => {
    const file = fileInputElem.files[0];
    const fileReader = new FileReader();
    fileReader.onload = () => {
        loadFileIntoPicoAudio(fileReader.result);
    };
    fileReader.readAsArrayBuffer(file);
});
document.body.appendChild(fileInputElem);

const startButton = document.createElement("button");
startButton.innerText = "Start";
startButton.addEventListener("click", () => {
    picoAudio.init();
    picoAudio.setLoop(true);
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
        if (parsedData.channels[i].notes.length == 0) {
            continue;
        }
        const channel = document.createElement("p");
        channel.id = `channel${i}`;
        channel.innerText = `Notes in channel ${i}: ${parsedData.channels[i].notes.length}`;
        addChannelOnOffButtons(channel, i);
        channelInfo.appendChild(channel);
    }
};

function addChannelOnOffButtons(element, channelNum) {
    const channelState = document.createElement("div");
    channelState.innerText = "Channel is: On";

    const channelCheckbox = document.createElement("input");
    channelCheckbox.type = "checkbox";
    channelCheckbox.id = `channel${channelNum}Checkbox`;
    channelCheckbox.checked = true;
    channelCheckbox.addEventListener("click", () => {
        if (channelCheckbox.checked){
            channelState.innerText = "Channel is: On"
            picoAudio.playData.channels[channelNum].notes.forEach(note => {
                if (note.oldVelocity) {
                    note.velocity = note.oldVelocity;
                }
            });
        }
        else{
            channelState.innerText = "Channel is: Off";
            picoAudio.playData.channels[channelNum].notes.forEach(note => {
                note.oldVelocity = note.velocity;
                note.velocity = 0;
            });
        }
    });

    element.append(channelState);
    element.append(channelCheckbox);
};

function loadFileIntoPicoAudio(file){
    const standardMidiFile = new Uint8Array(file);
    parsedData = picoAudio.parseSMF(standardMidiFile);
    picoAudio.setData(parsedData);
    makeChannelInfo();
}

function makeSongButton(id, innerText, songPath){
    const songButton = document.createElement("button");
    songButton.id = id;
    songButton.innerText = innerText;
    songButton.addEventListener("click", () => {
        const response = fetch(songPath)
            .then(response => {
                response.arrayBuffer().then(arrayBuffer => loadFileIntoPicoAudio(arrayBuffer));
            });
    });
    document.body.appendChild(songButton);
}