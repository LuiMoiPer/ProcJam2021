import PicoAudio from './PicoAudio/src/main.js';

const picoAudio = new PicoAudio();

const audioContext = new AudioContext;
const fileInputElem = document.getElementById('midi-file');
fileInputElem.addEventListener('change', () => {
    const file = fileInputElem.files[0];
    const fileReader = new FileReader();
    fileReader.onload = () => {
        const standardMidiFile = new Uint8Array(fileReader.result);
        const parsedData = picoAudio.parseSMF(standardMidiFile);
        picoAudio.setData(parsedData);
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