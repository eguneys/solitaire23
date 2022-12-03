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

import { Text, RectView, Clickable, Background, MainMenu } from './game'
import { scene_transition }from './game'

import { HowtoPlay, Settings, About } from './game'

class Card extends Play {

  anim!: Anim

  _init() {

     this.anim = this.make(Anim, Vec2.zero, { name: 'card' })
     this.anim.play('idle')

     let self = this
     this.make(Clickable, Vec2.make(8, 8), {
       rect: Rect.make(0, 0, 180, 220),
       on_hover() {
         self.anim.play('hover')
       },
       on_hover_end() {
         self.anim.play('idle')
       },
       on_click() {
         self.anim.play('idle')
       }
     })

  }
}

class SolitaireGameArea extends Play {


  _init() {

    let x = 280
    let w = 200
    let h = 248
    this.make(Card, Vec2.make(x, 40), {})
    this.make(Card, Vec2.make(x + w, 40), {})
    this.make(Card, Vec2.make(x + w * 2, 40), {})
    this.make(Card, Vec2.make(x + w * 3, 40), {})
    this.make(Card, Vec2.make(x + w * 4, 40), {})
    this.make(Card, Vec2.make(x + w * 5, 40), {})
    this.make(Card, Vec2.make(x + w * 6, 40), {})

    this.make(Card, Vec2.make(x + w * 7.1, 40), {})
    this.make(Card, Vec2.make(x + w * 7.1, 40 + h), {})
    this.make(Card, Vec2.make(x + w * 7.1, 40 + h * 2), {})
    this.make(Card, Vec2.make(x + w * 7.1, 40 + h * 3), {})


    let stock_x = 30
    let stock_y = 200

    this.make(Card, Vec2.make(stock_x, stock_y), {})
    this.make(Card, Vec2.make(stock_x, stock_y + h * 1.05), {})
  }


}

export class SolitairePlay extends Play {

  _init() {

    let sidebar: SideBar

    this.make(Background, Vec2.zero, undefined)

    this.make(SolitaireGameArea, Vec2.make(0, 0), {})

    let overlay = this.make(RectView, Vec2.zero, {
      w: 1920,
      h: 1080,
      color: Color.white
    })
    overlay.visible = false

    this.make(Hamburger, Vec2.make(2, 2), {
      on_click: () => {
        sidebar.open = !sidebar.open
        overlay.visible = sidebar.open
      }
    })

    sidebar = this.make(SideBar, Vec2.make(-400, 180), {
    })


  }
}


class SideBar extends Play {

  get x() {
    return this.open ? 8 : -400
  }

  open: boolean = false

  _init() {

    this.make(RectView, Vec2.make(0, 0), {
      w: 400,
      h: 820,
      color: Color.black
    })

    let x = 20
    let y = 60 
    let h = 160
    this.make(SideBarItem, Vec2.make(x, y), {
      text: 'main menu',
      on_click() {
        scene_transition.next(MainMenu)
      }
    })
    this.make(SideBarItem, Vec2.make(x, y + h), {
      text: 'new game',
      on_click() {
      }
    })

    this.make(SideBarItem, Vec2.make(x, y + h * 2), {
      text: 'settings',
      on_click() {
        scene_transition.next(Settings)
      }
    })
    this.make(SideBarItem, Vec2.make(x, y + h * 3), {
      text: 'how to play',
      on_click() {
        scene_transition.next(HowtoPlay)
      }
    })
    this.make(SideBarItem, Vec2.make(x, y + h * 4), {
      text: 'about',
      on_click() {
        scene_transition.next(About)
      }
    })
  }

  _update() {
    this.position.x = appr(this.position.x, this.x, Time.delta * 1000)
  }

}


type SideBarItemData = {
  text: string,
  on_click: () => void
}
class SideBarItem extends Play {
  get data() {
    return this._data as SideBarItemData
  }

  _init() {
    this.make(Text, Vec2.make(0, 0), {
      text: this.data.text,
      size: 110,
    })


    let w = 360,
      h = 120

    let self = this

    this.make(Clickable, Vec2.make(0, 0), {
      rect: Rect.make(0, 0, w, h),
      on_hover() {
      },
      on_hover_end() {
      },
      on_click() {
        self.data.on_click()
      }
    })


  }


}

type HamburgerData = {
  on_click: () => void
}

class Hamburger extends Play {

  get data() {
    return this._data as HamburgerData
  }

  _init() {

    this.make(Anim, Vec2.make(0, 0), {
      name: 'menu_bar'
    })


    let w = 200,
      h = 100

    let self = this

    this.make(Clickable, Vec2.make(20, 20), {
      rect: Rect.make(0, 0, w, h),
      on_hover() {
      },
      on_hover_end() {
      },
      on_click() {
        self.data.on_click()
      }
    })


  }
}
