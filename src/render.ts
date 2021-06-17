/* eslint-disable sort-imports */
import { comment, step, success } from 'node-cli'
import { exitWithError, error, trim } from './utils'
import { exitServe, startServe } from './serve'
import { crawl } from './crawl'
import fs from 'fs/promises'
import path from 'path'
import puppeteer from 'puppeteer'
import { copyResources } from './copyResources'
import { RenderOptions } from './types'

export const render = async (
  input: string,
  output: string,
  allow: RegExp[] = [], // allow all by default
  block: RegExp[] = [
    /google-analytics\.com/,
    /\/gtag\/js/,
    /ga\.js/,
    /analytics\.js/,
    /doubleclick\.net/,
    /facebook\.net/,
    /stats\.wp\.com/
  ],
  entries: string[] = ['/'],
  options: RenderOptions = {}
) => {
  const { exec = [], follow = true, copy = true, write = true, silent = false } = options

  let _filePath = ''
  /** stores the rendered html pages if options "write" is set to false */
  const files: { path: string; html: string }[] = []

  if (!entries || entries.length === 0) entries = ['/']

  if (!silent) {
    step('Generating Static Site')
    comment(`  Input: ${input}`)
    comment(`  Output: ${output}`)
    comment(`  Entries: ${entries.join(', ')}`)
    comment(`  Allow: ${allow.join(', ')}`)
    comment(`  Block: ${block.join(', ')}`)
    comment('')
  }

  const isUrl = /^https?:\/\//.test(input)

  // start server if input is a path
  const server = isUrl ? undefined : await startServe(input)
  // set the input to the server address
  if (server) input = `http://localhost:${(server.address() as any).port}`

  // start the browser
  if (!silent) step('Starting headless browser')
  const browser = await puppeteer.launch({ headless: true }).catch(err => exitWithError(err.message))
  const browserTab = await browser.newPage()

  // pages (queue) to crawl and render
  const pages: string[] = []
  // rendered pages
  const rendered: string[] = []

  // add page to queue
  const addPage = (page: string) => {
    const p = page.replace(/^\/+/gm, '/')

    // check for / (root) OR
    // .html or .php extension OR
    // for no extension
    if (p !== '/' && !/\/[a-z0-9-_]+\.?(html|php)?$/gm.test(p)) return

    if (!rendered.includes(p)) pages.push(p)
  }

  // add entries from CLI to queue
  entries
    .map(e => (e[0] === '/' ? e : `/${e}`))
    .reverse()
    .forEach(e => addPage(e))

  while (pages.length > 0) {
    const page = pages.pop()
    if (!page || rendered.includes(page)) continue

    // log
    if (!silent) {
      if (rendered.length < 10) comment(`  Crawling: ${page}`)
      else if (rendered.length % 10 === 0) comment(`  Crawling: more..., please wait.`)
    }

    // crawl the page
    const _url = trim(`${input}/${page}`)

    const { html, resources } = await crawl(browserTab, _url, allow, block, exec).catch(err =>
      exitWithError(err.message)
    )

    // copy resources (images, css, scripts etc.)
    if (copy) copyResources(`${path.resolve()}/${output}`, resources)

    // get all internal links from html
    if (follow) {
      let matches
      const regInternalLinks = /href=['"]([a-z0-6/._-]+)['"]/gm
      while ((matches = regInternalLinks.exec(html)) !== null) {
        const url = matches[1]

        // absolute url
        if (/^\//.test(url)) addPage(url)
        // relative url
        else addPage(`${page}/${url}`)
      }
    }

    // absolute path to file
    _filePath = trim(`${path.resolve()}/${output}/${page !== '/' ? page : 'index.html'}`).replace('//', '/')

    try {
      // create directory
      await fs.mkdir(_filePath.replace(/\/[a-z0-6._-]+$/gm, ''), { recursive: true }) // .catch(err => error(err.message))

      // ensure .html extension
      if (!/\.html$/.test(_filePath)) _filePath += '.html'

      // create file
      if (write) await fs.writeFile(_filePath, html, { encoding: 'utf-8' })
    } catch (err) {
      comment('')
      error(`Error while rendering '${page}'`)
      comment(`  ⠕ ${err.message}`)
      comment('')
    }

    if (!write) files.push({ path: _filePath, html })

    // mark page as rendered
    rendered.push(page)
  }

  // log
  if (!silent) {
    const _output = trim(`/${output}`)
    comment('')
    success(`Rendered ${rendered.length} page${rendered.length > 1 ? 's' : ''} to ${_output}`, null)
    comment('')
  }

  // close browser
  await browserTab.close()
  await browser.close().catch(err => exitWithError(err.message))

  // close server
  if (server) await exitServe()

  return files

  // exit app
  // process.exit(0)
}
