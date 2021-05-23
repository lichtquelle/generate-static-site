const { render } = require('../lib/render')
const { readFileSync } = require('fs')
const { join } = require('path')

const www = join(__dirname, '../www')

test('should render without errors', async done => {
  await render('dev/simple', 'www')
  done()
})

test('files should be in www directory', async done => {
  const about = readFileSync(join(www, 'about.html'), { encoding: 'utf-8' })

  expect(/<h1>about<\/h1>/.test(about)).toBeTruthy()
  expect(/hi from script.js/.test(about)).toBeTruthy()

  done()
})
