import { writable, derived, readable } from 'svelte/store'
import { Identity } from 'cryptology'
import PicoTune from './tune'
// import Player from '../vendor/mod/js/player.js'

import App from './App.svelte'
// Todo: turn this into standalone-module
const initIdentity = () => {
  const stored = window.localStorage.getItem('identity')
  if (!stored) {
    const id = new Identity()
    window.localStorage.setItem('identity', Identity.encode(id))
    console.info('new identity generated')
    return id
  } else {
    console.info('loading existing identity')
    return Identity.decode(stored)
  }
}
const uid = initIdentity()
// --- end of uid
// const theme = writable(0)
const model = new PicoTune()
const clear = () => { /* eject? */ }
try {
  const url = new URL(window.location)
  if (url.hash.length) model.merge(url)
  else clear()
} catch (err) {
  console.warn('Failed to load URL', err)
  console.info('Loading default sample')
  clear()
}

const binarySong = writable({})
const imp = writable(0)
const importFile = file => {
  imp.set(file)
}

if (model.length) {
  // theme.set(card.theme)
  model.getFile()
    .then(file => binarySong.set(file))
}

const pickle = writable('')
// This might leak your song before release.
pickle.subscribe(p => { if (p.length) window.location.hash = p })

const pack = (f) => {
  if (!f || !f.data) return
  console.log('packing PicoTune')
  model.truncate(0)
  model.appendFile(f.data, uid.sig.sec, {
    type: f.type,
    name: f.name
  })
    .then(model.getFile.bind(model))
    .then(file => {
      pickle.set(model.pickle())
      binarySong.set(file)
    })
    .catch(err => {
      binarySong.set(f) // let the user play the song anyway.
      pickle.set('ERROR_SONG_TOO_BIG')
      console.error(err)
    })
}

imp.subscribe(pack)

const app = new App({
  target: document.body,
  props: {
    bin: binarySong,
    importFile
  }
})

export default app
