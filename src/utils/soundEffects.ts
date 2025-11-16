// Sound effects utility using Web Audio API

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const playSuccessSound = () => {
  try {
    const ctx = getAudioContext();
    
    // Create a pleasant success sound (ascending notes)
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)
    const duration = 0.15;
    
    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      const startTime = ctx.currentTime + (index * duration);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  } catch (error) {
    console.error('Error playing success sound:', error);
  }
};

export const playStartSound = () => {
  try {
    const ctx = getAudioContext();
    
    // Create an engaging start sound (power-up effect)
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Sweep from lower to higher frequency
    oscillator1.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
    oscillator1.type = 'sine';
    
    // Add harmonics
    oscillator2.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
    oscillator2.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    oscillator1.start(ctx.currentTime);
    oscillator1.stop(ctx.currentTime + 0.4);
    oscillator2.start(ctx.currentTime);
    oscillator2.stop(ctx.currentTime + 0.4);
  } catch (error) {
    console.error('Error playing start sound:', error);
  }
};

export const playCompleteSound = () => {
  try {
    const ctx = getAudioContext();
    
    // Create a triumphant completion sound (fanfare)
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const duration = 0.2;
    
    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'triangle';
      
      const startTime = ctx.currentTime + (index * duration * 0.5);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  } catch (error) {
    console.error('Error playing complete sound:', error);
  }
};

export const playPauseSound = () => {
  try {
    const ctx = getAudioContext();
    
    // Create a gentle pause sound (descending tone)
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.2);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.25);
  } catch (error) {
    console.error('Error playing pause sound:', error);
  }
};

export const playResumeSound = () => {
  try {
    const ctx = getAudioContext();
    
    // Create an uplifting resume sound (ascending tone)
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.25);
  } catch (error) {
    console.error('Error playing resume sound:', error);
  }
};

export const playClickSound = () => {
  try {
    const ctx = getAudioContext();
    
    // Create a subtle click sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  } catch (error) {
    console.error('Error playing click sound:', error);
  }
};
