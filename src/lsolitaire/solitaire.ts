export class Stats {

}
export class Settings {

}

export class Tableu {

}

export class Foundation {

}


export class Stock {

}

interface IMove {
    undo(solitaire: Solitaire): void
}

export class Solitaire {

    constructor(
        readonly moves: IMove[],
        readonly stats: Stats,
        readonly settings: Settings,
        readonly tableus: Tableu[],
        readonly foundations: Foundation[],
        readonly stock: Stock) {}
}