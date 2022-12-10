import Game from './game'
import { Rect, Vec2, Image as BImage } from 'blah'
import { Texture, Subtexture } from 'blah'
import { SpriteFont} from 'blah'

import { Frame, Animation, Sprite } from './assets/sprite'
import { NineSlice } from './assets/nine'

import content_page0 from '../content/out_0.png'
import content_page0_json from '../content/out_0.json'


import content_font0 from '../content/fonts/out_0.png'
import content_font0_json from '../content/fonts/out_0.json'

function load_image(path: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    let res = new Image()
    res.onload = () => resolve(res)
    res.src = path
  })
}



class Content {


  static make_nine_slice = (texture: Texture, _sprite: any) => {
    let { name, packs, _tags } = _sprite

    let frames = []
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let _ = packs[0]
        let duration = 1
        let x = i * _.frame.w / 3
        let y = j * _.frame.h / 3
        let framerect = Rect.make(_.frame.x, _.frame.y, _.frame.w/3, _.frame.h/3)
        let subrect = Rect.make(x + _.packed.x, y + _.packed.y, 4 + 400/3, 4 +400/3)

        let frame = new Frame(Subtexture.make(texture, subrect, framerect), duration)
        frames.push(frame)
      }
    }

    return new NineSlice(name, frames)
  }

  load = async () => {

    let [image,
     font_image] = await Promise.all([
       load_image(content_page0),
       load_image(content_font0),
     ])

    let texture = Texture.from_image(image)

    this.sprites = []

    this.nine_slice = []


    content_page0_json.sprites.forEach(_sprite => {
      let { name, packs, tags } = _sprite

      if (name.match(/nine_slice/)) {
        this.nine_slice.push(Content.make_nine_slice(texture, _sprite))
        return
      }

      let origin = Vec2.zero

      let animations: Array<Animation> = []

      tags.forEach(tag => {
        let frames = []
        for (let i = tag.from; i <= tag.to; i++) {

          let _ = packs[i]
          let duration = _.meta.duration/ 1000
          let framerect = Rect.make(_.frame.x, _.frame.y, _.frame.w, _.frame.h)
          let subrect = Rect.make(_.packed.x, _.packed.y, _.packed.w, _.packed.h)

          let frame = new Frame(Subtexture.make(texture, subrect, framerect), duration)
          frames.push(frame)
        }

          let anim = new Animation(tag.name, frames)

          animations.push(anim)
      })



      let sprite = new Sprite(name, origin, animations)

      this.sprites.push(sprite)


    })


    let font_json = {
      ...content_font0_json,
      size: 128
    }

    this.sp_font = SpriteFont.make(font_json, font_image)
  }


  sp_font!: SpriteFont
  sprites!: Array<Sprite>

  nine_slice!: Array<NineSlice>

  find_sprite(name: string) {
    return this.sprites.find(_ => _.name === name)!
  }

  find_nine(name: string) {
    return this.nine_slice.find(_ => _.name === name)!
  }
}


export default new Content()
