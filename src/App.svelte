<script>
export let bin
export let importFile

import { derived, readable } from 'svelte/store'
import ModPlayer from '../vendor/mod'

const emptyState = {
title: 'YGYL',
signature: '<noname>',
desc: `
     (\\  (\\ /)  /)
    (' \\.(*v*)./ ')
    ',_/       \\_,'
       (__ . __)
       (,,) (,,)
DROP YOUR GROOVES HERE
        - h00`
}

const player = new ModPlayer()

// tune store notifies ui of player changes..
const tune = readable(emptyState, set => {
  player._emit = (ev, data) => {
    switch(ev) {
      case 'state':
        set({
          state: data,
          title: player.title,
          signature: player.signature,
          songLength: player.songLength,
          // channels: player.channels,
          // patterns: player.patterns,
          sampleNames: player.sampleNames,
          desc: player.desc
        })
        break
    }
  }
})
let isEmpty = true
// This store is just a consumer of changes to binary
// e.g. loads the casette ;)
bin.subscribe(b => {
  if (!b.data || !b.data.length) return
  isEmpty = false
  const { name, type, data } = b
  console.log('Inserting casette', name, type)
  const ext = name.split('.')
  const t = type.length ? type : ext[ext.length - 1]
  player.loadBuffer(t, data)
  player.play()
})

const eject = () => {
  player.stop()
  isEmpty = true
}

const onFileChange = ev => {
  const files = ev.target.files || ev.dataTransfer.files
  if (!files.length) return
  const f = files.item(0)
  f.arrayBuffer()
    .then(buffer => {
      importFile({
        type: f.type,
        name: f.name,
        data: ModPlayer.normBuffer(buffer)
      })
    })
    .catch(console.error)
}
</script>

<main>
  <section class="player">
    <h1>{$tune.title}</h1>
    <h2 class="disc"
        class:playing={$tune.state === 2}
        on:click={() => player.state === 2 ? player.pause() : player.play()}
        >📀</h2>
    <br/>
    <pre class="desc">{$tune.desc}</pre>
  </section>
  <section class="melodymaker">
    <input type="file" on:change={onFileChange}/>
    <button on:click={player.play.bind(player)}>Play</button>
    <button on:click={player.stop.bind(player)}>Stop</button>

  </section>

[⏏️] -eject
</main>

<style>
</style>
