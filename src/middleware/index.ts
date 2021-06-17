import type { Request, Response } from 'express'
import path from 'path'
import { render } from '../render.js'

// copied and modified from https://github.com/yandeu/five-server/blob/main/src/middleware/cache.ts
const _cache: Map<string, { timestamp: number; file: string }> = new Map()

const checkCache = (
  req: Request,
  res: Response,
  maxCacheTime: number,
  revalidateCacheTime: number
): { file: string; prerender?: boolean } | undefined => {
  const url = req.url.replace(/^\//, '')
  const method = req.method
  const now = new Date().getTime()
  const id = `${method}_${url}`
  const data = _cache.get(id)

  if (data) {
    const age = Math.round((now - data?.timestamp) / 1000)

    if (age < maxCacheTime) {
      res.setHeader('Age', age)
      res.setHeader('X-Cache', 'Hit from prerender')
      res.type('text/html')

      return { file: data.file }
    }

    if (age < maxCacheTime + revalidateCacheTime) {
      res.setHeader('Age', age)
      res.setHeader('X-Cache', 'Hit from prerender')
      res.type('text/html')

      return { file: data.file, prerender: true }
    }
  }

  return
}
const doCache = (req: Request, res: Response, html: string, send: boolean) => {
  const url = req.url.replace(/^\//, '')
  const method = req.method
  const now = new Date().getTime()
  const id = `${method}_${url}`

  if (send) {
    res.setHeader('Age', 0)
    res.setHeader('X-Cache', 'Miss from prerender')
    res.type('text/html')
  }

  console.log('CACHING id:', id)

  _cache.set(id, { timestamp: now, file: html })
}

const isHeadlessChrome = (req: Request): boolean => {
  if (req.headers && req.headers['user-agent'] && /HeadlessChrome/gim.test(req.headers['user-agent'])) return true
  else return false
}

const shouldPrerender = (req: Request): boolean => {
  if (!req.url) return false

  const isFolder = !path.extname(req.url)
  const isHtml = path.extname(req.url) === '.html'

  if (!isFolder && !isHtml) return false

  if (req.method != 'GET' && req.method != 'HEAD') return false

  if (isHeadlessChrome(req)) return false

  return true
}

const time = () => new Date().getTime()

const renderAndCache = async (req: Request, res: Response, next: any, send: boolean) => {
  const host = `${req.protocol}://${req.get('host')}`

  const start = time()

  const rendered = await render(host, '', undefined, undefined, [req.url], {
    copy: false,
    follow: false,
    write: false,
    silent: true
  })

  const ttRenderMs = time() - start

  if (rendered && rendered[0]) {
    doCache(req, res, rendered[0].html, send)
    if (send) res.set('Server-Timing', `Prerender;dur=${ttRenderMs};desc="Headless render time (ms)"`)
    if (send) return res.send(rendered[0].html)
  } else {
    if (send) return next()
  }

  return
}

export interface MiddlewareOptions {
  /**
   * Max time to cache the pre-rendered html (in seconds).
   * @default 432000 seconds (5 days)
   */
  maxCacheTime?: number
  /**
   * Buffer time to re-render without cold start (in seconds).
   * @default 3600 seconds (1 hour)
   */
  revalidateCacheTime?: number
}
export default (options: MiddlewareOptions = {}) => {
  const { maxCacheTime = 432000, revalidateCacheTime = 3600 } = options

  return async (req: Request, res: Response, next: any) => {
    if (!req.url) return next()

    const isHeadless = isHeadlessChrome(req)

    const cached = checkCache(req, res, maxCacheTime, revalidateCacheTime)
    // send cached file
    if (!isHeadless && cached && !cached.prerender) {
      console.log('FROM CACHE', req.url)
      return res.send(cached.file)
    }
    // send cached file (but re-render and re-cache)
    else if (!isHeadless && cached && cached.prerender) {
      console.log('FROM CACHE (with re-render)', req.url)

      // TODO(yandeu): Serve new requests from cache while HeadlessChrome is re-rendering the page

      if (shouldPrerender(req)) renderAndCache(req, res, next, false).catch(err => console.log('err', err))
      return res.send(cached.file)
    }
    // prerender and return
    else {
      if (!shouldPrerender(req)) return next()
      console.log('PRERENDER', req.url)
      return renderAndCache(req, res, next, true).catch(err => console.log('err', err))
    }
  }
}
