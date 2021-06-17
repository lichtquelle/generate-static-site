export interface RenderOptions {
  // execute custom JavaScrip
  exec?: string[]
  // crawl detected links
  follow?: boolean
  // copy resources to the output directory
  copy?: boolean
  // write files to disk; else return as string[]
  write?: boolean
  // don't print anything to the console
  silent?: boolean
}
