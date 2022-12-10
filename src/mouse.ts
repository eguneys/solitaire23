import { Vec2 } from 'blah'

export type MouseHooks = {
  _onDragStart?: (v: Vec2, right: boolean) => void, 
  _onDragMove?: (v: Vec2) => void, 
  _onDragEnd?: (v: Vec2) => void,
  _onContextMenu?: () => void,
  _onWheel?: (_: number, v: Vec2) => void
}

export type MouchEvent = MouseEvent | TouchEvent

export function eventPosition(e: MouchEvent): [number, number] | undefined {
  if ((e as MouseEvent).clientX !== undefined && (e as MouseEvent).clientY !== undefined) {
    return [(e as MouseEvent).clientX, (e as MouseEvent).clientY]
  }
  if ((e as TouchEvent).targetTouches?.[0]) {
    return [(e as TouchEvent).targetTouches[0].clientX, (e as TouchEvent).targetTouches[0].clientY]
  }
  return [0, 0]
}

export class Mouse {

  static init = (hs: MouseHooks, $_: (HTMLElement | Document) = document) => {

    const ep = (_: MouchEvent) => {
      let __ = eventPosition(_)
      if (__) {
        return Vec2.make(__[0], __[1])
      }
      return Vec2.zero
    }

    let { _onDragStart, _onDragMove, _onDragEnd, _onContextMenu, _onWheel } = hs

    const dragStart = (e: Event) => { 
      _onDragStart?.(ep(e as MouchEvent), (e as MouseEvent).buttons === 2 || (e as MouseEvent).button === 2) }
    const dragMove = (e: Event) => { _onDragMove?.(ep(e as MouchEvent)) }
    const dragEnd = (e: Event) => { _onDragEnd?.(ep(e as MouchEvent)) }
    const contextMenu = (e: Event) => { 
      if (_onContextMenu) {
        e.preventDefault() 
        _onContextMenu() 
      }
    }
    const onWheel = (e: Event) => { 
      if (_onWheel) {
        _onWheel(Math.sign((e as WheelEvent).deltaY), ep(e as MouchEvent)) 
        e.preventDefault()
      }
    }

    $_.addEventListener('wheel', onWheel, { passive: false })

    $_.addEventListener('touchstart', dragStart, { capture: true, passive: false }) 
    $_.addEventListener('mousedown', dragStart, { capture: true, passive: false }) 
    $_.addEventListener('contextmenu', contextMenu)

    document.addEventListener('mousemove', dragMove)
    document.addEventListener('mouseup', dragEnd)

    document.addEventListener('touchmove', dragMove)
    document.addEventListener('touchend', dragEnd)

    return () => {
      $_.removeEventListener('wheel', onWheel) 


      $_.removeEventListener('touchstart', dragStart)
      $_.removeEventListener('mousedown', dragStart)


      $_.removeEventListener('contextmenu', contextMenu)

      document.removeEventListener('mousemove', dragMove)
      document.removeEventListener('mouseup', dragEnd)

      document.removeEventListener('touchmove', dragMove)
      document.removeEventListener('touchend', dragEnd)
    }
  }
}
