import { error as _error } from 'node-cli'

export const PACKAGE_NAME = 'generate-static-html'

export const trim = (str: string) => {
  return str.trim().replace(/(?<!:)\/+/gm, '/')
}

export const error = (msg: string) => {
  _error(msg, false)
}

export const exitWithError = (msg?: string) => {
  if (msg) _error(msg)
  else _error('Usage: publish <output> <url> <...entries>')

  process.exit(1)
}
