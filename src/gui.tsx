/* eslint-disable sort-imports */
import { hideCursor, question, showCursor } from 'node-cli'
import { render as r, h } from 'node-cli/lib/jsx/core.js'
import { Write } from 'node-cli/lib/jsx/components/index.js'

import readline from 'readline'
import { render } from './render.js'

export const gui = async () => {
  readline.emitKeypressEvents(process.stdin)
  process.stdin.setRawMode(true)
  process.stdin.on('keypress', (str, key) => {
    // "Raw" mode so we must do our own kill switch (ctrl + c)
    if (key.sequence === '\u0003') {
      showCursor()
      process.exit(0)
    }
  })

  hideCursor()

  const input = (await r(<Write question="Input Folder or URL" placeholder="src" />)) || 'src'
  const output = (await r(<Write question="Output Folder" placeholder="www" />)) || 'www'
  const allow = (await r(<Write question="Allow" placeholder="" />)) || undefined
  const block = (await r(<Write question="Block" placeholder="" />)) || undefined
  const entries = (await r(<Write question="Entries" placeholder="/" />)).split(',') || undefined

  render(input, output, allow, block, entries)
}
