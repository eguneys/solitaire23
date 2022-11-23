import { Rect, Vec2 } from 'blah'
import { Component } from '../world'


export class Collider extends Component {

  static make_rect = (rect: Rect) => {
    let res = new Collider()

    res.rect = rect
    return res
  }

  mask!: number
  rect!: Rect

  check(mask: number, offset: Vec2 = Vec2.zero): boolean {
    return !!this.first(mask, offset)
  }


  first(mask: number, offset: Vec2 = Vec2.zero): Collider | undefined {
    if (this.world) {
      return this.world.all(Collider).find(_ =>
        _ !== this && 
        (_.mask & mask) === mask && 
        this.overlaps(_, offset))
    }
    return undefined
  }


  overlaps(other: Collider, offset: Vec2) {
    return this.rect_to_rect(this, other, offset)
  }


  rect_to_rect(a: Collider, b: Collider, offset: Vec2) {
    let ar = a.rect.add(a.entity.position.add(offset))
    let br = b.rect.add(b.entity.position)

    return ar.overlaps(br)
  }
}
