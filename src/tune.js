// Browserify version uses 'pako'
import PicoFeed from 'picofeed'
import { defer } from 'deferinfer'
import { deflateRaw, inflateRaw } from 'zlib'
import { JukeMessage } from './messages'

export function compress (input, opts) {
  input = Buffer.from(input)
  const algo = 1

  return defer(done => {
    switch (algo) {
      case 0:
        return new Promise(input)
      case 1:
        return deflateRaw(input, { level: 9 }, done)

        /* zlib.brotliDecompress dosen't exist in browser.
      case 2:
        const brotliOpts = {
          chunkSize: 32 * 1024,
          params: {
            [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
            [zlib.constants.BROTLI_PARAM_QUALITY]: 10,
            [zlib.constants.BROTLI_PARAM_SIZE_HINT]: input.size
          }
        }
        return brotliCompress(input, done)
        */
    }
  })
    .then(output => {
      console.info(`compressed ${algo} ${input.length} -> ${output.length}, ${output.length / input.length}`)
      return output
    })
}

export function decompress (encoding, bin) {
  switch (encoding) {
    case 0:
      return Promise.resolve(Buffer.from(bin))
    case 1:
      return defer(d => inflateRaw(bin, d))
    default:
      throw new Error('UnknownBinaryEncodingError')
  }
}

class PicoTune extends PicoFeed {
  static get ENCODING_DEFLATE () { return 1 }

  constructor () {
    super({ contentEncoding: JukeMessage, maxSize: 128 << 10 })
  }

  async appendFile (buffer, sk, meta = {}) {
    const data = await compress(buffer)
    const tune = {
      date: new Date().getTime(),
      ...meta,
      data,
      encoding: PicoTune.ENCODING_DEFLATE
    }
    this.append({ tune }, sk)
  }

  async getFile () {
    if (!this.length) return
    const { tune } = this.get(0)
    const data = await decompress(tune.encoding, tune.data)
    return {
      ...tune,
      data
    }
  }
}

export default PicoTune
