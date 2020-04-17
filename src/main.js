import { Identity } from 'cryptology'
import Feed from 'picofeed'
import PlayerStore from './player-store'
import App from './App.svelte'
// Todo: turn this into standalone-module
const initIdentity = () => {
  const stored = localStorage.getItem('identity')
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
const player = new PlayerStore()
// --- end of uid


// import 'jsxm/xm'
// import 'jsxm/xmeffects'

const app = new App({
	target: document.body,
	props: {
		uid,
    player
	}
});

export default app
