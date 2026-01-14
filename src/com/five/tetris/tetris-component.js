
import BaseComponent from '../core/base-component.js';

const
    READY = 'READY',
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
    GAMEOVER = 'GAMEOVER';

const scoreFormatter = Intl.NumberFormat([], { minimumIntegerDigits: 6, useGrouping: false });

export default class Tetris extends BaseComponent {
    matrix = [];
    shapes = [[[1, 1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 1], [1, 1, 0]], [[0, 1, 0], [1, 1, 1]], [[1, 1, 0], [0, 1, 1]]];
    gridWidth = 10;
    colors = ['#FFB6C1', '#90EE90', '#ADD8E6', '#FFD700', '#E6E6FA', '#FFA500', '#00CED1'];

    constructor() {
        super( /*html*/`
            <style>
                .tetris {
                    display: flex;
                    flex-direction:column;
                    width:95%;
                    max-width: 300px;
                    justify-content: center;
                    align-items: center;
                    font-family:'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
                }
                .game {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    padding: 10px;
                    width:100%;
                }
                .game-board {
                    display:flex;
                    flex-direction: column;
                    background-color: #050505;
                    width:100%;
                    aspect-ratio: 1/2;
                }
                .game-board-row {
                    display: flex;
                    height: 10%;
                }
                .game-board-cell {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 10%;
                    height: 100%;
                    opacity: 0.9;
                }
                .game-board-cell.filled {
                    background-color: #ccc;
                }
                .game-info {
                    display: flex;
                    justify-content: space-between;
                    width: 100%;
                    margin-top: 10px;
                    font-size: 0.75em;
                    font-weight: bold;
                }
                .game-info div{
                    display:flex;
                    align-items:center;
                    gap:0.5em;
                }
                .game-info .label {
                    font-weight: normal;
                    text-transform:uppercase;
                }
                .controls {
                    display: flex;
                    justify-content: center;
                    margin-top: 10px;
                    gap:0.5em;
                }
                
                .banner{
                    position: absolute;
                    top:50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 2em;
                    display:flex;
                    flex-direction:column;
                    gap:0.25em;
                    width: max-content;
                    align-items: center;
                }
                .banner .subtitle{
                    font-size: 0.5em;
                }
                .game-over-banner {
                    color: pink;
                }
                .paused-banner {
                    color: lightgreen;
                }
                .preview{
                    display:flex;
                    justify-content: flex-end;
                    height:0.75em;
                    width:100%;
                }
                .preview .game-board-cell{
                    width:4px;
                    height:4px;
                }
            </style>
            <div class="tetris">
                <div class="game">
                    <div  class="preview">
                        <div data-name="preview" class="game-board">
                        </div>
                    </div>
                    <div data-name="gameboardEl" class="game-board" >
                    </div>
                    <template data-name="rowTemplate"><div class="game-board-row"></div></template>
                    <template data-name="cellTemplate"><div class="game-board-cell"></div></template>
                    <div class="game-info">
                        <div><span class="label">Score</span> <span data-name="score"></span></div>
                        <div><span class="label">Level</span> <span data-name="level"></span></div>
                    </div>
                    <div data-name="gameOverBanner" class="banner game-over-banner">GAME OVER</div>
                    <div data-name="pausedBanner" class="banner paused-banner">PAUSED</div>
                    <div data-name="readyBanner" class="banner ready-banner">
                        <div>GET READY</div>
                        <div class="subtitle">use the arrow keys</div>   
                        <div class="subtitle">press space to start</div>   
                    </div>
                </div>
                <div class="controls">
                    <div data-name="gameControlsEl">
                        <button data-name="leftButton">
                            <five-icon key="leftArrow"></five-icon>
                        </button>
                        <button data-name="rightButton">
                            <five-icon key="rightArrow"></five-icon>
                        </button>
                        <button data-name="rotateButton">
                            <five-icon key="rotateRight"></five-icon>
                        </button>
                        <button data-name="moveDownButton">
                            <five-icon key="downArrow"></five-icon>
                        </button>
                    </div>
                    <div>
                        <button data-name="startButton">Start</button>
                        <button data-name="pauseButton">Pause</button>
                        <button data-name="resumeButton">Resume</button>
                        <button data-name="resetButton">Reset</button>
                    </div>
                </div>
            </div>
        `);
    }

