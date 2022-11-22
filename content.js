import fs from 'fs'
import chokidar from 'chokidar'
import pack from './_pack.js'


const ase_content = () => {
  pack().catch(e => {
    console.warn('failed to pack.')
  })
}


chokidar.watch(['./content/sprites/*.ase'
], { ignoreInitial: true })
  .on('all', (event, path) => ase_content())

ase_content()
