const Watcher = require('feed-watcher')
const Queue = require('bull')
const stream = require('./stream')

const queue = new Queue('anime streaming')
const watcher = new Watcher('http://horriblesubs.info/rss.php?res=1080', 10)

watcher.on('new entries', entries => {
  console.log(`found ${entries.length} new entries`)

  entries.forEach(entry => {
    queue.add({ magnet: decodeURI(entry.link) })
  })
})

watcher.start()
.then(entries => {
  entries.forEach(entry => queue.add({ magnet: decodeURI(entry.link) }))
})
.catch(err => {
  console.log(err)
})

queue.process((job, done) => {
  stream(job.data.magnet, done)
})

queue.on('failed', (job, err) => console.log(err))

queue.clean(1)
