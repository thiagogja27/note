let isSpeaking = false;
let speechQueue: string[] = [];
let voiceEnabled = true;
let voices: SpeechSynthesisVoice[] = [];

// Function to populate voices
function populateVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    voices = window.speechSynthesis.getVoices();
  }
}

// Initial population of voices
populateVoices();

// Update voices when they change
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = populateVoices;
}

export function setVoiceEnabled(enabled: boolean) {
  voiceEnabled = enabled;
  if (!enabled) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speechQueue = [];
    isSpeaking = false;
  }
}

export function isVoiceEnabled() {
  return voiceEnabled;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  speechQueue = [];
  isSpeaking = false;
}

export function speak(text: string, priority = false) {
  if (!voiceEnabled) {
    return;
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser');
    return;
  }

  if (priority) {
    window.speechSynthesis.cancel();
    speechQueue = [];
    isSpeaking = false;
  }

  speechQueue.push(text);

  if (!isSpeaking) {
    processQueue();
  }
}

function processQueue() {
  if (!voiceEnabled || speechQueue.length === 0) {
    isSpeaking = false;
    return;
  }

  isSpeaking = true;
  const text = speechQueue.shift()!;

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = 'pt-BR';
  utterance.rate = 1.0; // Velocidade padrão
  utterance.pitch = 1.1; // Tom um pouco mais agudo
  utterance.volume = 1.0;

  // If voices are not loaded yet, try to get them.
  if (voices.length === 0) {
    populateVoices();
  }

  const portugueseVoices = voices.filter(voice => voice.lang === 'pt-BR');

  let selectedVoice =
    // 1. Try to find the Google voice, which is often high quality.
    portugueseVoices.find(voice => voice.name.includes('Google português do Brasil')) ||
    // 2. Try to find a voice that identifies as female.
    portugueseVoices.find(voice => voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('feminino')) ||
    // 3. Find any other pt-BR voice.
    portugueseVoices[0] ||
    // 4. As a last resort, find any voice.
    voices[0];


  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onend = () => {
    processQueue();
  };

  utterance.onerror = event => {
    console.error(`Speech synthesis error: ${event.error}`);
    processQueue();
  };

  window.speechSynthesis.speak(utterance);
}

export function announceStorageChange(cellName: string, newValue: string) {
  if (!voiceEnabled) return;

  const message = `Atenção! Alteração de célula. ${cellName} agora é ${newValue}`;
  speak(message, true);
}

export function announceRadarMessage(messagePreview: string) {
  if (!voiceEnabled) return;

  const preview =
    messagePreview.length > 100
      ? messagePreview.substring(0, 100) + '...'
      : messagePreview;
  const message = `Nova mensagem no RADAR. ${preview}`;
  speak(message, false);
}
