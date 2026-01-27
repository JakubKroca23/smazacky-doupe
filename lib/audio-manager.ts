// Audio Manager for sound effects and background music
export class AudioManager {
  private static instance: AudioManager
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private bgMusic: HTMLAudioElement | null = null
  private isMuted: boolean = false
  private volume: number = 0.5

  private constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.loadMuteState()
    }
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  private loadMuteState() {
    const saved = localStorage.getItem('audio_muted')
    this.isMuted = saved === 'true'
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    localStorage.setItem('audio_muted', this.isMuted.toString())
    if (this.bgMusic) {
      this.bgMusic.volume = this.isMuted ? 0 : this.volume
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.bgMusic && !this.isMuted) {
      this.bgMusic.volume = this.volume
    }
  }

  // Play sound effect using Web Audio API (synthesized)
  playSound(type: 'click' | 'win' | 'lose' | 'coin' | 'dice' | 'error' | 'notification') {
    if (this.isMuted || !this.audioContext) return

    const ctx = this.audioContext
    const now = ctx.currentTime

    switch (type) {
      case 'click':
        this.playSynth([800, 1000], [0.1, 0.05], now)
        break
      case 'win':
        this.playSynth([400, 500, 600, 800], [0.1, 0.1, 0.1, 0.2], now)
        break
      case 'lose':
        this.playSynth([200, 150, 100], [0.15, 0.15, 0.2], now)
        break
      case 'coin':
        this.playSynth([800, 1200], [0.05, 0.1], now)
        break
      case 'dice':
        this.playNoise(0.05, now)
        break
      case 'error':
        this.playSynth([300, 200], [0.1, 0.15], now)
        break
      case 'notification':
        this.playSynth([600, 800, 600], [0.05, 0.05, 0.1], now)
        break
    }
  }

  private playSynth(frequencies: number[], durations: number[], startTime: number) {
    if (!this.audioContext) return
    
    const ctx = this.audioContext
    let time = startTime

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.frequency.value = freq
      osc.type = 'sine'
      
      gain.gain.setValueAtTime(this.volume * 0.3, time)
      gain.gain.exponentialRampToValueAtTime(0.01, time + durations[i])
      
      osc.start(time)
      osc.stop(time + durations[i])
      
      time += durations[i]
    })
  }

  private playNoise(duration: number, startTime: number) {
    if (!this.audioContext) return
    
    const ctx = this.audioContext
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    
    source.buffer = buffer
    source.connect(gain)
    gain.connect(ctx.destination)
    
    gain.gain.setValueAtTime(this.volume * 0.1, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
    
    source.start(startTime)
  }

  // Background music (looping ambient)
  playBgMusic() {
    if (this.isMuted) return
    
    if (!this.bgMusic) {
      // Since we don't have MP3 files, we'll create a simple ambient drone
      this.createAmbientDrone()
    }
  }

  private createAmbientDrone() {
    if (!this.audioContext || this.isMuted) return
    
    const ctx = this.audioContext
    
    // Create low frequency drone
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc1.frequency.value = 55 // A1
    osc2.frequency.value = 82.5 // E2
    osc1.type = 'sine'
    osc2.type = 'sine'
    
    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)
    
    gain.gain.value = this.volume * 0.05 // Very quiet ambient
    
    osc1.start()
    osc2.start()
  }

  stopBgMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause()
      this.bgMusic.currentTime = 0
    }
  }
}

export const audioManager = AudioManager.getInstance()
