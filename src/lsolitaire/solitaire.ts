import { is_king, is_descending, is_red_black, is_ace, ranks_ace_through_king } from './types'
import { n_seven, Card,  Stack, suits, Cards } from './types'

export type TurningCards = 'threecards' | 'onecard'
export type TurningLimit = 'nolimit' | 'onepass' | 'threepass'

export type Settings = {
    cards: TurningCards,
    limit: TurningLimit
}

export class Stats {

    static empty() {
        return new Stats(0)
    }

    constructor(public score: number) {

    }

}

export class Tableu {

    can_drag(i: number) {
        let front = this.front.clone

        let cards = front.remove_cards(i)
        if (cards.length === i) {
            return cards
        }
        return undefined
    }

    can_drop(cards: Card[]) {
        let top = cards[0]

        if (!top) {
            return false
        }

        if (this.front.length > 0) {
            return is_red_black(top, this.front.top_card) && is_descending(top, this.front.top_card)
        } else {
            return is_king(top)
        }
    }

    constructor(readonly back: Stack, readonly front: Stack) {}

    undo_from_tableu(res: [Card[], string | undefined]) {
        if (res[1]) {
            let flip = this.front.remove_cards(1)
            this.back.add_cards(flip)
        }
        this.front.add_cards(res[0])
    }
    undo_to_tableu(cards: Card[]) {
        this.front.remove_cards(cards.length)
    }
    to_tableu(cards: Card[]) {
        this.front.add_cards(cards)
    }

    from_tableu(i: number): [Card[], Card | undefined] {
        let cards = this.front.remove_cards(i)
        if (this.front.length === 0) {
            let [flip] = this.back.remove_cards(1)
            if (flip) {
                this.front.add_cards([flip])
                return [cards, flip]
            }
        }
        return [cards, undefined]
    }

    static make(deck: string[], i: number): any {
        return new Tableu(Stack.take_n(deck, i), Stack.take_n(deck, 1))
    }

}

export class Foundation {

    get suit() {
        return this.foundation.top_card?.[0]
    }

    get next_top() {
        if (!this.suit) {
            return undefined
        }
        let suit = this.suit
        let rank = ranks_ace_through_king[this.foundation.length]
        return `${suit}${rank}`
    }


    can_drop(cards: Card[]) {
        let [top] = cards
        return cards.length === 1 &&
            (this.next_top ? top === this.next_top : is_ace(top))
    }

    can_drag() {
        return this.foundation.top_card
    }

    get is_finished() {
        return this.foundation.length === 13
    }

    undo_from_foundation(cards: Card[]) {
        this.foundation.add_cards(cards)
    }
    undo_to_foundation(cards: Card[]) {
        this.foundation.remove_cards(cards.length)
    }
    from_foundation() {
        return this.foundation.remove_cards(1)
    }
    to_foundation(cards: Card[]) {
        this.foundation.add_cards(cards)
    }

    static make(): any {
        return new Foundation(Stack.empty)
    }

    constructor(readonly foundation: Stack) {}

}

export class Stock {

    can_drag() {
        return this.waste.top_card
    }

    can_recycle() {
        return this.stock.length === 0 && (this.waste.length + this.hidden.length) > 0
    }

    can_hit_stock() {
        return this.stock.length > 0
    }

    hit(n: number): [Card[], Card[]] {
        let cards = this.stock.remove_cards(n)
        let waste = this.waste.remove_all()

        this.hidden.unshift_cards(waste)
        this.waste.add_cards(cards)

        return [waste, cards]
    }
    
    undo_hit(hit_data: [Card[], Card[]]) {
        let [waste, cards] = hit_data
        let waste_to_stock = this.waste.remove_cards(cards.length)
        let hidden_to_waste = this.hidden.shift_cards(waste.length)

        this.waste.add_cards(hidden_to_waste)
        this.stock.add_cards(waste_to_stock)
    }
    recycle() {
        let waste = this.waste.remove_all()
        this.hidden.unshift_cards(waste)
        this.stock.add_cards(this.hidden.remove_all())

        return waste
    }
    undo_recycle(waste: Card[]) {
        this.hidden.add_cards(this.stock.remove_all())

        let hidden_to_waste = this.hidden.shift_cards(waste.length)
        this.waste.add_cards(hidden_to_waste)
    }
    undo_from_waste(cards: Card[]) {
        this.waste.add_cards(cards)
    }
    from_waste() {
        return this.waste.remove_cards(1)
    }
    static make(deck: string[]) {
        return new Stock(Stack.take_n(deck, deck.length), Stack.empty, Stack.empty)
    }

