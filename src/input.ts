import { Vec2 } from 'blah'
import { Mouse } from './mouse'

export type EventPosition = Vec2

export type DragEvent = {
  e: EventPosition,
  _right: boolean,
  m?: EventPosition
}

export type Hooks = {
  priority?: number,
  on_hover?: (e: EventPosition) => boolean,
  on_hover_clear?: () => void,
  on_up?: (e: EventPosition, right: boolean, m?: Vec2) => boolean,
  on_click?: (e: EventPosition, right: boolean) => boolean,
  on_click_begin?: (e: EventPosition, right: boolean) => boolean,
  on_drag?: (d: DragEvent, d0?: DragEvent) => boolean,
  on_wheel?: (d: number, e: EventPosition) => boolean,
  on_context?: () => boolean
}


class Input {

  _on_update?: () => void
  _hooks: Array<Hooks> = []

  register(hooks: Hooks) {
    this._hooks.push(hooks)

    return () => {
      this._hooks.splice(this._hooks.indexOf(hooks), 1)
    }
  }

  get hooks() {
    return this._hooks
    //return this._hooks.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  }

  _sort_hooks() {
    this._hooks.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  }

  _on_hover(e: EventPosition) {
    let hooks = this.hooks

    let j = hooks.findIndex(_ => _.on_hover?.(e))
    if (j !== -1) {
      for (let i = j + 1; i < this.hooks.length; i++) {
        hooks[i].on_hover_clear?.()
      }
    }
  }
  _on_up(e: EventPosition, right: boolean, m?: EventPosition) {
    this.hooks.find(_ => _.on_up?.(e, right, m))
  }
  _on_click(e: EventPosition, right: boolean) {
    this.hooks.find(_ => _.on_click?.(e, right))
  }
  _on_click_begin(e: EventPosition, right: boolean) {
    this.hooks.find(_ => _.on_click_begin?.(e, right))
  }
  _on_drag(d: DragEvent, d0?: DragEvent) {
    this.hooks.find(_ => _.on_drag?.(d, d0))
  }
  _on_context() {
    this.hooks.find(_ => _.on_context?.())
  }
  _on_wheel(d: number, e: EventPosition) {
    this.hooks.find(_ => _.on_wheel?.(d, e))
  }


  listen(element: HTMLElement) {

    let _element_rect: ClientRect

    const _on_scroll = () => {
      _element_rect = element.getBoundingClientRect()
    }

    _on_scroll()

    const map_e = (e: EventPosition) => {

      let orig = Vec2.make(_element_rect.x, _element_rect.y)
      let size = Vec2.make(_element_rect.width, _element_rect.height)


      return e.sub(orig).div(size)
    }

    let clone_drag = (_: DragEvent | undefined) => {
      return _ && { ..._ }
    }

    let _drag: DragEvent | undefined,
    _drag0: DragEvent | undefined,
    _m: EventPosition | undefined

    let self = this

    Mouse.init({
      _onDragStart(_e, _right) {
        if (_right) {
          return
        }

        let e = map_e(_e)

        _drag0 = clone_drag(_drag)
        _drag = { e, _right }

        self._on_update = () => {
          if (_drag) {
            if (_drag.m || (_m && _drag.e.distance(_m) > 16/1080)) { _drag.m = _m }
            self._on_drag(_drag, _drag0)
            _drag0 = clone_drag(_drag)
          } else {
            self._on_update = undefined
          }
        }

        self._on_click_begin(e, _right)
      },
      _onDragMove(_e) {
        let e = map_e(_e)
        _m = e
        if (!_drag) {
          self._on_hover(e)
        }
      },
      _onDragEnd() {
        if (!_drag) {
          return
        }
        if (!_drag.m) {
          self._on_click(_drag.e, _drag._right)
        }
        self._on_up(_drag.e, _drag._right, _drag.m)
        self._on_update = undefined
        _drag = undefined
        _m = undefined
      },
      _onWheel(d: number, e: Vec2) {
        self._on_wheel?.(d, map_e(e))
      },
      _onContextMenu() {
      }
    }, element)


    document.addEventListener('scroll', () => { _on_scroll() }, { capture: true, passive: true })

    window.addEventListener('resize', () => { _on_scroll() }, { passive: true })

  }

  update() {
    this._on_update?.()
  }

}


export default new Input()
