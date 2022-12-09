import fs from 'fs'
import chokidar from 'chokidar'
import pack from './_pack.js'


const ase_content = () => {
  pack().catch(e => {
    console.warn('failed to pack.', e)
  })
}


chokidar.watch(['./content/sprites/*.ase'
], { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 500 } })
  .on('all', (event, path) => ase_content())

ase_content()
