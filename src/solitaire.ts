import { TextureFilter, TextureSampler } from 'blah'
import { Color } from 'blah'
import { Rect, Vec2, Mat3x2 } from 'blah'
import { Time, App, batch, Batch, Target } from 'blah'

import Content from './content'
import Input, { Hooks, EventPosition, DragEvent } from './input'
import { howtos } from './howtos'
import { Transition, transition } from './transition'

import { rmap, ease, lerp, appr } from './lerp'
import { InfiniteScrollableList } from './scrollable'

import { bg1, link_color, Play, PlayType} from './play'

import { Anim } from './anim'

import { Background, MainMenu, Navigation } from './game'
import { scene_transition }from './game'

export class SolitairePlay extends Play {

  _init() {


    this.make(Background, Vec2.zero, undefined)

    this.make(Navigation, Vec2.zero, {
      route: 'solitaire',
      on_back() {
        scene_transition.next(MainMenu)
      }
    })


  }

}
