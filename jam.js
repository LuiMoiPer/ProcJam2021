import AdaptiveAudio from "./AdaptiveAudio/main.js";

const adaptiveAudio = new AdaptiveAudio();

makeSongButton("88KeysButton", "88 Keys", "./Midi/88Keys_Chase.mid");
makeSongButton("SanteriaButton", "Santeria", "./Midi/Santeria.mid");
makeSongButton("OneWingedAngelButton", "One Winged Angel", "./Midi/OneWingedAngel.mid");

const fileInputElem = document.createElement("input");
fileInputElem.type = "file";
fileInputElem.id = "midi-file";
fileInputElem.accept = "audio/midi";
fileInputElem.addEventListener('change', () => {
    const file = fileInputElem.files[0];
    const fileReader = new FileReader();
    fileReader.onload = () => {
        updateSong(fileReader.result);
    };
    fileReader.readAsArrayBuffer(file);
});
document.body.appendChild(fileInputElem);

const startButton = document.createElement("button");
startButton.innerText = "Start";
startButton.addEventListener("click", () => {
    adaptiveAudio.play();
});
document.body.appendChild(startButton);

const stopButton = document.createElement("button");
stopButton.innerText = "Stop";
stopButton.addEventListener("click", () => {
    adaptiveAudio.pause();
});
document.body.appendChild(stopButton);

function makeSongButton(id, innerText, songPath){
    const songButton = document.createElement("button");
    songButton.id = id;
    songButton.innerText = innerText;
    songButton.addEventListener("click", () => {
        const response = fetch(songPath)
            .then(response => {
                response.arrayBuffer().then(arrayBuffer => updateSong(arrayBuffer));
            });
    });
    document.body.appendChild(songButton);
}

function addTrebleAndBassOnOffButtons(){
    let trebleBassControls = document.getElementById("TrebleBassControls");
    if (trebleBassControls != null) {
        trebleBassControls.parentNode.removeChild(trebleBassControls);
    }

    trebleBassControls = document.createElement("div");
    trebleBassControls.id = "TrebleBassControls";
    document.body.appendChild(trebleBassControls);

    const trebleCheckbox = document.createElement("input");
    trebleCheckbox.type = "checkbox";
    trebleCheckbox.id = `trebleCheckbox`;
    trebleCheckbox.checked = true;
    trebleCheckbox.addEventListener("click", () => {
        adaptiveAudio.setTrebleOn(trebleCheckbox.checked);
    });

    const trebleCheckboxLabel = document.createElement("label");
    trebleCheckboxLabel.innerText = "Play treble notes";
    trebleCheckboxLabel.for = trebleCheckbox.id;

    const bassCheckbox = document.createElement("input");
    bassCheckbox.type = "checkbox";
    bassCheckbox.id = `bassCheckbox`;
    bassCheckbox.checked = true;
    bassCheckbox.addEventListener("click", () => {
        adaptiveAudio.setBassOn(bassCheckbox.checked);
    });

    const bassCheckboxLabel = document.createElement("label");
    bassCheckboxLabel.innerText = "Play bass notes";
    bassCheckboxLabel.for = bassCheckbox.id;

    trebleBassControls.append(trebleCheckboxLabel);
    trebleBassControls.append(trebleCheckbox);
    trebleBassControls.append(bassCheckboxLabel);
    trebleBassControls.append(bassCheckbox);
}

function makeChannelInfo(){
    let channelInfo = document.getElementById('ChannelInfo');
    if (channelInfo != null) {
        channelInfo.parentNode.removeChild(channelInfo);
    }

    channelInfo = document.createElement("p");
    channelInfo.id = 'ChannelInfo';
    channelInfo.innerText = "Channel Info: "
    document.body.appendChild(channelInfo);

    let midiData = adaptiveAudio.getMidiData();
    
    for (let i = 0; i < midiData.channels.length; i++) {
        if (midiData.channels[i].notes.length == 0) {
            continue;
        }
        const channel = document.createElement("p");
        channel.id = `channel${i}`;
        channel.innerText = `Notes in channel ${i}: ${midiData.channels[i].notes.length}`;
        addChannelOnOffButtons(channel, i);
        channelInfo.appendChild(channel);
    }
};

function addChannelOnOffButtons(element, channelNum){
    const channelState = document.createElement("div");
    channelState.innerText = "Channel is: On";

    const channelCheckbox = document.createElement("input");
    channelCheckbox.type = "checkbox";
    channelCheckbox.id = `channel${channelNum}Checkbox`;
    channelCheckbox.checked = true;
    channelCheckbox.addEventListener("click", () => {
        adaptiveAudio.setChannelOn(channelNum, channelCheckbox.checked);
    });

    element.append(channelState);
    element.append(channelCheckbox);
};

function updateSong(arrayBuffer){
    adaptiveAudio.setMidi(arrayBuffer);
    adaptiveAudio.setLooping(true);
    addTrebleAndBassOnOffButtons();
    makeChannelInfo();
}