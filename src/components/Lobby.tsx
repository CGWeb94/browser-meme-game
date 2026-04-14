import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { MEME_SET_SIZES } from '../types';
import type { MemeSet } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

function getAvatarColor(name: string): string {
  const colors = ['#c0392b', '#2980b9', '#8e44ad', '#27ae60', '#e67e22', '#16a085', '#d35400', '#2c3e50'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/** Person silhouette SVG for avatar */
function AvatarIcon({ name }: { name: string }) {
  return (
    <div
      style={{
        width: '2.5rem',
        height: '2.5rem',
        borderRadius: '50%',
        background: getAvatarColor(name),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '2px solid rgba(212,160,32,0.5)',
        fontSize: '0.75rem',
        fontWeight: '700',
        color: '#fff',
      }}
    >
      {getInitials(name)}
    </div>
  );
}

function CodeDisplay({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.6rem 1.5rem',
        borderRadius: '9999px',
        background: 'rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', letterSpacing: '0.06em' }}>
        LOBBY CODE:
      </span>
      <span style={{ color: '#d4a020', fontFamily: 'monospace', fontWeight: '700', fontSize: '1.1rem', letterSpacing: '0.18em' }}>
        {revealed ? code : '• • • • • •'}
      </span>
      <button
        onClick={() => setRevealed(!revealed)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '1rem', padding: '0 0.1rem', lineHeight: 1 }}
        title={revealed ? 'Code verstecken' : 'Code anzeigen'}
      >
        {revealed ? '👁️' : '🔒'}
      </button>
      <button
        onClick={handleCopy}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#4ade80' : 'rgba(255,255,255,0.6)', fontSize: '1rem', padding: '0 0.1rem', lineHeight: 1 }}
        title="Code kopieren"
      >
        {copied ? '✓' : '📋'}
      </button>
    </div>
  );
}

/** Section heading styled like the screenshot */
function PanelHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        color: '#ffffff',
        fontWeight: '800',
        fontSize: '1rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: '0.875rem',
      }}
    >
      {children}
    </h3>
  );
}

