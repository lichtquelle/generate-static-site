#!/usr/bin/env node

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
    } else {
      entries.push(arg)
      args.splice(i, 1)
    }
  }

  const [input = 'src', output = 'www'] = args

  render(input, output, allow, block, entries)
}
