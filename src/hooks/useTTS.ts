// TTS abstraction layer.
//
// Currently uses the browser's Web Speech API.
//
// To swap to a paid TTS service later (e.g. ElevenLabs, Google TTS):
//   - Replace the speak() body with a fetch() to a backend relay endpoint
//     that calls the paid API and returns an audio URL or blob.
//   - Play the audio via new Audio(url).play() or Web Audio API.
//   - The hook signature (speak, cancel) stays identical — callers are unaffected.

export function useTTS() {
  const speak = (text: string): void => {
    if (localStorage.getItem('tts-muted') === 'true') return;
    if (!text.trim()) return;

    window.speechSynthesis.cancel(); // stop current + clear queue
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'de-DE';
    utter.rate = 0.9;
    utter.volume = parseFloat(localStorage.getItem('tts-volume') ?? '1');

    const savedVoice = localStorage.getItem('tts-voice');
    if (savedVoice) {
      const voice = window.speechSynthesis.getVoices().find(v => v.name === savedVoice);
      if (voice) utter.voice = voice;
    }

    window.speechSynthesis.speak(utter);
  };

  const cancel = (): void => {
    window.speechSynthesis.cancel();
  };

  return { speak, cancel };
}
