import BaseComponent from "../core/base-component.js";
import Icons from "../core/icons.js";
import IconComponent from "../shared/icon-component.js";

const gridW = 9;
const gridH = 12;
const initialMines = 11;
const LOADING = -1, READY = 0, PLAYING = 1, WIN = 2, LOSE = 3, PAUSE = 4;
const timeFormatter = new Intl.NumberFormat('en-US', { minimumIntegerDigits: 2, useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default class Speedsweeper extends BaseComponent {
    static observedAttributes = [];
    cells = [];
    time;
    startTime;
    gamestate = LOADING;
    bestTime;
    constructor() {
        super(/*html*/`
            <style>
            .container {
                display: flex;
                flex-direction: column;
                gap: 0.5em;
                position: relative;
                width: fit-content;
                margin: auto;
            }
            .grid {
                display: grid;
                grid-template-columns: repeat(${gridW}, 2.5em);
                grid-template-rows: repeat(${gridH}, 3em);
                transition: opacity 0.5s;
            }
            .grid.fadeout {
                transition: opacity 0.5s;
                opacity: 0.1;
            }
            .grid.blackout {
                transition: opacity 0.5s;
                opacity: 0;
            }
            .grid button{
                font-size:1em;
                display:flex;
                justify-content:center;
                align-items:center;
                background-color:slategray;
            }
            .grid.grid.blackout button,
            .grid.grid.fadeout button{
                cursor:default;
            }
            .grid button:hover{
                background-color:#8d99b3;
            }
            button.cell.revealed{
                background-color:black;
            }
            .status {
                font-size:0.8em;
                font-weight:bold;
                font-family:'Courier New', Courier, monospace;
                display: flex;
                justify-content: space-between;
            }
            button.cell.exploded{
                background-color: red;
                color: yellow;
            }
            button.cell.flagged{
                color:red;
            }
            button.cell.hover{
                border-color: yellow;
                color: yellow;
            }
            
            button.cell.hover.hover-safe{
                border-color: lightgreen;
                color: lightgreen;
            }
            button.cell.hover.hover-not-safe, button.cell.hover.flagged{
                border-color: red;
                color:red;
            }
            button.cell.hover.revealed, button.cell.hover.flagged{
                border-color: white;
            }
            button.cell.hover.revealed:not(:hover){
                color: lightgray;
            }
            .banner{
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display:flex;
                flex-direction:column;
                gap:0.5em;
                align-items:center;
            }
            .banner-text{
                text-align:center;
            }
            .controls{
                display:flex;
                justify-content:space-between;
                gap:0.5em;
            }
            </style>
            <div class="container">
            <div class="status">
                <div>
                <five-icon key="mine"></five-icon>
                <span class="mine-count" data-name="mineCountEl"></span>
                </div>
                <div data-name="bestTimeEl"></div>
                <div>
                <five-icon key="clock"></five-icon>
                <span class="time" data-name="timeEl"></span>
                </div>
            </div>
            <div data-name="gridEl" class="grid"> </div>
            <template data-name="cellTemplate">
                <button class="cell">
                <span class="value"></span>
                <five-icon></five-icon>
                </button>
            </template>
            <div data-name="controlsEl" class="controls">
                <button data-name="pauseBtn">Pause</button>
                <button data-name="restartBtn">Reset</button>
            </div>
            <div class="banner" data-name="bannerEl">
                <div class="banner-text" data-name="messageEl"></div>
                <div><button data-name="bannerButton"></button></div>
            </div>
            </div>
        `);
    }
    connectedCallback() {
        super.connectedCallback();
        this.updateUI();
        window.requestAnimationFrame(() => {
            this.cells = new Array(gridW * gridH).fill(0).map(() => ({}));

            this.restartBtn.onclick = () => {
                window.clearTimeout(this.gameoverTimout);
                this.setUpGameGrid();
                this.updateUI();
            };
            this.pauseBtn.onclick = () => {
                this.pause();
            };
            this.cells.forEach(cell => {
                const cellEl = this.cellTemplate.clone();
                this.gridEl.appendChild(cellEl);
                cellEl.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                });
                cellEl.addEventListener('mouseup', (e) => {
                    if (this.gamestate != PLAYING)
                        return;
                    if (!cell.isRevealed) {
                        if (e.button == 2) {
                            this.flag(cell, !cell.isFlagged);
                            return;
                        }
                        const inHover = this.hoverCells && this.hoverCells.includes(cell);
                        if (inHover && this.hoverTarget.isNotSafe) {
                            this.flag(cell, true);
                            return;
                        } else {
                            this.playCell(cell);
                        }
                    } else if (cell == this.hoverTarget) {
                        if (cell.isSafe) {
                            this.hoverCells.forEach(c => this.playCell(c));
                        } else if (cell.isNotSafe) {
                            this.hoverCells.forEach(c => this.flag(c, true));
                        } else {
                            const unrevealed = this.hoverCells.filter(c => !c.isRevealed && !c.isFlagged);
                            if (unrevealed.length > 0)
                                this.playCell(unrevealed[Math.floor(Math.random() * unrevealed.length)]);
                        }
                    }
                    this.hoverCell(cell);
                });
            });
            this.setUpGameGrid();
            this.updateUI();
        });
    }
    updateUI() {
        const allCells = Array.from(this.gridEl.querySelectorAll('.cell'));
        this.cells.forEach((cell, i) => {
            const cellEl = allCells[i];
            cellEl.classList.toggle('revealed', cell.isRevealed);
            cellEl.classList.toggle('flagged', cell.isFlagged);
            cellEl.querySelector('five-icon').setIcon(cell.exploded ? Icons.explosion : cell.isFlagged ? Icons.flag : (cell.isRevealed || this.gamestate == WIN) && cell.isMine ? Icons.mine : null);
            cellEl.querySelector('.value').innerText = !cell.isMine && !cell.isFlagged && cell.isRevealed && cell.adjacentMines != undefined && cell.adjacentMines > 0 ? cell.adjacentMines : '';
            cellEl.classList.toggle('exploded', cell.exploded);
        });
        this.mineCountEl.innerText = this.cells.filter(cell => cell.isMine & !cell.exploded).length - this.cells.filter(cell => cell.isFlagged).length;
        this.bannerEl.style.display = this.gamestate != PLAYING ? '' : 'none';
        this.messageEl.innerText = this.gamestate == LOADING ? 'Loading' : this.gamestate == READY ? 'Get ready' : this.gamestate == WIN ? `${this.bestTime && this.time < this.bestTime ? 'New record!' : 'Well done!'} You've cleared the board in ${timeFormatter.format(this.time)} seconds` : this.gamestate == LOSE ? 'Game over' : this.gamestate == PAUSE ? 'Paused' : '';
        this.bannerButton.style.display = this.gamestate == LOADING ? 'none' : '';
        this.bannerButton.innerText = this.gamestate == READY ? 'Start' : this.gamestate == WIN || this.gamestate == LOSE ? 'Play again' : 'Resume';
        this.bannerButton.onclick = this.gamestate == READY ? () => this.start() : this.gamestate == WIN || this.gamestate == LOSE ? () => this.reset() : () => this.resume();
        this.pauseBtn.style.display = this.gamestate == PLAYING ? '' : 'none';
        this.gridEl.classList.toggle('fadeout', this.gamestate == LOSE || this.gamestate == WIN || this.gamestate == READY);
        this.gridEl.classList.toggle('blackout', this.gamestate == PAUSE);
        this.controlsEl.style.display = this.gamestate == PLAYING ? '' : 'none';
        this.bestTimeEl.innerText = this.bestTime ? `Best ${timeFormatter.format(this.bestTime)}` : '';
        this.bestTimeEl.style.display = this.bestTime != undefined ? '' : 'none';
        this.updateHoverUI();
        this.updateTimerUI();
    }
    updateTimerUI() {
        this.timeEl.innerText = timeFormatter.format(this.time);
    }
    updateHoverUI() {
        const allCellElements = Array.from(this.gridEl.querySelectorAll('.cell'));
        this.cells.forEach((cell, i) => {
            const node = allCellElements[i];
            const highlight = this.hoverCells != null && (this.hoverCells.includes(cell) || this.hoverTarget == cell);
            const unrevealed = highlight && !cell.isRevealed && !cell.isFlagged;
            node.classList.toggle('hover', highlight);
            node.classList.toggle('hover-safe', highlight && this.hoverTarget.isSafe);
            node.classList.toggle('hover-not-safe', highlight && this.hoverTarget.isNotSafe);
            node.querySelector('five-icon').setIcon(unrevealed && this.hoverTarget.isNotSafe ? Icons.mine :
                unrevealed && this.hoverTarget.isSafe ? Icons.tick : unrevealed ? Icons.question : cell.exploded ? Icons.explosion : cell.isFlagged ? Icons.flag : (cell.isRevealed || this.gamestate == WIN) && cell.isMine ? Icons.mine : null);
        });

    }
    hoverCell(cell) {
        this.cells.forEach(cell => {
            cell.isSafe = false;
            cell.isNotSafe = false;
        });
        this.hoverTarget = cell;
        if (cell != null && cell.adjacentMines > 0 && cell.isRevealed) {
            this.hoverCells = this.getAdjacentCells(cell);
            const unrevealed = this.hoverCells.filter(c => !c.isRevealed);
            cell.isNotSafe = unrevealed.length === cell.adjacentMines && cell.adjacentMines > unrevealed.filter(c => c.isFlagged).length;
            cell.isSafe = unrevealed.filter(c => c.isFlagged).length === cell.adjacentMines;
        } else {
            this.hoverCells = null;
            this.hoverTarget = null;
        }
        this.updateHoverUI();
    }
    setUpGameGrid() {
        let mines = initialMines;
        this.cells.forEach((cell, i) => {
            cell.exploded = false;
            cell.isRevealed = false;
            cell.isFlagged = false;
            cell.isMine = false;
            cell.adjacentMines = undefined;
            cell.x = i % gridW;
            cell.y = Math.floor(i / gridW);
        })
        while (mines > 0) {
            const i = Math.floor(Math.random() * this.cells.length);
            if (!this.cells[i].isMine) {
                this.cells[i].isMine = true;
                mines--;
            }
        }
        this.cells.forEach(cell => {
            cell.adjacentMines = this.getAdjacentCells(cell).filter(c => c.isMine).length;
        });
        this.hoverTarget = null;
        this.hoverCells = null;
        this.time = 0;
        this.gamestate = READY;
    }
    start() {
        this.gamestate = PLAYING;
        this.startTime = Date.now();
        this.timer = setInterval(() => {
            if (this.gamestate == PLAYING) {
                this.time += (Date.now() - this.startTime) / 1000;
                this.updateTimerUI();
                this.startTime = Date.now();
            }
        }, 100);
        this.updateUI();
    }
    pause() {
        this.gamestate = PAUSE;
        this.updateUI();
    }
    resume() {
        this.gamestate = PLAYING;
        this.startTime = Date.now();
        this.updateUI();
    }
    reset() {
        if (this.gamestate == WIN) {
            this.bestTime = Math.min(this.bestTime || Infinity, this.time);
        }
        this.setUpGameGrid();
        this.updateUI();
    }

    playCell(cell) {
        this.reveal(cell);
        this.updateUI();
    }

    reveal(cell) {
        if (!cell.isRevealed && !cell.isFlagged) {
            cell.isRevealed = true;
            if (cell.isMine) {
                this.explode(cell);
            } else {
                this.checkWin();
                if (cell.adjacentMines === 0) {
                    const cells = this.getAdjacentCells(cell);
                    cells.forEach(cell => {
                        if (!cell.isMine && !cell.isFlagged && !cell.isRevealed) {
                            this.reveal(cell);
                        }
                    });
                }
            }
        }
    }
    explode(cell) {
        this.gameover = true;
        cell.exploded = true;
        this.cells.forEach(cell => {
            cell.isRevealed = true;
            if (cell.isMine && !cell.isFlagged) {
                setTimeout(() => {
                    cell.exploded = true;
                    this.updateUI()
                }, 200 + Math.random() * 800);
            }
        });
        this.gameoverTimout = setTimeout(() => {
            this.loseGame();
        }, 2000);
        this.updateUI();
    }
    getAdjacentCells(cell) {
        const { x, y } = cell;
        const offset = [-1, 0, 1];
        const xy = offset.flatMap(dx => offset.map(dy => [x + dx, y + dy]));
        return xy.map(([x, y]) => this.cells[this.getIndex(x, y)]).filter(c => c);
    }
    getIndex(x, y) {
        if (x < 0 || x >= gridW || y < 0 || y >= gridH) {
            return null;
        }
        return y * gridW + x;
    }
    flag(cell, flag) {
        if (!cell.isRevealed) {
            cell.isFlagged = flag;
            this.updateUI();
        }
    }
    checkWin() {
        if (this.cells.every(cell => cell.isRevealed || cell.isMine)) {
            this.winGame();
        }
    }

    winGame() {
        this.gamestate = WIN;
        window.clearInterval(this.timer);
        this.updateUI();

    }
    loseGame() {
        this.gamestate = LOSE;
        window.clearInterval(this.timer);
        this.updateUI();
    }
    // Add additional methods here
}
customElements.define('speed-sweeper', Speedsweeper);