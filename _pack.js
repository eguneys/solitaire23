import fs from 'fs'
import { ImageSave, Rect, Packer, aseprite } from 'aset'

export default async function pack() {

  let packer = new Packer()

  let sprites = []

  await ase_files('./content/sprites')
  .then(_ => _.map(({name, ase}) => {

    let packs = ase.frames.map(frame => packer.add(frame.image))
    let { tags } = ase

    sprites.push({ name, packs, tags })
  }))




  packer.pack()

  sprites = sprites.map(({ name, packs, tags }) => ({
    name,
    tags,
    packs: packs.map(_ => ({ frame: _.frame, packed: _.packed }))
  }))


  let res = {
    sprites
  }

  fs.writeFileSync('./content/out_0.png', packer.pages[0].png_buffer)
  fs.writeFileSync('./content/out_0.json', JSON.stringify(res))

  console.log('content written.')

}


function ase_files(folder) {
  return new Promise(resolve => {
    fs.readdir(folder, (err, files) => {
      Promise.all(files.filter(_ => _.match(/\.ase$/))
        .map(file => new Promise(_resolve => {
          fs.readFile([folder, file].join('/'), (err, data) => {
            if (err) {
              console.error(err)
              return
            }
            let name = file.split('.')[0]
            _resolve({ name, ase: aseprite(data)})
          })
        }))).then(resolve)

    })
  })
}
