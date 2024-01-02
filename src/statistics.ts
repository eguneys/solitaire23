import { Settings, TurningCards, TurningLimit } from 'lsolitaire'

const Solitaire_Multipliers = {
    'threecards': 1,
    'onecard': 1.5,
    'nolimit': 1,
    'threepass': 1.5,
    'onepass': 2.2
}

export class SpiderGameResult implements AGameResult {

    get multiplied_score() {
        return this.score
    }

    constructor(readonly win: boolean, readonly score: number) {}

    get fen() {
        return ''
    }

}

export class FreecellGameResult implements AGameResult {

    get multiplied_score() {
        return this.score
    }

    constructor(readonly win: boolean, readonly score: number) {}

    get fen() {
        return ''
    }

}

export class SolitaireGameResult implements AGameResult {

    get turning_cards_multiplier() {
        return Solitaire_Multipliers[this.turning_cards]
    }

    get turning_limit_multiplier() {
        return Solitaire_Multipliers[this.turning_limit]
    }

    get multiplied_score() {
        return this.score * (this.turning_cards_multiplier + this.turning_limit_multiplier)
    }

    get fen() {
        return [this.win, this.score, this.turning_cards, this.turning_limit].join('/')
    }

    static from_fen = (fen: string) => {
        let [win, score, turning_cards, turning_limit] = fen.split('/')
        return new SolitaireGameResult(win === 'true', 
        parseInt(score), 
        turning_cards as TurningCards, turning_limit as TurningLimit)
    }

    static from_win = (settings: Settings, score: number) => {
        return new SolitaireGameResult(true, score, settings.cards, settings.limit)
    }

    static from_loss = (settings: Settings, score: number) => {
        return new SolitaireGameResult(false, score, settings.cards, settings.limit)
    }



    constructor(
        readonly win: boolean,
        readonly score: number,
        readonly turning_cards: TurningCards,
        readonly turning_limit: TurningLimit
        ) {}
}

interface AGameResult {
    win: boolean,
    multiplied_score: number,
    fen: string
}

export class GameResults<A extends AGameResult> {

    get fen() {
        return this.list.map(_ => _.fen).join('$')
    }

    static from_fen = <A extends AGameResult>(fen: string, from_fen: (_: string) => A) => {
        return new GameResults<A>(fen==='' ? []:fen.split('$').map(_ => from_fen(_)))
    }

    constructor(readonly list: A[]) {}

    push(_: A) {
        this.list.push(_)
    }

    clear() {
        this.list.length = 0
    }

    get total_wins() {
        return  this.list.filter(_ => _.win).length
    }

    get total_played() {
        return this.list.length
    }

    get top_5_highscores() {
        return this.list
        .sort((a, b) => b.multiplied_score - a.multiplied_score)
        .slice(0, 5)
    }
}

export class OverallResults {

    constructor(
        readonly solitaire: GameResults<SolitaireGameResult>,
        readonly freecell: GameResults<FreecellGameResult>,
        readonly spider: GameResults<SpiderGameResult>
    ) {}


    get total_wins() {
        return this.freecell_total_wins + this.spider_total_wins + this.solitaire_total_wins
    }

    get total_played() {
        return this.freecell_total_played + this.spider_total_played + this.solitaire_total_played
    }

    get top_5_highscores() {
        return [
            ...this.freecell_top_5_highscores,
            ...this.spider_top_5_highscores,
            ...this.solitaire_top_5_highscores,
        ]
        .sort((a, b) => b.multiplied_score - a.multiplied_score)
        .slice(0, 5)
    }

    get freecell_total_wins() {
        return  this.freecell.total_wins
    }

    get freecell_total_played() {
        return this.freecell.total_played
    }

    get freecell_top_5_highscores() {
        return this.freecell.top_5_highscores
    }



    get spider_total_wins() {
        return  this.spider.total_wins
    }

    get spider_total_played() {
        return this.spider.total_played
    }

    get spider_top_5_highscores() {
        return this.spider.top_5_highscores
    }



    get solitaire_total_wins() {
        return  this.solitaire.total_wins
    }

    get solitaire_total_played() {
        return this.solitaire.total_played
    }

    get solitaire_top_5_highscores() {
        return this.solitaire.top_5_highscores
    }

}