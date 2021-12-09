import PicoAudio from './PicoAudio/src/main.js';

const picoAudio = new PicoAudio();

makeSongButton("88KeysButton", "88 Keys", "./Midi/88Keys_Chase.mid");
makeSongButton("SanteriaButton", "Santeria", "./Midi/Santeria.mid");
makeSongButton("OneWingedAngelButton", "One Winged Angel", "./Midi/OneWingedAngel.mid");

let parsedData = null;
let analyzedNotes = null;
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

function addChannelOnOffButtons(element, channelNum){
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
                if (!note.oldVelocity) {
                    note.oldVelocity = note.velocity;
                }
                note.velocity = 0;
            });
        }
    });

    element.append(channelState);
    element.append(channelCheckbox);
};

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
        if (trebleCheckbox.checked){
            if (analyzedNotes && analyzedNotes.trebleNotes) {
                analyzedNotes.trebleNotes.forEach(value => {
                    picoAudio.playData.channels[value.channel].notes[value.note].velocity = picoAudio.playData.channels[value.channel].notes[value.note].oldVelocity;
                });
            }
        }
        else{
            if (analyzedNotes && analyzedNotes.trebleNotes) {
                analyzedNotes.trebleNotes.forEach(value => {
                    if (!picoAudio.playData.channels[value.channel].notes[value.note].oldVelocity) {
                        picoAudio.playData.channels[value.channel].notes[value.note].oldVelocity = picoAudio.playData.channels[value.channel].notes[value.note].velocity;
                    }
                    picoAudio.playData.channels[value.channel].notes[value.note].velocity = 0;
                });
            }
        }
    });

    const trebleCheckboxLabel = document.createElement("label");
    trebleCheckboxLabel.innerText = "Play treble notes";
    trebleCheckboxLabel.for = trebleCheckbox.id;

    const bassCheckbox = document.createElement("input");
    bassCheckbox.type = "checkbox";
    bassCheckbox.id = `bassCheckbox`;
    bassCheckbox.checked = true;
    bassCheckbox.addEventListener("click", () => {
        if (bassCheckbox.checked){
            if (analyzedNotes && analyzedNotes.bassNotes) {
                analyzedNotes.bassNotes.forEach(value => {
                    picoAudio.playData.channels[value.channel].notes[value.note].velocity = picoAudio.playData.channels[value.channel].notes[value.note].oldVelocity;
                });
            }
        }
        else{
            if (analyzedNotes && analyzedNotes.bassNotes) {
                analyzedNotes.bassNotes.forEach(value => {
                    if (!picoAudio.playData.channels[value.channel].notes[value.note].oldVelocity) {
                        picoAudio.playData.channels[value.channel].notes[value.note].oldVelocity = picoAudio.playData.channels[value.channel].notes[value.note].velocity;
                    }
                    picoAudio.playData.channels[value.channel].notes[value.note].velocity = 0;
                });
            }
        }
    });

    const bassCheckboxLabel = document.createElement("label");
    bassCheckboxLabel.innerText = "Play bass notes";
    bassCheckboxLabel.for = bassCheckbox.id;

    trebleBassControls.append(trebleCheckboxLabel);
    trebleBassControls.append(trebleCheckbox);
    trebleBassControls.append(bassCheckboxLabel);
    trebleBassControls.append(bassCheckbox);
}

function loadFileIntoPicoAudio(file){
    const standardMidiFile = new Uint8Array(file);
    parsedData = picoAudio.parseSMF(standardMidiFile);
    picoAudio.setData(parsedData);
    analyzeNotes(parsedData);
    addTrebleAndBassOnOffButtons();
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

function analyzeNotes(parsedData){
    analyzedNotes = {};
    analyzedNotes.trebleNotes = [];
    analyzedNotes.bassNotes = [];
    for (let c = 0; c < parsedData.channels.length; c++) {
        for (let n = 0; n < parsedData.channels[c].notes.length; n++) {
            let noteInfo = {
                channel: c,
                note: n
            };

            if (parsedData.channels[c].notes[n].pitch >= 60) {
                analyzedNotes.trebleNotes.push(noteInfo);
            }
            else {
                analyzedNotes.bassNotes.push(noteInfo);
            }
        }
    }
}