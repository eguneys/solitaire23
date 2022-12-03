import { TextureFilter, TextureSampler } from 'blah'
import { Color } from 'blah'
import { Rect, Vec2, Mat3x2 } from 'blah'
import { Time, App, batch, Batch, Target } from 'blah'

import Content from './content'

import { Play } from './play'


export type AnimData = {
  name: string
}

export class Anim extends Play {

  get data() {
    return this._data as AnimData
  }

  get sprite() {
    return Content.find_sprite(this.data.name)
  }

  _animation: string = 'idle'
  get animation() {
    return this.sprite.get(this._animation)
  }

  _frame: number = 0

  get frame() {
    return this.animation?.frames[this._frame]

  }

  get subtexture() {
    return this.frame?.image
  }

  get duration() {
    return this.frame?.duration
  }

  play(name: string) {
    this._animation = name
  }


  _draw(batch: Batch) {

    if (!this.subtexture) {
      return
    }


    batch.stex(this.subtexture, this.position, Color.white)
    
  }
}
