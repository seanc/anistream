const Watcher = require('feed-watcher')
const Queue = require('bull')
const stream = require('./stream')

const queue = new Queue('anime streaming', null, {opts: {
  stalledInterval: 0
}})
const watcher = new Watcher('https://anidex.info/rss/?&cat=1,3&lang_id=1&q=', 10)

queue.empty().then(() => console.log('emptied queue'))

const cache = []

watcher.on('new entries', entries => {
  console.log(`found ${entries.length} new entries`)

  entries.forEach(entry => {
    const magnet = decodeURI(entry.summary.match(/href="([^"]*")/g)[1].replace(/(href=|")/g, ''))
    queue.add({ magnet })
  })
})

watcher.start()
.then(entries => {
  entries.forEach(entry => {
    const magnet = decodeURI(entry.summary.match(/href="([^"]*")/g)[1].replace(/(href=|")/g, ''))
    queue.add({ magnet })
  })
})
.catch(err => {
  console.log(err)
})

queue.process((job, done) => {
  stream(job.data.magnet, done)
})

queue.on('failed', (job, err) => console.log(err))
queue.on('completed', job => {
  if (cache.length <= 10) cache.push({ magnet: job.data.magnet })
  else {
    const newQueue = cache.reverse()

    newQueue.forEach(item => queue.add({ magnet: item }))
    cache.length = 0
  }
})
