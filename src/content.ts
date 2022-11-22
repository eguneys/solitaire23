import Game from './game'
import { Rect, Vec2, Image as BImage } from 'blah'
import { Texture, Subtexture } from 'blah'

import { Sprite } from './assets/sprite'

import content_page0 from '../content/out_0.png'
import content_page0_json from '../content/out_0.json'


function load_image(path: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    let res = new Image()
    res.onload = () => resolve(res)
    res.src = path
  })
}



class Content {

  load = async () => {

    let image = await load_image(content_page0)
    let texture = Texture.from_image(image)

    this.sprites = []
  }


  sprites!: Array<Sprite>

  find_sprite(name: string) {
    return this.sprites.find(_ => _.name === name)!
  }
}


export default new Content()
