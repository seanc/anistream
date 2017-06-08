const exec = require('execa')
const torrentStream = require('torrent-stream')
const path = require('path')

const validExts = ['.mp4', '.mkv', '.flv']

function stream(magnet, cb) {
	const engine = torrentStream(magnet, {
    uploads: 0
  })

	engine.on('ready', () => {
		const file = engine.files.find(file => {
			return validExts.includes(path.extname(file.name))
		})

		console.log(`found file ${file.name}`)

		const readStream = file.createReadStream()
		return exec('sh', ['./scripts/yt.sh'], {
			input: readStream
		})
	})
}

module.exports = stream
