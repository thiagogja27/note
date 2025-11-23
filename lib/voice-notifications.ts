let isSpeaking = false
let speechQueue: string[] = []
let voiceEnabled = true

export function setVoiceEnabled(enabled: boolean) {
  voiceEnabled = enabled
  if (!enabled) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
    speechQueue = []
    isSpeaking = false
  }
}

export function isVoiceEnabled() {
  return voiceEnabled
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel()
  }
  speechQueue = []
  isSpeaking = false
}

export function speak(text: string, priority = false) {
  if (!voiceEnabled) {
    return
  }

  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported in this browser")
    return
  }

  if (priority) {
    window.speechSynthesis.cancel()
    speechQueue = []
    isSpeaking = false
  }

  speechQueue.push(text)

  if (!isSpeaking) {
    processQueue()
  }
}

function processQueue() {
  if (!voiceEnabled || speechQueue.length === 0) {
    isSpeaking = false
    return
  }

  isSpeaking = true
  const text = speechQueue.shift()!

  const utterance = new SpeechSynthesisUtterance(text)

  utterance.rate = 1.0
  utterance.pitch = 1.2
  utterance.volume = 1.0

  const voices = window.speechSynthesis.getVoices()
  const feminineVoice =
    voices.find((voice) => voice.name.includes("Female")) ||
    voices.find((voice) => voice.name.includes("Feminino")) ||
    voices.find((voice) => voice.name.includes("Luciana")) ||
    voices.find((voice) => voice.name.includes("Google português do Brasil")) ||
    voices.find((voice) => voice.lang === "pt-BR") ||
    voices[0]

  if (feminineVoice) {
    utterance.voice = feminineVoice
  }

  utterance.onend = () => {
    processQueue()
  }

  utterance.onerror = () => {
    console.error("Speech synthesis error")
    processQueue()
  }

  window.speechSynthesis.speak(utterance)
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices()
  }
}

export function announceStorageChange(cellName: string, newValue: string) {
  if (!voiceEnabled) return

  const message = `Atenção! Alteração de célula. ${cellName} agora é ${newValue}`
  speak(message, true)
}

export function announceRadarMessage(messagePreview: string) {
  if (!voiceEnabled) return

  const preview = messagePreview.length > 100 ? messagePreview.substring(0, 100) + "..." : messagePreview
  const message = `Nova mensagem no RADAR. ${preview}`
  speak(message, false)
}
