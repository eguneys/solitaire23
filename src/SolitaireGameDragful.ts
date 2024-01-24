import { Vec2 } from "blah";
import { Settings, IMove } from "./lsolitaire/solitaire";
import { Cards } from "./lsolitaire/types";
import { Play } from "./play";
import { back } from "./solitaire_game_dragful";


export class SolitaireGameDragful extends Play {
  init_and_set_callbacks(
    on_score: (_: number) => void,
    on_new_game: (_: Settings) => void,
    on_game_over: (_: Settings, score: number) => void,
    on_init: (settings: Settings) => void) {
    this._on_score = on_score;
    this._on_new_game = on_new_game;
    this._on_game_over = on_game_over;
    this._on_init = on_init;

    this.collect_pov();
    this._on_init(this.settings);

  }


  cmd(cmd: IMove) {
    if (cmd.can(back)) {
      cmd.apply(back);
      this.apply(cmd);


      this._on_score(back.score);

      if (back.is_finished) {
        this._on_game_over(back.settings, back.score);
      }

    } else {
      this.cant(cmd);
    }
  }

  cmd_undo() {
    let res = back.undo();
    if (res) {
      this.undo(res);

      this._on_score(back.score);
    } else {
      this.cant_undo();
    }
  }

  cant_undo() {
    throw new Error("Method not implemented.");
  }
  undo(cmd: IMove) {
    throw new Error("Method not implemented.");
  }
  apply(cmd: IMove) {
    throw new Error("Method not implemented.");
  }
  cant(cmd: IMove) {
    throw new Error("Method not implemented.");
  }

  get settings() {
    return back.settings;
  }

  _on_score!: (_: number) => void;
  _on_new_game!: (_: Settings) => void;
  _on_game_over!: (_: Settings, score: number) => void;
  _on_init!: (_: Settings) => void;

  collect_pov() {
  }
  request_new_game() {
    throw new Error('Method not implemented.');
  }
  request_undo() {
    throw new Error('Method not implemented.');
  }

  cards!: Cards;

  _init() {
    this.cards = this.make(Cards, Vec2.zero, {});
  }

}
