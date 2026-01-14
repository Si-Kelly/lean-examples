import BaseComponent from "../core/base-component.js";
import Icons from "../core/icons.js";
import IconComponent from "../shared/icon-component.js";

const X = "X";
const O = "O";

export default class TicTacToe extends BaseComponent {
    static observedAttributes = [];

    constructor() {
        super(/*html*/`
            <style>
            .tic-tac-toe-container{
                width:fit-content;
                display:flex;
                flex-direction:column;
                gap:0.5em;
            }
            .gameboard {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.5em;
                width: 20em;
            }
            .gameboard button{
                height: 3em;
                font-size: 2em;
            }
            .gameboard button.winner{
                background-color:#008000;
            }
            .statusbar{
                display:flex;
                justify-content: space-between;
                gap:0.5em;
            }
            .statusbar button{
                font-size: 0.9em;
            }
            </style>
            <div class="tic-tac-toe-container">
                <div class="gameboard" data-name="gameboardEl">
                    <template data-name="cellTemplate">
                        <button>
                        <five-icon></five-icon>
                        </button>
                    </template>
                </div>
                <div class="statusbar">
                    <div data-name="statusMessage"></div>
                    <button data-name="playAgainButton">
                       <five-icon key="playAgain"></five-icon>
                       <span>Play again</span> 
                    </button>
                    <button data-name="playForMeButton" class="autoplay">
                        <five-icon key="automatic"></five-icon>
                        <span data-name="playForMeButtonLabel"></span>
                    </button>
                </div>
            </div>
        `);
    }
    connectedCallback() {
        this.playForMeButton.onclick = () => {
            this.takeTurn(this.calcNextMove());
            this.updateUI();
        }
        this.playAgainButton.onclick = () => {
            this.reset();
        };

        this.createGameboard();
        this.gameboard.forEach((value, index) => {
            const cellEl = this.cellTemplate.clone();
            this.gameboardEl.append(cellEl);
        });
        this.reset();
    }
    updateUI() {
        this.statusMessage.innerText = this.noWinner ? 'No winner' : this.winner ? `${this.winner} wins!` : this.turn === X ? "X's turn" : "O's turn";
        const cellEls = [...this.gameboardEl.querySelectorAll('button')];
        this.gameboard.forEach((value, index) => {
            const cellEl = cellEls[index];
            cellEl.querySelector('five-icon').setIcon(value == X ? Icons.cross : value == O ? Icons.naught : undefined);
            cellEl.onclick = !this.noWinner && !this.winningCombination && !value ? () => this.takeTurn(index) : undefined;
            cellEl.disabled = value != null;
            cellEl.classList.toggle('winner', this.winningCombination != null && this.winningCombination.includes(index));
        });
        this.playAgainButton.style.display = this.noWinner || this.winningCombination ? 'block' : 'none';
        this.playForMeButton.style.display = !this.noWinner && !this.winningCombination ? 'block' : 'none';
        this.playForMeButtonLabel.innerText = this.turn === X ? "Play for X" : "Play for O";
    }
    checkWinner(gameboard, turn) {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        return winningCombinations.find(combination => combination.every(index => gameboard[index] === turn));
    }
    checkNoWinner() {
        return this.gameboard.every(cell => cell != null);
    }

    takeTurn(index) {
        if (this.gameboard[index] != null) return;
        this.gameboard[index] = this.turn;
        this.winningCombination = this.checkWinner(this.gameboard, this.turn);

        if (this.winningCombination) {
            this.winner = this.turn;
        } else if (this.checkNoWinner()) {
            this.noWinner = true;
        } else {
            this.turn = this.turn == X ? O : X;
            this.updateUI();
        }
        this.updateUI();

    }
    calcNextMove() {
        let moves = [];
        this.gameboard.forEach((val, index) => {
            if (val == null) {
                moves.push(index);
            }
        });
        if (moves.length == 0) return;
        //check if there is a winning move for this player
        let winningMove = moves.find(move => {
            const tempGameboard = [...this.gameboard];
            tempGameboard[move] = this.turn;
            return this.checkWinner(tempGameboard, this.turn) != undefined;
        });
        if (winningMove) {
            return winningMove;
        }
        // Check if the opponent can win in the next move
        const opponentTurn = this.turn === X ? O : X;
        let opponentWinningMove = moves.find(move => {
            const tempGameboard = [...this.gameboard];
            tempGameboard[move] = opponentTurn;
            return this.checkWinner(tempGameboard, opponentTurn) != undefined;
        });
        if (opponentWinningMove) {
            return opponentWinningMove;
        }
        // If no winning move for the opponent, return a random move
        return moves[Math.floor(Math.random() * moves.length)];
    }
    createGameboard() {
        this.gameboard = new Array(9).fill(null);
    }

    reset() {
        this.createGameboard();
        this.turn = X;
        this.winner = null;
        this.winningCombination = null;
        this.noWinner = false;
        this.updateUI();
    }

}
customElements.define('tic-tac-toe', TicTacToe);