    constructor(readonly stock: Stack, readonly waste: Stack, readonly hidden: Stack) {}

}

export interface IMove {
    can(solitaire: Solitaire): boolean
    apply(solitaire: Solitaire): void
    undo(solitaire: Solitaire): void
}

export class TableuToTableu implements IMove {

    can(solitaire: Solitaire): boolean {
        return solitaire.can_tableu_to_tableu(this.from, this.to, this.i)
    }



    cards!: Card[]
    flip?: Card

    constructor(readonly from: number, readonly to: number, readonly i: number) {}

    apply(solitaire: Solitaire): void {
        let [cards, flip] = solitaire.tableu_to_tableu(this.from, this.to, this.i)
        this.cards = cards
        this.flip = flip
    }
    undo(solitaire: Solitaire): void {
        solitaire.undo_tableu_to_tableu(this.from, this.to, this.i, [this.cards, this.flip])
    }
}

export class TableuToFoundation implements IMove {

    static auto_can(back: Solitaire, tableu: number) {

        for (let to = 0; to < 4; to++) {
            if (TableuToFoundation.can(back, tableu, to)) {
                return [tableu, to]
            }
        }
        return undefined
    }

    static can(back: Solitaire, from: number, to: number) {
        return back.can_tableu_to_foundation(from, to, 1)
    }



    can(solitaire: Solitaire): boolean {
        return solitaire.can_tableu_to_foundation(this.from, this.to, this.i)
    }



    cards!: Card[]
    flip?: Card

    constructor(readonly from: number, readonly to: number, readonly i: number) {}

    apply(solitaire: Solitaire): void {
        let [cards, flip] = solitaire.tableu_to_foundation(this.from, this.to, this.i)
        this.cards = cards
        this.flip = flip
    }
    undo(solitaire: Solitaire): void {
        solitaire.undo_tableu_to_foundation(this.from, this.to, this.i, [this.cards, this.flip])
    }
}


export class WasteToTableu implements IMove {

    can(solitaire: Solitaire): boolean {
        return solitaire.can_waste_to_tableu(this.to)
    }



    card!: Card

    constructor(readonly to: number) {}

    apply(solitaire: Solitaire): void {
        this.card = solitaire.waste_to_tableu(this.to)[0]
    }
    undo(solitaire: Solitaire): void {
        solitaire.undo_waste_to_tableu(this.to, [this.card])
    }
}


export class WasteToFoundation implements IMove {

    static auto_can(back: Solitaire) {
        for (let to = 0; to < 4; to++) {
            if (WasteToFoundation.can(back, to)) {
                return to
            }
        }
        return undefined
    }

    static can(back: Solitaire, to: number) {
        return back.can_waste_to_foundation(to)
    }

    can(solitaire: Solitaire): boolean {
        return solitaire.can_waste_to_foundation(this.to)
    }



    card!: Card

    constructor(readonly to: number) {}

    apply(solitaire: Solitaire): void {
        this.card = solitaire.waste_to_foundation(this.to)[0]
    }
    undo(solitaire: Solitaire): void {
        solitaire.undo_waste_to_foundation(this.to, [this.card])
    }
}

export class FoundationToTableu implements IMove {

    can(solitaire: Solitaire): boolean {
        return solitaire.can_foundation_to_tableu(this.from, this.to)
    }



    card!: Card

    constructor(readonly from: number, readonly to: number) {}

    apply(solitaire: Solitaire): void {
        this.card = solitaire.foundation_to_tableu(this.from, this.to)[0]
    }
    undo(solitaire: Solitaire): void {
        solitaire.undo_foundation_to_tableu(this.from, this.to, [this.card])
    }
}


export class HitStock implements IMove {

    can(solitaire: Solitaire): boolean {
        return solitaire.can_hit_stock()
    }



    hit_data!: [Card[], Card[]]

    apply(solitaire: Solitaire): void {
        this.hit_data = solitaire.hit_stock()
    }
    undo(solitaire: Solitaire): void {
        solitaire.undo_hit_stock(this.hit_data)
    }
}

export class HitRecycle implements IMove {

    can(solitaire: Solitaire): boolean {
        return solitaire.can_hit_recycle()
    }

    data!: Card[]

    apply(solitaire: Solitaire): void {
        this.data = solitaire.hit_recycle()
    }
    undo(solitaire: Solitaire): void {
        solitaire.undo_hit_recycle(this.data)
    }
}


export class Solitaire {
    

    get is_finished() {
        return this.foundations.every(_ => _.is_finished)
    }



    get score() {
        return this.stats.score
    }

