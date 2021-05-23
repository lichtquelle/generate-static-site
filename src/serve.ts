// https://www.npmjs.com/package/serve

import handler from 'serve-handler'
import http from 'http'
import path from 'path'

let server: http.Server
const sockets: Set<any> = new Set()

export const exitServe = (): Promise<void> => {
  return new Promise(resolve => {
    close(() => {
      return resolve()
    })
  })
}

export const startServe = (input: string): Promise<http.Server> => {
  return new Promise(resolve => {
    server = http.createServer((request, response) => {
      // You pass two more arguments for config and middleware
      // More details here: https://github.com/vercel/serve-handler#options
      return handler(request, response, { public: path.join(path.resolve(), input) })
    })

    server.on('connection', socket => {
      sockets.add(socket)
    })

    server.listen(0, () => {
      resolve(server)
    })
  })
}

/**
 * Forcefully terminates HTTP server.
 */
const close = (callback?: (err?: Error | undefined) => void) => {
  for (const socket of sockets) {
    socket.destroy()
    sockets.delete(socket)
  }

  server.close(callback)
}