export default function Lobby() {
  const { state, send, dispatch } = useGame();
  const { lobbyId, isHost, players, settings } = state;
  const isMobile = useIsMobile();

  // ── Local TTS settings (stored in localStorage) ──
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>(
    () => localStorage.getItem('tts-voice') ?? ''
  );
  const [ttsMuted, setTtsMuted] = useState<boolean>(
    () => localStorage.getItem('tts-muted') === 'true'
  );
  const [ttsVolume, setTtsVolume] = useState<number>(
    () => parseFloat(localStorage.getItem('tts-volume') ?? '1')
  );

  useEffect(() => {
    const load = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) setVoices(available);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speakPreview = (voiceName: string, volume: number, muted: boolean) => {
    if (muted) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance('Hallo! So klinge ich.');
    utter.lang = 'de-DE';
    utter.volume = volume;
    if (voiceName) {
      const v = voices.find(v => v.name === voiceName);
      if (v) utter.voice = v;
    }
    window.speechSynthesis.speak(utter);
  };

  const handleVoiceChange = (name: string) => {
    setSelectedVoice(name);
    localStorage.setItem('tts-voice', name);
    speakPreview(name, ttsVolume, ttsMuted);
  };

  const handleMuteToggle = () => {
    const next = !ttsMuted;
    setTtsMuted(next);
    localStorage.setItem('tts-muted', String(next));
    if (!next) speakPreview(selectedVoice, ttsVolume, false);
    else window.speechSynthesis.cancel();
  };

  const handleVolumeChange = (vol: number) => {
    setTtsVolume(vol);
    localStorage.setItem('tts-volume', String(vol));
  };

  const handleStart = () => send('startGame', { lobbyId: lobbyId! });
  const handleLeave = () => {
    send('leaveLobby', { lobbyId: lobbyId! });
    dispatch({ type: 'RESET' });
  };
  const updateSetting = (key: string, value: any) => {
    if (key === 'memeSet') {
      const newSet = value as MemeSet;
      send('hostSettings', { lobbyId: lobbyId!, settings: { memeSet: newSet, cardSetSize: MEME_SET_SIZES[newSet] } });
    } else {
      send('hostSettings', { lobbyId: lobbyId!, settings: { [key]: value } });
    }
  };

  const connectedPlayers = players.filter(p => p.connected);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'radial-gradient(ellipse at center, #2d6a4a 0%, #1a3d2a 60%, #0f2218 100%)',
      }}
    >
      {/* Vignette */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* Lobby code header */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', paddingTop: '1.25rem', paddingBottom: '0.5rem' }}>
        <CodeDisplay code={lobbyId || ''} />
      </div>

      {/* Two panels */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '1rem',
          padding: isMobile ? '0.75rem 1rem' : '0.75rem 1.5rem',
          alignItems: 'flex-start',
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* ── Players panel ── */}
        <div
          style={{
            flex: 1,
            background: 'rgba(0,0,0,0.38)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            padding: '1.25rem',
          }}
        >
          <PanelHeading>Players ({connectedPlayers.length}/{players.length})</PanelHeading>

          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {players.map(p => (
              <li
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  background: p.id === state.playerId ? 'rgba(212,160,32,0.1)' : 'rgba(0,0,0,0.3)',
                  border: p.id === state.playerId ? '1px solid rgba(212,160,32,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  opacity: p.connected ? 1 : 0.45,
                }}
              >
                <AvatarIcon name={p.name} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                    {p.id === state.hostId && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          background: 'rgba(212,160,32,0.2)',
                          color: '#d4a020',
                          fontWeight: '700',
                          flexShrink: 0,
                        }}
                      >
                        ★ Host
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                  <span
                    style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: p.connected ? '#4ade80' : '#6b7280',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                    {p.connected ? 'Online' : 'Offline'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginLeft: '0.15rem' }}>
                    Ready
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {players.length < 3 && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
              Mindestens 3 Spieler benötigt
            </p>
          )}
        </div>

        {/* ── Settings panel ── */}
        <div
          style={{
            flex: 1,
            background: 'rgba(0,0,0,0.38)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            padding: '1.25rem',
          }}
        >
          <PanelHeading>
            Settings{' '}
            {!isHost && (
              <span style={{ color: '#d4a020', fontWeight: '600' }}>(HOST ONLY)</span>
            )}
            {isHost && (
              <span style={{ color: '#d4a020', fontWeight: '600' }}>(HOST ONLY)</span>
            )}
          </PanelHeading>

          {isHost ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Rundenzahl */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.875rem' }}>Rundenzahl</span>
                  <span style={{ color: '#d4a020', fontWeight: '700', fontSize: '0.875rem' }}>{settings.totalRounds}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', minWidth: '1rem', textAlign: 'right' }}>3</span>
                  <input type="range" min="3" max="15" step="1" value={settings.totalRounds} onChange={e => updateSetting('totalRounds', parseInt(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', minWidth: '1.5rem' }}>15</span>
                </div>
              </div>

              {/* Meme-Set */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.875rem' }}>Meme-Set</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>{settings.cardSetSize} Karten</span>
                </div>
                <select
                  className="input-field"
                  style={{ fontSize: '0.875rem' }}
                  value={settings.memeSet ?? 'spongebob'}
                  onChange={e => updateSetting('memeSet', e.target.value)}
                >
                  <option value="spongebob">Spongebob ({MEME_SET_SIZES.spongebob} Memes)</option>
                  <option value="general">General ({MEME_SET_SIZES.general} Memes)</option>
                  <option value="all">Alle ({MEME_SET_SIZES.all} Memes)</option>
                </select>
              </div>

              {/* Satzmodus */}
              <div>
                <span style={{ display: 'block', color: '#fff', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.4rem' }}>Satzmodus</span>
                <select
                  className="input-field"
                  style={{ fontSize: '0.875rem' }}
                  value={settings.sentenceMode}
                  onChange={e => updateSetting('sentenceMode', e.target.value)}
                >
                  <option value="random">Standard</option>
                  <option value="player_generated">Spieler schreiben Sätze</option>
                </select>
              </div>

              {settings.sentenceMode === 'player_generated' && (
                <div>
                  <span style={{ display: 'block', color: '#fff', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.4rem' }}>Sätze pro Spieler</span>
                  <select
                    className="input-field"
                    style={{ fontSize: '0.875rem' }}
                    value={settings.sentencesPerPlayer}
                    onChange={e => updateSetting('sentencesPerPlayer', parseInt(e.target.value))}
                  >
                    <option value={1}>1 Satz</option>
                    <option value={2}>2 Sätze</option>
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              {[
                { label: 'Runden', value: settings.totalRounds },
                { label: 'Meme-Set', value: settings.memeSet === 'spongebob' ? `Spongebob (${MEME_SET_SIZES.spongebob})` : settings.memeSet === 'general' ? `General (${MEME_SET_SIZES.general})` : `Alle (${MEME_SET_SIZES.all})` },
                { label: 'Modus', value: settings.sentenceMode === 'random' ? 'Standard' : 'Spieler-Sätze' },
              ].map(row => (
                <div
                  key={row.label}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                  <span style={{ color: '#d4a020', fontWeight: '700' }}>{row.value}</span>
                </div>
              ))}
              <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>Warte auf den Host...</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Local TTS settings (per player, not synced) ── */}
      <div style={{ position: 'relative', zIndex: 10, padding: isMobile ? '0 1rem 0.5rem' : '0 1.5rem 0.5rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Text-to-Speech
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>Nur für dich</span>
          </div>

          {/* Controls row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Mute button */}
            <button
              onClick={handleMuteToggle}
              title={ttsMuted ? 'TTS einschalten' : 'TTS stummschalten'}
              style={{
                width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', border: 'none',
                background: ttsMuted ? 'rgba(220,38,38,0.25)' : 'rgba(34,197,94,0.2)',
                color: ttsMuted ? '#f87171' : '#4ade80',
                fontSize: '1.1rem', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {ttsMuted ? '🔇' : '🔊'}
            </button>

            {/* Volume slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', minWidth: '1.5rem', textAlign: 'right' }}>0%</span>
              <input
                type="range" min="0" max="1" step="0.05"
                value={ttsVolume}
                disabled={ttsMuted}
                onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                onMouseUp={() => speakPreview(selectedVoice, ttsVolume, ttsMuted)}
                onTouchEnd={() => speakPreview(selectedVoice, ttsVolume, ttsMuted)}
                style={{ width: '90px', opacity: ttsMuted ? 0.35 : 1 }}
              />
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', minWidth: '2rem' }}>
                {Math.round(ttsVolume * 100)}%
              </span>
            </div>

            {/* Voice selector */}
            <select
              className="input-field"
              style={{ flex: 1, minWidth: '180px', fontSize: '0.82rem', padding: '0.4rem 0.65rem', opacity: ttsMuted ? 0.45 : 1 }}
              value={selectedVoice}
              disabled={ttsMuted}
              onChange={e => handleVoiceChange(e.target.value)}
            >
              <option value="">Standard (Browser-Stimme)</option>
              {voices.map(v => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {state.error && (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            margin: '0 1.25rem 0.5rem',
            background: 'rgba(220,38,38,0.2)',
            border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: '0.75rem',
            padding: '0.6rem 1rem',
            color: '#fca5a5',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          {state.error}
        </div>
      )}

      {/* Bottom buttons */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: isMobile ? 'column-reverse' : 'row',
        gap: '0.75rem',
        padding: isMobile ? '0.75rem 1rem 1.25rem' : '1rem 1.5rem',
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
      }}>
        <button className="btn-secondary" style={{ flexShrink: 0, padding: '0.85rem 2rem', fontSize: '1rem' }} onClick={handleLeave}>
          Verlassen
        </button>
        {isHost ? (
          <button
            className="btn-green"
            style={{ flex: 1, fontSize: '1.1rem', padding: '0.85rem', fontWeight: '800' }}
            onClick={handleStart}
            disabled={connectedPlayers.length < 2}
          >
            ⚙️ Spiel starten
            {connectedPlayers.length < 2 && ` (${connectedPlayers.length}/2)`}
          </button>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>Warte auf den Host...</span>
          </div>
        )}
      </div>
    </div>
  );
}
