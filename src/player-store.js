/*
 * https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode
 * https://www.warpdesign.fr/webaudio-from-scriptprocessornode-to-the-new-audioworklet-api/
 * https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet
 */
import Screamtracker from '../vendor/mod/js/st3'
import Protracker from '../vendor/mod/js/pt'

const READY = 0
const EMPTY = 1
const PLAY = 2
const PAUSED = 3

const AudioContext = window.AudioContext || window.webkitAudioContext

export default class PlayerStore {
  constructor (observer) {
    this._emit = observer || console.info
    this.player = null
    this.context = null
    this.mixerNode = null
    this.amiga500 = false
    this.state = EMPTY
    this._emit('state', EMPTY)
  }

  loadBuffer (type, buffer) {
    buffer = Buffer.from(buffer)
    switch (type) {
      case 's3m':
      case 'audio/x-s3m':
        this.player = new Screamtracker()
        break
      default:
        console.error('unknown mod format', type)
        return
    }

    if (!this.player.parse(buffer)) {
      console.error('Failed to load song')
      return
    }
    this._adjustLowpass()

    /*
    this.mixval = this.player.mixval; // usually 8.0, though
    if (this.autostart) this.play();
    */

    this._chvu = new Float32Array(this.player.channels)
    this.state = READY
    this._emit('state', READY)
  }

  get title () { return this.player && this.player.title }
  get signature () { return this.player && this.player.signature }
  get songLength () { return this.player && this.player.songLength }
  get channels () { return this.player && this.player.channels }
  get patterns () { return this.player && this.player.patterns }
  get sampleNames () {
    return this.player &&
      (this.player instanceof Screamtracker ? this.player.sample : this.player.instrument)
        .map(i => i.name || '\n')
  }

  pause () {
    this.state = PAUSED
    this.player.paused = true
    this.player.playing = false
    this._emit('state', this.state)
  }

  play () {
    switch (this.state) {
      case READY:
        break // Only states that proceeds.
      // All other states return.
      case PAUSED:
        this.player.paused = false
        this.player.playing = true
      default: // eslint-disable-line no-fallthrough
        return
    }

    if (!this.context) this.createContext()
    this._adjustLowpass()

    if (this.player.paused) {
      this.player.paused = false
      return true
    }

    // this.endofsong = false
    this.player.endofsong = false
    this.player.paused = false
    this.player.initialize()
    this.player.flags = 1 + 2
    this.player.playing = true

    /*
    for (let i = 0; i < this.player.channels; i++) this.chvu[i] = 0.0
    this.player.delayfirst = this.bufferstodelay
    */
    this.state = PLAY
    this._emit('state', PLAY)
    return true
  }

  createContext () {
    this.context = new AudioContext()
    const samplerate = this.context.sampleRate

    this.player.samplerate = samplerate
    const bufferlen = (samplerate > 44100) ? 4096 : 2048

    // Amiga 500 fixed filter at 6kHz. WebAudio lowpass is 12dB/oct, whereas
    // older Amigas had a 6dB/oct filter at 4900Hz.
    this.filterNode = this.context.createBiquadFilter()

    this.filterNode.frequency.value = this.amiga500 ? 6000 : 22050

    // "LED filter" at 3275kHz - off by default
    this.lowpassNode = this.context.createBiquadFilter()
    this._adjustLowpass()

    // mixer
    if (typeof this.context.createJavaScriptNode === 'function') {
      this.mixerNode = this.context.createJavaScriptNode(bufferlen, 1, 2)
    } else {
      this.mixerNode = this.context.createScriptProcessor(bufferlen, 1, 2)
    }

    this.mixerNode.onaudioprocess = this._process.bind(this)

    // patch up some cables :)
    this.mixerNode.connect(this.filterNode)
    this.filterNode.connect(this.lowpassNode)
    this.lowpassNode.connect(this.context.destination)
  }

  _adjustLowpass () {
    if (!this.lowpassNode || !this.player) return
    this.lowpassNode.frequency.value = this.player.filter ? 3275 : 28867
  }

  set filter (f) {
    if (this.player) this.player.filter = f
  }

  get filter () { return this.player && this.player.filter }

  // ev: audioProcessingEvent
  _process (ev) {
    const bufs = [
      ev.outputBuffer.getChannelData(0),
      ev.outputBuffer.getChannelData(1)
    ]
    const buflen = ev.outputBuffer.length
    this.player.mix(this.player, bufs, buflen)

    for (let i = 0; i < this.player.channels; i++) {
      // Smooth vu meters by 25%
      this._chvu[i] = this._chvu[i] * 0.25 + this.player.chvu[i] * 0.75
      this.player.chvu[i] = 0.0 // why??
    }

    this.emit('tick', {
      row: this.player.row,
      position: this.player.position,
      speed: this.player.speed,
      bpm: this.player.bpm,
      endofsong: this.player.endofsong,
      chvu: this._chvu
    })
    /* TODO: This messed up the sound, disabled for now.

    // apply stereo separation and soft clipping
    const outp = new Float32Array(2)
    for (let s = 0; s < buflen; s++) {
      outp[0] = bufs[0][s]
      outp[1] = bufs[1][s]

      // a more headphone-friendly stereo separation
      if (this.separation) {
        const t = outp[0]
        if (this.separation === 2) { // mono
          outp[0] = outp[0] * 0.5 + outp[1] * 0.5
          outp[1] = outp[1] * 0.5 + t * 0.5
        } else { // narrow stereo
          outp[0] = outp[0] * 0.65 + outp[1] * 0.35
          outp[1] = outp[1] * 0.65 + t * 0.35
        }
      }

      // scale down and soft clip
      outp[0] /= this.mixval; outp[0] = 0.5 * (Math.abs(outp[0] + 0.975) - Math.abs(outp[0] - 0.975))
      outp[1] /= this.mixval; outp[1] = 0.5 * (Math.abs(outp[1] + 0.975) - Math.abs(outp[1] - 0.975))

      bufs[0][s] = outp[0]
      bufs[1][s] = outp[1]
    } */

    if (this.player.endofsong && this.player.playing) this.stop()
  }
}
