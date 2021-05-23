import { join, resolve } from 'path'
import express from 'express'
import { default as prerender } from '../../lib/middleware/index.js'

const app = express()
const port = 8080

app.use(prerender())

// use express static
const options = { extensions: ['html'] }
app.use(express.static(join(resolve(), 'dev/middleware/public'), options))

app.get('*', (req, res) => {
  res.send('404')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
