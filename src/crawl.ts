import puppeteer, { Page } from 'puppeteer'
import { error } from './utils.js'
// import { minify } from 'html-minifier-terser'
import { pageFunction } from './pageFunction.js'
// import path from 'path'

// https://github.com/puppeteer/puppeteer/issues/2138
const windowSet = (page: Page, name: string, value: any) =>
  page.evaluateOnNewDocument(`
    Object.defineProperty(window, '${name}', {
      get() {
        return ${value}
      }
    })
  `)

const matchInArrayOfRegExp = (str: string, expressions: RegExp[]) => {
  for (let i = 0; i < expressions.length; i++) {
    if (expressions[i].test(str)) return true
  }

  return false
}

export const crawl = async (
  page: puppeteer.Page,
  url: string,
  allowList: RegExp[],
  blockList: RegExp[],
  exec: string[] = []
) => {
  const verbose = false

  try {
    await page.setRequestInterception(true)

    // inline style sheets
    const stylesheetContents: any = {}

    // list of additional resources
    const resources: string[] = []

    page.on('request', async req => {
      // copy resources
      const pageURL = new URL(url)
      const reqURL = new URL(req.url())

      // if it is not the requested document
      if (pageURL.pathname !== reqURL.pathname) {
        // if resource is local
        if (pageURL.host === reqURL.host) {
          // copy resource to production folder
          resources.push(req.url())
        }
      }

      // check for "noSSR" attribute
      if (req.url() && req.resourceType() === 'script') {
        const noSSR = await page.evaluate(pageFunction, req.url(), 'nossr', 'src').catch(err => {
          if (verbose) console.log('[evaluate] noSSR attribute', err.message)
        })
        // block if the script should not be executed server side
        if (noSSR && noSSR === true) return req.abort()
      }

      // check for "inline" attribute
      if (req.url() && req.resourceType() === 'stylesheet') {
        const inline = await page.evaluate(pageFunction, req.url(), 'inline', 'href').catch(err => {
          if (verbose) console.log('[evaluate] inline attribute', err.message)
        })
        if (inline) return req.continue()
        else return req.abort()
      }

      // ignore requests for resources that don't produce DOM (images, stylesheets, media)
      if (!['document', 'script', 'xhr', 'fetch'].includes(req.resourceType())) return req.abort()

      const regFileExtension = /(\.[a-z0-9]+)+$/ // matches .html or .something.html

      // allow index pages
      if (req.url() === url || req.url() === url.replace(regFileExtension, '')) return req.continue()

      // abort blocked resources
      if (matchInArrayOfRegExp(req.url(), blockList)) return req.abort()

      // allow allowed resources
      if (allowList.length === 0 || matchInArrayOfRegExp(req.url(), allowList)) return req.continue()

      // block all other requests
      req.abort()
    })

    page.on('response', async res => {
      const responseUrl = res.url()
      const sameOrigin = new URL(responseUrl).origin === new URL(url).origin
      const isStylesheet = res.request().resourceType() === 'stylesheet'

      // console.log('response', responseUrl, sameOrigin, isStylesheet)
      if (sameOrigin && isStylesheet) {
        stylesheetContents[responseUrl] = await res.text()
      }
    })

    await windowSet(page, 'isSRR', true)

    await page.goto(url, { waitUntil: 'networkidle0' })

    // execute custom JavaScript
    for (const e of exec) {
      await page.evaluate(e)
    }

    // inject custom javascript (as function)
    // const handle = () => {
    //   const title = document.getElementById('title')
    //   if (title) title.remove()
    // }
    // await page.evaluate(handle)

    // inject custom javascript (as string)
    // await page.evaluate(`
    //   const title = document.getElementById('title')
    //   if (title) title.remove()
    // `)

    // remove "SSROnly" resources
    await page
      .evaluate(() => {
        const ssr = document.querySelectorAll('[SSROnly]')
        for (let i = 0; i < ssr.length; i++) {
          ssr[i].remove()
        }
      })
      .catch(err => {
        if (verbose) console.log('[evaluate] remove SSROnly', err.message)
      })

    // replace stylesheets in the page with their equivalent <style>.
    await page
      .$$eval(
        'link[rel="stylesheet"]',
        (links, content: any) => {
          links.forEach((link: any) => {
            const cssText = content[link.href]
            if (cssText) {
              const style = document.createElement('style')
              style.textContent = cssText
              link.replaceWith(style)
            }
          })
        },
        stylesheetContents
      )
      .catch(err => {
        if (verbose) console.log('[evaluate] $$eval link[rel="stylesheet"]', err.message)
      })

    // remove listeners
    page.removeAllListeners('request')
    page.removeAllListeners('response')

    // serialized HTML of page DOM.
    const html = await page.content()

    // minify
    // TODO(yandeu): Make this optional
    // html = minify(html, { minifyCSS: true, minifyJS: true })

    return { html, resources }
  } catch (err) {
    error(err.message)
    return { html: 'error while crawling', resources: [] }
  }
}
