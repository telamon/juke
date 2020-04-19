<script>
export let bin
export let importFile
export let pickle
export let error
import { writable, derived, readable } from 'svelte/store'
import ModPlayer from '../vendor/mod'
// import dbnc from 'debounce'

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
const vu = writable([])
// tune store notifies ui of player changes..
const tune = readable(emptyState, set => {
  let tickCtr = 0
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
      case 'tick':
        if (++tickCtr % 2) break
        vu.set(data.chvu)
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

const processFile = file => {
  return file.arrayBuffer()
    .then(buffer => {
      importFile({
        type: file.type,
        name: file.name,
        data: ModPlayer.normBuffer(buffer)
      })
    })
    .catch(console.error)
}
const onFileChange = ev => {
  const files = ev.target.files || ev.dataTransfer.files
  if (!files.length) return
  const f = files.item(0)
  processFile(f)
}

let dragOver = false
const onDrop = ev => {
  dragOver = false
  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    for (var i = 0; i < ev.dataTransfer.items.length; i++) {
      // If dropped items aren't files, reject them
      if (ev.dataTransfer.items[i].kind === 'file') {
        return processFile(ev.dataTransfer.items[i].getAsFile())
      }
    }
  } else {
    // Use DataTransfer interface to access the file(s)
    for (var i = 0; i < ev.dataTransfer.files.length; i++) {
      return processFile(ev.dataTransfer.files[i].name)
    }
  }
}
const onDragover = ev => { dragOver = true }
</script>
<main on:drop|preventDefault={onDrop}
      on:dragover|preventDefault={onDragover}>
  <section class="player">
    <h1>{$tune.title}</h1>
    <h2 class="disc"
        class:playing={$tune.state === 2}
        on:click={() => player.state === 2 ? player.pause() : player.play()}
        >📀</h2>
    <br/>
    <div class="vuMeters">
      {#each $vu as ch}
        <meter id="fuel"
               min="0" max="1"
              low="0.2" high="0.6" optimum="0.5"
                                 value={ch}>

        </meter>
      {/each}
    </div>
    <p>
    {#if !$error}
      <a href={'#' + $pickle} style="color: green;">🥒Pickle Link</a>
    {:else}
      <span style="color: red;">{$error}</span>
    {/if}
    </p>
    <pre class="desc">{$tune.desc}</pre>
    {#if isEmpty}
      <!-- for devices that don't have DnD -->
      <div><input type="file" on:change={onFileChange}/></div>
    {/if}
  </section>
  <footer><a href="http://decentlabs.se">copyright © DecentLabs 2020 - License GNU AGPLv3</a> <a href="https://github.com/telamon/juke/">Source</a></footer>
  <!-- not used
  <section class="melodymaker">
    <button on:click={player.play.bind(player)}>Play</button>
    <button on:click={player.stop.bind(player)}>Stop</button>
    [⏏️]

  </section>-->
</main>

<style>
</style>
