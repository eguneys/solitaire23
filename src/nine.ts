import { TextureFilter, TextureSampler } from 'blah'
import { Color } from 'blah'
import { Rect, Vec2, Mat3x2 } from 'blah'
import { Time, App, batch, Batch, Target } from 'blah'

import Content from './content'

import { Play } from './play'



export type NineData = {
  name: string,
  w: number,
  h: number
}
export class Nine extends Play {

  get data() {
    return this._data as NineData
  }

  get nine() {
    return Content.find_nine(this.data.name)
  }

  _draw(batch: Batch) {

    let { frames  } = this.nine

    let src_w = 400 / 3
    let mid_scale_h = (this.data.h - src_w * 2) / src_w
    let mid_scale_w = (this.data.w - src_w * 2) / src_w

    batch.push_matrix(Mat3x2.create_transform(this.position, Vec2.zero, Vec2.one, 0))
    this.g_position = Vec2.transform(Vec2.zero, batch.m_matrix)
    batch.stex(frames[0].image, Vec2.make(0, 0), Color.white)
    batch.stex_o(frames[1].image, Vec2.make(0, src_w), Vec2.zero, Vec2.make(1, mid_scale_h), 0, Color.white)
    batch.stex(frames[2].image, Vec2.make(0, src_w + mid_scale_h*src_w), Color.white)

    batch.stex_o(frames[3].image, Vec2.make(src_w, 0), Vec2.zero, Vec2.make(mid_scale_w, 1), 0, Color.white)
    batch.stex_o(frames[4].image, Vec2.make(src_w, src_w), Vec2.zero, Vec2.make(mid_scale_w, mid_scale_h), 0, Color.white)
    batch.stex_o(frames[5].image, Vec2.make(src_w, src_w + mid_scale_h * src_w), Vec2.zero, Vec2.make(mid_scale_w, 1), 0, Color.white)

    batch.stex(frames[6].image, Vec2.make(src_w + mid_scale_w * src_w, 0), Color.white)
    batch.stex_o(frames[7].image, Vec2.make(src_w + mid_scale_w * src_w, src_w), Vec2.zero, Vec2.make(1, mid_scale_h), 0, Color.white)
    batch.stex(frames[8].image, Vec2.make(src_w + mid_scale_w * src_w,
                                          src_w + mid_scale_h * src_w), Color.white)

    batch.pop_matrix()
    
  }

}
