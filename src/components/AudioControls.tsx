import { useEffect, useId, useState } from 'react'
import { SoundToggle } from './SoundToggle'
import type { AudioSettings } from '../sound/settings'
import { EFFECT_OPTIONS, MUSIC_OPTIONS } from '../sound/settings'

export interface AudioControlsProps {
  enabled: boolean
  onToggle: () => void
  settings: AudioSettings
  onChange: (patch: Partial<AudioSettings>) => void
}

/** Mute toggle plus the gear that opens the audio settings panel. */
export function AudioControls({
  enabled,
  onToggle,
  settings,
  onChange,
}: AudioControlsProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className="audio-controls">
      <SoundToggle enabled={enabled} onToggle={onToggle} />
      <button
        type="button"
        className="sound-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Audio settings"
        title="Audio settings"
      >
        <span aria-hidden="true">⚙</span>
      </button>
      {open && (
        <AudioSettingsPanel
          settings={settings}
          onChange={onChange}
          onClose={() => setOpen(false)}
          muted={!enabled}
        />
      )}
    </div>
  )
}

interface PanelProps {
  settings: AudioSettings
  onChange: (patch: Partial<AudioSettings>) => void
  onClose: () => void
  muted: boolean
}

function AudioSettingsPanel({ settings, onChange, onClose, muted }: PanelProps) {
  const musicVolumeId = useId()
  const effectsVolumeId = useId()

  return (
    <section className="audio-panel" role="dialog" aria-label="Audio settings">
      <header className="audio-panel__header">
        <h2>Audio</h2>
        <button
          type="button"
          className="audio-panel__close"
          onClick={onClose}
          aria-label="Close audio settings"
        >
          ✕
        </button>
      </header>

      {muted && (
        <p className="audio-panel__note">
          Sound is muted — these choices are saved and apply when you unmute.
        </p>
      )}

      <fieldset className="audio-panel__group">
        <legend>Music</legend>
        {MUSIC_OPTIONS.map((option) => (
          <label key={option.id} className="audio-panel__option">
            <input
              type="radio"
              name="music-track"
              value={option.id}
              checked={settings.musicTrack === option.id}
              onChange={() => onChange({ musicTrack: option.id })}
            />
            <span className="audio-panel__label">{option.label}</span>
            <span className="audio-panel__hint">{option.description}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="audio-panel__group">
        <legend>Sound effects</legend>
        {EFFECT_OPTIONS.map((option) => (
          <label key={option.id} className="audio-panel__option">
            <input
              type="radio"
              name="effect-pack"
              value={option.id}
              checked={settings.effectPack === option.id}
              onChange={() => onChange({ effectPack: option.id })}
            />
            <span className="audio-panel__label">{option.label}</span>
            <span className="audio-panel__hint">{option.description}</span>
          </label>
        ))}
      </fieldset>

      <div className="audio-panel__group">
        <VolumeSlider
          id={musicVolumeId}
          label="Music volume"
          value={settings.musicVolume}
          onChange={(musicVolume) => onChange({ musicVolume })}
        />
        <VolumeSlider
          id={effectsVolumeId}
          label="Effects volume"
          value={settings.effectsVolume}
          onChange={(effectsVolume) => onChange({ effectsVolume })}
        />
      </div>
    </section>
  )
}

interface VolumeSliderProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
}

function VolumeSlider({ id, label, value, onChange }: VolumeSliderProps) {
  const percent = Math.round(value * 100)
  return (
    <div className="audio-panel__slider">
      <label htmlFor={id}>
        {label}
        <output htmlFor={id}>{percent}%</output>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
    </div>
  )
}
