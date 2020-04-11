<script>
export let uid

const onFileChange = ev => {
  console.log('Fchange', ev)
  const files = ev.target.files || ev.dataTransfer.files
  if (!files.length) return
  const f = files.item(0)
  /*
  const reader = f.stream().getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    await defer(d => parser._write(value, d))
  }*/
}
</script>

<main>
  User ID: {uid.sig.pub.toString('hex')}
  <h1>YGYL</h1>
  <input type="file" on:change={onFileChange}/>
  <button>Play</button><button>Stop</button>
  <p>pay your respects if you lost</p>
  <p><a href="">Make your own groove link</a><p>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
