export function rmap(t: number, min: number, max: number) {
  return min + (max - min) * t
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function appr(value: number, target: number, dt: number)  {
  if (value < target) {
    return Math.min(value + dt, target)
  }else {
    return Math.max(value - dt, target)
  }
}

export function ease(t: number) {
  return t<.5 ? 2*t*t : -1+(4-2*t)*t
}


export function ease_quad(t: number) {
  return t * t
}