    connectedCallback() {
        this.leftButton.onclick = () => this.moveShapeX(-1);
        this.rightButton.onclick = () => this.moveShapeX(1);
        this.rotateButton.onclick = () => this.rotateShape();
        this.moveDownButton.onclick = () => this.moveShapeDown();
        this.startButton.onclick = () => this.start();
        this.pauseButton.onclick = () => this.pause();
        this.resumeButton.onclick = () => this.resume();
        this.resetButton.onclick = () => {
            this.reset();
            this.updateUI();
        };
        document.addEventListener('keydown', (e) => {
            this.handleKey(e.key);
            e.preventDefault();

        });
        this.reset();

        this.matrix.forEach((row, i) => {
            const rowEl = this.rowTemplate.clone();
            row.forEach((cell, j) => {
                const cellEl = this.cellTemplate.clone();
                rowEl.append(cellEl);
            });
            this.gameboardEl.append(rowEl);
        });
        this.nextShape = this.getNextShape();
        this.updateUI();
    }
    disconnectedCallback() {
        document.removeEventListener('keydown');
    }
    updateUI() {
        this.score.innerText = `${scoreFormatter.format(this.scoreValue)}`;
        this.level.innerText = `${this.levelValue}`;
        this.gameOverBanner.style.display = this.gamestate == GAMEOVER ? '' : 'none';
        this.pauseButton.style.display = this.gamestate === PLAYING ? '' : 'none';
        this.resumeButton.style.display = this.gamestate === PAUSED ? '' : 'none';
        this.startButton.style.display = this.gamestate === READY ? '' : 'none';
        this.pausedBanner.style.display = this.gamestate === PAUSED ? '' : 'none';
        this.readyBanner.style.display = this.gamestate === READY ? '' : 'none';
        this.resetButton.style.display = this.gamestate === GAMEOVER || this.gamestate == PAUSED ? '' : 'none';
        this.gameboardEl.style.opacity = this.gamestate === PLAYING ? 1 : 0.5;
        this.gameControlsEl.style.display = this.gamestate === PLAYING ? '' : 'none';
        this.matrix.forEach((row, i) => {
            const rowEl = this.gameboardEl.children[i];
            row.forEach((cell, j) => {
                const cellEl = rowEl.children[j];
                if (this.shape && this.shape.y <= i && this.shape.y + this.shape.m.length > i && this.shape.x <= j && this.shape.x + this.shape.m[0].length > j) {
                    const s = this.shape.m[i - this.shape.y][j - this.shape.x];
                    cellEl.classList.toggle('filled', (cell != null || s === 1));
                    cellEl.style.backgroundColor = s === 1 ? this.shape.color : cell != null ? cell : '';
                } else {
                    cellEl.classList.toggle('filled', cell != null);
                    cellEl.style.backgroundColor = cell != null ? cell : '';
                }
            });
        });
        this.preview.style.display = this.gamestate === PLAYING || this.gamestate == PAUSED ? '' : 'none';
        this.preview.innerHTML = '';
        if (this.nextShape) {
            this.nextShape.m.forEach((row, i) => {
                const rowEl = this.rowTemplate.clone();
                row.forEach((cell, j) => {
                    const cellEl = this.cellTemplate.clone();
                    rowEl.append(cellEl);
                    cellEl.classList.toggle('filled', cell === 1);
                    cellEl.style.backgroundColor = cell === 1 ? this.nextShape.color : '';
                });
                this.preview.append(rowEl);
            });
        }
    }

