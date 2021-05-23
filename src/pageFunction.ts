// useful article: https://developers.google.com/web/tools/puppeteer/articles/ssr

export function pageFunction(url: string, attr: 'nossr' | 'inline', linkTag: 'src' | 'href') {
  // http://something.com/js/script.js
  const absoluteURL = document.querySelector(`[${linkTag}='${url}']`)
  // /js/script.js
  const absolutePath = document.querySelector(`[${linkTag}='${new URL(url).pathname}']`)
  // js/script.js
  const relativePath = document.querySelector(`[${linkTag}='${new URL(url).pathname.replace(/^\//, '')}']`)

  const typeOfAbsoluteURL = typeof absoluteURL?.getAttribute(attr)
  const typeOfAbsolutePath = typeof absolutePath?.getAttribute(attr)
  const typeOfRelativePath = typeof relativePath?.getAttribute(attr)

  const found = typeOfAbsoluteURL === 'string' || typeOfAbsolutePath === 'string' || typeOfRelativePath === 'string'

  return found
}
