import { Component } from '../world'
import { Time, Batch, Vec2, Mat3x2, Color } from 'blah'
import { Sprite } from '../assets/sprite'
import Content from '../content'

export class Text extends Component {

  static make = (text: string, size: number = 64, color: Color = Color.white, rotation: number) => {
    let res = new Text()
    res.text = text
    res.size = size
    res.color = color
    res.rotation = rotation
    return res
  }

  rotation?: number
  text!: string
  size!: number
  color!: Color
  offset!: Vec2

  get end_x() {
    return this.offset.x + Content.sp_font.width_of(this.text) / (64 + 16) * this.size
  }

  render(batch: Batch) {

    batch.push_matrix(
        Mat3x2.create_transform(this.entity.position,
                                Vec2.zero, Vec2.one, this.rotation || 0))

    batch.str_j(Content.sp_font, this.text, this.offset, Vec2.zero, this.size, this.color)

    batch.pop_matrix()
  }
}
