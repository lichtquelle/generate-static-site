const { render } = require('../cjs/render')
const { readFileSync } = require('fs')
const { join } = require('path')

const www = join(__dirname, '../www')

test('should render without errors', async () => {
  await render('dev/simple', 'www')
})

test('files should be in www directory', async () => {
  const about = readFileSync(join(www, 'about.html'), { encoding: 'utf-8' })

  expect(/<h1>about<\/h1>/.test(about)).toBeTruthy()
  expect(/hi from script.js/.test(about)).toBeTruthy()
})
