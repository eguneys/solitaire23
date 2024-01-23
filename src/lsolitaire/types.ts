export let n_seven = [1, 2, 3, 4, 5, 6, 7]
export let n_four = [1, 2, 3, 4]

export const suits = ['d', 'c', 'h', 's']
export const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']

export const ranks_ace_through_king = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K']

export type Suit = typeof suits[number]
export type Rank = typeof ranks[number]

export type Card = `${Suit}${Rank}`


export const cards = suits.flatMap(suit => ranks.map(rank => `${suit}${rank}`))


export const card_sort_key = (card: Card) => {
  let i_suit = suits.indexOf(card[0])
  let i_rank = ranks.indexOf(card[1])
  return i_suit * 100 + i_rank
}

export type CardColor = 'red' | 'black'

export function card_color(card: Card) {
  switch (card[0]) {
    case 'd': case 'h': return 'red'
    default: return 'black'
  }
}

export function is_descending(a: Card, b: Card) {
  return ranks_ace_through_king[ranks_ace_through_king.indexOf(b[1]) - 1] === a[1]
}

export function is_red_black(a: Card, b: Card) {
  return card_color(a) != card_color(b)
}

export function is_king(a: Card) {
  return a[1] === 'K'
}

export function is_ace(a: Card) {
  return a[1] === 'A'
}



export class Cards {
  static get deck() { return cards.slice(0) }
}

function card_stack_from_fen(fen: string) {
  let res = []

  for (let i = 0; i < fen.length; i+=2) {
    res.push(`${fen[i]}${fen[i+1]}`)
  }

  return res
}

export class Stack {

  static get empty() { return new Stack([]) }

  static take_n = (cards: Array<Card>, n: number) => new Stack(cards.splice(0, n))

  static from_fen = (fen: string) => new Stack(card_stack_from_fen(fen))

  get clone() {
    return new Stack(this.cards.slice(0))
  }

  get fen() {
    return this.cards.join('')
  }

  get length() {
    return this.cards.length
  }

  get top_card() {
    return this.cards[this.cards.length - 1]
  }

  constructor(readonly cards: Array<Card>) {}

  add_cards(cards: Array<Card>) {
    this.cards.push(...cards)
  }

  shift_cards(length: number) {
    return this.cards.splice(0, length)
  }

  unshift_cards(cards: Array<Card>) {
    for (let i = cards.length - 1; i >= 0; i--) {
      this.cards.unshift(cards[i])
    }
  }
  remove_cards(n: number) {
    return this.cards.splice(-n)
  }

  remove_all() {
    return this.remove_cards(this.cards.length)
  }

}