import { World, Component } from '../world'
import { Vec2, Mat3x2 } from 'blah'

import Input, { EventPosition } from '../input'
import { Collider } from './collider'
import Mask from '../masks'

export class Hoverable extends Component {


  collider?: Collider
  on_hover_begin?: () => void;
  on_hover_end?: () => void;

  _hovering: boolean = false

  update() {
    if (this.collider?.check(Mask.hover)) {
      if (!this._hovering) {
        this._hovering = true
        this.on_hover_begin?.()
      }
    } else {
      if (this._hovering) {
        this._hovering = false
        this.on_hover_end?.()
      }
    }
  }

}