    static make = (settings: Settings, deck: Array<Card>) => {

        let foundations = suits.map(suit => Foundation.make())
        let tableus = n_seven.map(i => Tableu.make(deck, i - 1))
        let stock = Stock.make(deck)
        let nb_recycles = 0

        let moves: IMove[] = []
        let stats = Stats.empty()

        return new Solitaire(
            nb_recycles,
            moves,
            stats,
            settings,
            tableus,
            foundations,
            stock
        )

    }


    get hit_n() {
        return this.settings.cards === 'threecards' ? 3 : 1 
    }

    constructor(
        public nb_recycles: number, 
        readonly moves: IMove[],
        readonly stats: Stats,
        readonly settings: Settings,
        readonly tableus: Tableu[],
        readonly foundations: Foundation[],
        readonly stock: Stock) {}

    apply(cmd: IMove) {
        cmd.apply(this)
        this.moves.push(cmd)
    }

    undo() {
        let move = this.moves.pop()
        if (move) {
            move.undo(this)
            return move
        }
        return undefined
    }

    tableu_to_tableu(from: number, to: number, i: number): [Card[], Card | undefined] {

        let [cards, flip] = this.tableus[from].from_tableu(i)
        this.tableus[to].to_tableu(cards)

        return [cards, flip]
    }

    tableu_to_foundation(from: number, to: number, i: number): [Card[], Card | undefined] {

        let [cards, flip] = this.tableus[from].from_tableu(i)
        this.foundations[to].to_foundation(cards)

        return [cards, flip]
    }

    waste_to_tableu(to: number) {
        let cards = this.stock.from_waste()
        this.tableus[to].to_tableu(cards)

        return cards
    }


    waste_to_foundation(to: number) {
        let cards = this.stock.from_waste()
        this.foundations[to].to_foundation(cards)

        return cards
    }

    foundation_to_tableu(from: number, to: number) {
        let cards = this.foundations[from].from_foundation()
        this.tableus[to].to_tableu(cards)
        return cards
    }




    undo_tableu_to_tableu(from: number, to: number, i: number, res: [Card[], Card | undefined]) {
        this.tableus[to].undo_to_tableu(res[0])
        this.tableus[from].undo_from_tableu(res)
    }

    undo_tableu_to_foundation(from: number, to: number, i: number, res: [Card[], Card | undefined]) {
        this.foundations[to].undo_to_foundation(res[0])
        this.tableus[from].undo_from_tableu(res)
    }

    undo_waste_to_tableu(to: number, cards: Card[]) {

        this.tableus[to].undo_to_tableu(cards)
        this.stock.undo_from_waste(cards)
    }

    undo_waste_to_foundation(to: number, cards: Card[]) {
        this.foundations[to].undo_to_foundation(cards)
        this.stock.undo_from_waste(cards)
    }

    undo_foundation_to_tableu(from: number, to: number, cards: Card[]) {
        this.tableus[to].undo_to_tableu(cards)
        this.foundations[from].undo_from_foundation(cards)
    }

    hit_stock() {
        let cards = this.stock.hit(this.hit_n)

        return cards
    }

    hit_recycle() {
        this.nb_recycles+= 1

        return this.stock.recycle()
    }


    undo_hit_stock(hit_data: [Card[], Card[]]) {
        this.stock.undo_hit(hit_data)
    }

    undo_hit_recycle(cards: Card[]) {
        this.nb_recycles -= 1
        this.stock.undo_recycle(cards)
    }

    can_tableu_to_tableu(from: number, to: number, i: number) {
        let c = this.tableus[from].can_drag(i)
        return c !== undefined && this.tableus[to].can_drop(c)
    }

    can_tableu_to_foundation(from: number, to: number, i: number) {
        let cs = this.tableus[from].can_drag(i)
        return cs !== undefined && cs.length === 1 && this.foundations[to].can_drop(cs)
    }

    can_waste_to_tableu(to: number) {
        let c = this.stock.can_drag()
        return c !== undefined && this.tableus[to].can_drop([c])
    }

    can_waste_to_foundation(to: number) {
        let c = this.stock.can_drag()
        return c !== undefined && this.foundations[to].can_drop([c])
    }

    can_foundation_to_tableu(from: number, to: number) {
        let c = this.foundations[from].can_drag()
        return c !== undefined && this.tableus[to].can_drop([c])
    }

    can_hit_stock() {
        return this.stock.can_hit_stock()
    }

    can_hit_recycle() {
        return this.has_recycle_limit && this.stock.can_recycle()
    }

    get recycle_n() {
        return this.settings.limit === 'nolimit' ? 999 : this.settings.limit === 'threepass' ? 3 : 1
    }

    get has_recycle_limit() {
        return this.recycle_n - this.nb_recycles > 0
    }
}