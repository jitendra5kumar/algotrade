// @ts-nocheck
/**
 * Play notification sound using Web Audio API
 * Creates a pleasant beep sound without needing external files
 */
export const playNotificationSound = () => {
  try {
    console.log('🔊 Attempting to play notification sound...');
    
    // Check if browser supports Web Audio API
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.log('❌ Web Audio API not supported');
      return;
    }

    const audioContext = new AudioContext();
    console.log('✅ AudioContext created, state:', audioContext.state);
    
    // Resume audio context if suspended (required by some browsers)
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('✅ AudioContext resumed');
      });
    }
    
    // Create oscillator (tone generator)
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure sound - pleasant notification tone
    oscillator.frequency.value = 800; // Frequency in Hz (higher = higher pitch)
    oscillator.type = 'sine'; // Sine wave for smooth sound
    
    // Volume envelope (fade in and out)
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.01); // Fade in (increased volume)
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.15);  // Hold
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);    // Fade out
    
    // Play sound
    oscillator.start(now);
    oscillator.stop(now + 0.3); // Stop after 0.3 seconds
    
    console.log('✅ Sound playing...');
    
    // Cleanup
    oscillator.onended = () => {
      console.log('✅ Sound finished');
      audioContext.close();
    };
    
  } catch (error) {
    console.error('❌ Error playing notification sound:', error);
  }
};

/**
 * Play a double beep notification (more attention-grabbing)
 */
export const playDoubleBeep = () => {
  try {
    console.log('🔊🔊 Attempting to play double beep...');
    
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.log('❌ Web Audio API not supported');
      return;
    }

    const audioContext = new AudioContext();
    console.log('✅ AudioContext created for double beep, state:', audioContext.state);
    
    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('✅ AudioContext resumed for double beep');
      });
    }
    
    // First beep
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.value = 800;
    osc1.type = 'sine';
    
    const now = audioContext.currentTime;
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.5, now + 0.01); // Increased volume
    gain1.gain.linearRampToValueAtTime(0.5, now + 0.1);
    gain1.gain.linearRampToValueAtTime(0, now + 0.2);
    
    osc1.start(now);
    osc1.stop(now + 0.2);
    
    // Second beep (slightly delayed and higher pitch)
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 1000; // Higher pitch
    osc2.type = 'sine';
    
    gain2.gain.setValueAtTime(0, now + 0.25);
    gain2.gain.linearRampToValueAtTime(0.5, now + 0.26); // Increased volume
    gain2.gain.linearRampToValueAtTime(0.5, now + 0.35);
    gain2.gain.linearRampToValueAtTime(0, now + 0.45);
    
    osc2.start(now + 0.25);
    osc2.stop(now + 0.45);
    
    console.log('✅ Double beep playing...');
    
    // Cleanup
    osc2.onended = () => {
      console.log('✅ Double beep finished');
      audioContext.close();
    };
    
  } catch (error) {
    console.error('❌ Error playing double beep:', error);
  }
};

/**
 * Check if sound notifications are enabled
 */
export const isSoundEnabled = () => {
  const enabled = localStorage.getItem('soundNotifications');
  return enabled === null || enabled === 'true'; // Default to true
};

/**
 * Enable/disable sound notifications
 */
export const setSoundEnabled = (enabled) => {
  localStorage.setItem('soundNotifications', enabled.toString());
};

