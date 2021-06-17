#!/usr/bin/env node

import { RenderOptions } from './types'
import { gui } from './gui'
import { parseRegex } from './parseRegex'
import { render } from './index'

/**
 * npx generate-static-site INPUT(url or folder) OUTPUT(folder) ...ENTRIES --allow=/test/i,/yes/i --block=/tst/i,/no/i
 *
 * DEFAULT: src www --allow=/\.js$/
 */

const args = process.argv.slice(2)

let allow: RegExp[] | undefined
let block: RegExp[] | undefined
const entries: string[] = []
let options: RenderOptions = { exec: [] }

// GUI
if (args.length === 0) {
  gui()
}
// normal CLI
else {
  for (let i = args.length - 1; i >= 2; --i) {
    const arg = args[i]

    if (arg.indexOf('--allow=') > -1) {
      allow = arg
        .substring(8)
        .split(',')
        .map(a => parseRegex(a))
      args.splice(i, 1)
    } else if (arg.indexOf('--block=') > -1) {
      block = arg
        .substring(8)
        .split(',')
        .map(a => parseRegex(a))
      args.splice(i, 1)
    } else if (arg.indexOf('--no-follow') > -1) {
      options = { ...options, follow: false }
      args.splice(i, 1)
    } else if (arg.indexOf('--exec=') > -1) {
      const script = arg.substring(7)
      options.exec?.unshift(script)
      args.splice(i, 1)
    } else {
      entries.push(arg)
      args.splice(i, 1)
    }
  }

  const [input = 'src', output = 'www'] = args

  render(input, output, allow, block, entries, options)
}
