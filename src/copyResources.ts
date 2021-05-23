import { comment, error } from 'node-cli'
import fs from 'fs'
import { nodeFetch } from './dependencies/node-fetch'
import path from 'path'

const done: string[] = []

export const copyResources = (output: string, resources: string[]) => {
  resources.forEach(resource => {
    const url = new URL(resource)
    const pathname = url.pathname
    const file = path.join(output, pathname)

    if (!done.includes(pathname)) {
      done.push(pathname)

      // has to be a file
      if (path.parse(pathname).ext !== '') {
        // comment(`  Downloading: ${pathname}${url.search}`)
        nodeFetch(resource)
          .then(data => {
            fs.mkdir(path.dirname(file), { recursive: true }, err => {
              if (err) error(err.message, false)
              else {
                fs.writeFile(file, data, err => {
                  if (err) error(err.message, false)
                  else {
                    // done
                  }
                })
              }
            })
          })
          .catch((reason: { code: number; message: string }) => {
            comment('')
            error(`Fetch Error: ${reason.code} - ${reason.message}`, false)
            comment(`  ⠕ ${resource}`)
            comment('')
          })
      }
    }
  })
}
