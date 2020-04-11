import App from './App.svelte'
import Feed from 'picofeed'
import 'jsxm/xm'
import 'jsxm/xmeffects'

// Todo: turn this into standalone-module
import { Identity } from 'cryptology'
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
// --- end of uid



const app = new App({
	target: document.body,
	props: {
		uid
	}
});

export default app
