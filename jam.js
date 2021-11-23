const audioContext = new AudioContext;

gainNode = audioContext.createGain();
gainNode.connect(audioContext.destination); 
gainNode.gain.value = 0.1 ** 2;

const startButton = document.createElement("button");
startButton.innerText = "Start";
startButton.addEventListener("click", () => {
    oscillator = audioContext.createOscillator();
    oscillator.connect(gainNode);
    oscillator.start();
});
document.body.appendChild(startButton);

const stopButton = document.createElement("button");
stopButton.innerText = "Stop";
stopButton.addEventListener("click", () => {
    oscillatorGain = audioContext.createGain();
    oscillatorGain.gain.value = 1;
    oscillatorGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
    oscillator.connect(oscillatorGain).connect(gainNode);
    oscillator.stop();
});
document.body.appendChild(stopButton);