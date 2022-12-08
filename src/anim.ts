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


  alpha: number = 255
  get alpha_color() {
    return new Color(this.alpha, this.alpha, this.alpha, this.alpha)
  }

  _animation: string = 'idle'
  get animation() {
    return this.sprite.get(this._animation)
  }

  _frame_counter: number = 0
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

  _reverse: boolean = false
  _on_complete?: () => void
  play_now(name: string, on_complete?: () => void, reverse: boolean = false) {
    this._on_complete = on_complete
    this._animation = name
    this._frame = 0

    if (reverse) {
      let frames_length = this.animation?.frames.length || 0
      this._frame = frames_length - 1
    }
    this._reverse = reverse
  }

  will_play?: () => void
  play(name: string, on_complete?: () => void, reverse: boolean = false) {

    this.will_play = () => this.play_now(name, on_complete, reverse)
  }

  _update() {

    const frames_length = this.animation?.frames.length
    const frame_duration = this.frame?.duration

    if (frames_length && frame_duration) {

      this._frame_counter += Time.delta

      if (this._frame_counter >= frame_duration) {
        this._frame_counter -= frame_duration
        if (this._reverse) {
          this._frame--;
          if (this._frame < 0) {
            this._frame = frames_length - 1
            if (this._on_complete) {
              this._on_complete()
            }
            if (this.will_play) {
              this.will_play()
              this.will_play = undefined
            }
          }
        } else {
          this._frame++;
          if (this._frame >= frames_length) {
            this._frame = 0
            if (this._on_complete) {
              this._on_complete()
            }
            if (this.will_play) {
              this.will_play()
              this.will_play = undefined
            }
          }
        }
      }
    }
  }


  _draw(batch: Batch) {

    if (!this.subtexture) {
      return
    }

    batch.push_matrix(Mat3x2.create_transform(this.position, this.origin, this.scale, this.rotation))
    this.g_position = Vec2.transform(Vec2.zero, batch.m_matrix)
    batch.stex(this.subtexture, Vec2.zero, this.alpha_color)
    batch.pop_matrix()
    
  }
}
