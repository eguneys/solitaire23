# Solitaire, Freecell, Spider

## Navigation

- Side navigation
  - Back
  - Content
    - Main menu
      - Horizontal Layout
        - Solitaire
        - Freecell
        - Spider
      - Text Buttons
        - How to play
        - Stats
        - Settings
        - About
    - How to play
      - Tabbed Content
        - Tab Spider
        - Tab Solitaire
        - Tab Freecel
        - Tab Panel
          - Scrollable View
    - Stats
      - Vertical Layout
        - Solitaire nb games played
        - Freecell nb games played
        - Spider nb games played
      - Tabbed Content
        - Tab Last activity
          - Scrollable View
        - Tab Nb games played
          - Scrollable View
            - Tabbed Content
              - Tab all
              - Tab game over
              - Tab game completed
              - Tab incomplete
              - Tab Panel
                - Game Mini view
       - Game Mini View
         - Game Name
         - Date
         - Score
         - Status
         - Mini game view
    - Settings
      - Scrollable View
        - Dropdown Selection
        - Toggle Selection
    - About
      - Scrollable View
        - External Links
          - External link icon
    - Solitaire
      - Game area
      - New game
      - Settings
    - Freecel
      - Game area
      - New game
      - Settings
    - Spider
      - Game area
      - New game
      - Settings
   - Dialogs
     - New game prompt
     - End game 

## Dialogs

- New game prompt

Current game will be archived.
Do you want to start a new game?
- Yes, No

- End game

Game over nickname. No moves available.
Good game nickname. You completed this level.
You scored 62. New highscore.
- New game, View Stats, Main menu

## Stats

- Solitaire nb games played
- Freecell nb games played
- Spider nb games played
- Last activity
  - Today
    - 3 times played solitaire
  - Yesterday
    - 2 times played freecel
- Nb games played
  - All
  - Game over
  - Game completed
  - Incomplete

- Game box
  - Spider, Solitaire, Freecel
  - 1 months ago
  - Score
  - Game status
  - Mini game area


## Main menu

Game selection
Settings
About

## Settings

Color theme
- Pink
- Blue
- Orange
- Black

Sounds
- On
- Off

Language
- English
- French
- Italian
- German

## About

A hobby project, created in 2023 by [eguneys](https://eguneys.github.io).

A fun way to pass time with 3 solitaire games. [Solitaire](), [Freecell](), and [Spider]().

- This project is free and open source at [Github](https://github.com/eguneys/solitaire23)
- Other games will be linked here when available.

- Consider donating at [Patreon](https://www.patreon.com/eguneys).

- For business inquiries please contact me on twitter @eguneys.

## Solitaire

Solitaire is played with a standard 52-card deck.
A tableu of 7 piles of cards are laid, first pile contains 1 card, second pile contains 2 cards and so on. The topmost card of each pile is turned face up, the cards behind are turned face down.
The remaining cards form the stock and are placed facedown at the upper left.

The four foundations are built up by suit from Ace to King.
The tableu piles can be built down by alternate colors.
Every face-up card in a partial pile, or a complete pile, can be moved, as a unit, to another tableu pile on the basis of its highest card.
Any empty piles can be filled with a King, or a pile of cards with a King.

The aim of the game is to build up four stacks of cards from Ace to King for each suit, on one of the four foundations.

There are different ways of dealing the stock cards to the waste depending on these two settings.

Turning cards
- Three cards: Turning three cards at once to the waste
- One card: Turning one card at once to the waste

Turning limit
- No limit: no limit on passes through the deck.
- 3 passes: 3 passes through the deck.
- 1 pass: 1 pass through the deck.


- If all face up cards in a tableu is moved, the topmost back facing card is turned over.
- Cards in waste can be moved to a tableu or a foundation.
- The topmost card in a foundation can be moved back to a tableu. 
- If the stock is empty and there are cards in the waste, waste cards can be recycled back to stock if pass through the deck is allowed according to turning limit.
- Moves can be undo with the undo button.


The scoring system is:

- waste to tableu:       5 points
- waste to foundation:   10 points
- tableu to foundation:  10 points
- turn over tableu card: 5 points
- foundation to tableu: -15 points
- recycle waste:        -70 points
- undo a move:          -30 points

## Freecell
## Spider
