import { Entity, World, Component } from '../world'
import { Color, Rect, Vec2, Mat3x2 } from 'blah'

import { NavigateBack, Background } from './background'
import { Animator } from './animator'
import { Text } from './text'
import Game from '../game'
import { Hoverable } from './hoverable'
import { Collider } from './collider'

export class Tab extends Component {
  static make = (world: World, position: Vec2, text: string) => {

    let en = world.add_entity(position)
    en.add(new Tabs())


    let anim = en.add(Animator.make('palette'))
    anim.play('2')
    anim.scale = Vec2.make(138/8, 30/8)

    let title = en.add(Text.make(text, 32, Color.white))
    title.offset = Vec2.make(4, 4)

    let hitbox = en.add(Collider.make_rect(Rect.make(0, 0, 138, 30)))

    let hover = en.add(new Hoverable())
    hover.collider = hitbox
    hover.on_hover_begin = () => {
      anim.play('5')
      title.color = Color.hex(0x202431)
    }
    hover.on_hover_end = () => {
      anim.play('2')
      title.color = Color.white
    }



    return en
  }
}


export class TabContent extends Component {
  static make = (world: World, position: Vec2) => {
    let en = world.add_entity(position)
    en.add(new TabContent())

    let anim = en.add(Animator.make('palette'))
    anim.play('2')
    anim.scale = Vec2.make(600/8, 280/8)


    en.active = false
    en.visible = false

    return en
  }


  hide() {

    this.entity.active = false
    this.entity.visible = false
  }

  show() {
    this.entity.active = true
    this.entity.visible = true
  }
}

export class SolitaireContent extends Component {
  static make = (en: Entity) => {
    en.add(new SolitaireContent())


    let scrollable = ScrollableContent.make(en)

    let content = en.add(Text.make("solitaire", 32, Color.white))
    content.offset = Vec2.make(4, 4)



  }
}

export class Tabs extends Component {

  static make = (world: World, position: Vec2) => {
    let en = world.add_entity(position)
    en.add(new Tabs())

    let anim = en.add(Animator.make('palette'))
    anim.play('1')
    anim.scale = Vec2.make(140*3/8, 34/8)



    let v_off = 2
    let h_off = 140
    Tab.make(world, position.add(Vec2.make(v_off, v_off)), 'solitaire')
    Tab.make(world, position.add(Vec2.make(v_off + h_off, v_off)), 'freecell')
    Tab.make(world, position.add(Vec2.make(v_off + h_off * 2, v_off)), 'spider')

    let content_position = Vec2.make(20, 60)
    let solitaire = TabContent.make(world, content_position)
    let freecell = TabContent.make(world, content_position)
    let spider = TabContent.make(world, content_position)

    SolitaireContent.make(solitaire)

    solitaire.get(TabContent).show()

    return en
  }
}

export class HowtoPlay extends Component {


  static make = (world: World, position: Vec2) => {
    let en = world.add_entity(position)

    en.add(new HowtoPlay())

    Background.make(world, position)
    let back = NavigateBack.make(world, 'how to play')
    let tabs = Tabs.make(world, position.add(Vec2.make(250, 4)))

    return en

  }
}

