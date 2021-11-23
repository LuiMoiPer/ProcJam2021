audioContext = new AudioContext;

gainNode = audioContext.createGain();
gainNode.connect(audioContext.destination); 
gainNode.gain.value = 0.1 ** 2;

oscillator = audioContext.createOscillator();
oscillator.connect(gainNode);
oscillator.start();