    handleKey(key) {
        switch (this.gamestate) {
            case PLAYING:
                switch (key) {
                    case 'ArrowUp':
                        this.rotateShape();
                        break;
                    case 'ArrowDown':
                        this.moveShapeDown();
                        break;
                    case 'ArrowLeft':
                        this.moveShapeX(-1);
                        break;
                    case 'ArrowRight':
                        this.moveShapeX(1);
                        break;
                    case ' ':
                        this.pause();
                        break;
                }
                break;
            default:
                if (key === ' ') {
                    switch (this.gamestate) {
                        case READY:
                            this.start();
                            break;
                        case PAUSED:
                            this.resume();
                            break;
                        case GAMEOVER:
                            this.reset();
                            this.updateUI();
                            break;
                    }
                }
        }
    }
    rotateShape() {
        const m = this.shape.m;
        const newM = [];
        for (let i = 0; i < m[0].length; i++) {
            newM.push([]);
            for (let j = m.length - 1; j >= 0; j--) {
                newM[i].push(m[j][i]);
            }
        }
        this.shape.m = newM;
        if (this.collides()) {
            this.shape.m = m;
        }
    }
    moveShapeDown() {
        this.shape.y++;
        if (this.collides()) {
            this.shape.y--;
        }
    }
    moveShapeX(offset) {
        this.shape.x += offset;
        if (this.collides()) {
            this.shape.x -= offset;
        }
    }
    initMatrix() {
        this.matrix = [];
        for (let i = 0; i < 20; i++) {
            this.matrix.push([]);
            for (let j = 0; j < 10; j++) {
                this.matrix[i].push(null);
            }
        }
    }

    start() {
        this.gamestate = PLAYING;
        this.spawnShape();
        this.gameLoop();
    }
    gameLoop() {
        if (this.gamestate === PLAYING) {
            this.updateMatrix();
            this.checkGameOver();
            this.updateUI();
            setTimeout(() => {
                window.requestAnimationFrame(() => this.gameLoop());
            }, 400);
        }
    }
    pause() {
        this.gamestate = PAUSED;
        this.updateUI();
    }
    resume() {
        this.gamestate = PLAYING;
        this.updateUI();
        this.gameLoop();
    }

    updateMatrix() {
        this.shape.y++;
        if (this.collides()) {
            this.shape.y--;
            this.mergeShape();
            this.spawnShape();
        }
        this.clearRows();

    }
    collides() {
        const s = this.shape.m;
        for (let i = 0; i < s.length; i++) {
            for (let j = 0; j < s[i].length; j++) {
                if (s[i][j] === 1) {
                    if (this.shape.y + i >= 20 || this.shape.x + j < 0 || this.shape.x + j >= 10 || this.matrix[this.shape.y + i][this.shape.x + j] != null) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    mergeShape() {
        const s = this.shape.m;
        for (let i = 0; i < s.length; i++) {
            for (let j = 0; j < s[i].length; j++) {
                if (s[i][j] === 1) {
                    this.matrix[this.shape.y + i][this.shape.x + j] = this.shape.color;
                }
            }
        }
    }
    clearRows() {
        let rows = 0;
        for (let i = 0; i < this.matrix.length; i++) {
            if (this.matrix[i].every(cell => cell != null)) {
                this.matrix.splice(i, 1);
                this.matrix.unshift(new Array(10).fill(null));
                rows++;
            }
        }
        this.scoreValue += rows * rows * 100;
        this.levelValue = Math.floor(this.scoreValue / 1000) + 1;
    }

    reset() {
        this.initMatrix();
        this.scoreValue = 0;
        this.levelValue = 1;
        this.shape = null;
        this.gamestate = READY;
    }

    getNextShape() {
        const m = this.shapes[Math.floor(Math.random() * this.shapes.length)]
        return {
            x: Math.floor(this.gridWidth / 2 - m[0].length / 2),
            y: 0,
            m: m,
            color: this.colors[Math.floor(Math.random() * this.colors.length)]
        };
    }
    spawnShape() {
        this.shape = this.nextShape;
        this.nextShape = this.getNextShape();
    }
    checkGameOver() {
        if (this.matrix[0].some(cell => cell != null)) {
            this.gamestate = GAMEOVER;
        }
    }
}
customElements.define('tetris-component', Tetris);