import BaseComponent from "../core/base-component.js";

const LOADING = 0, READY = 1, PLAYING = 2, PAUSED = 3, WIN = 4, LOSE = 5;

//top, left, bottom, right
const tiles = [
    [1, 0, 0, 0],//0
    [1, 1, 0, 0],//1
    [1, 1, 1, 0],//2
    [1, 1, 1, 1],//3
    [0, 1, 1, 1],//4
    [0, 0, 1, 1],//5
    [0, 0, 0, 1],//6
    [0, 1, 0, 1],//7


]

const levels = [
    {
        map:
            [
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0],
                [0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0],
                [0, 3, 1, 0, 3, 1, 0, 3, 1, 0, 3, 1, 0, 3, 0],
                [0, 3, 1, 3, 3, 1, 3, 3, 1, 3, 3, 1, 3, 3, 0],
                [0, 3, 1, 0, 3, 1, 0, 3, 1, 0, 3, 1, 0, 3, 0],
                [0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0],
                [0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            ],
        ghosts: [
            [1, 4],
            [3, 9],
            [6, 4],
            [3, 1],
        ],
        bonus: [7, 7],
    }
]
export default class PacMan extends BaseComponent {
    levelIndex = 0;
    gamestate;

    constructor() {
        super(/*html*/`
            <style>
                svg{
                    width: 750px;
                    height: 450px;

                }
                .pac{
                    width: 50px;
                    height: 50px;
                    background-color: yellow;
                    border-radius: 50%;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }
            </style>
            <div class="pac">
                <template data-name="dotTemplate">
                    <div class="dot">
                        <five-icon key="pacManDot"></five-icon>
                    </div>
                </template>
                <template data-name="ghostTemplate">
                    <div class="ghost">
                        <five-icon key="pacManGhost"></five-icon>
                    </div>
                </template>
                <div class="mapContainer">
                    <svg viewBox="0 0 750 450" data-name="mapSvg">
                        <g data-name="map">
                        </g>
                    </svg>
                </div>
            </div>
        `);
    }
    connectedCallback() {
        super.connectedCallback();
        this.setup();
        this.updateUI();
    }
    setup() {
        this.level = levels[this.levelIndex];
        this.updateUI();
    }
    updateUI() {
        this.map.innerHTML = '';
        this.level.map.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile === 0) {
                    return;
                }
                const tileEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                tileEl.setAttribute('x', x * 50);
                tileEl.setAttribute('y', y * 50);
                tileEl.setAttribute('width', 50);
                tileEl.setAttribute('height', 50);
                tileEl.setAttribute('fill', 'black');
                this.map.append(tileEl);
                //walls
                tiles[tile].forEach((wall, i) => {
                    if (wall) {
                        const wallEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        switch (i) {
                            case 0:
                                wallEl.setAttribute('x', x * 50);
                                wallEl.setAttribute('y', y * 50);
                                wallEl.setAttribute('width', 50);
                                wallEl.setAttribute('height', 5);
                                break;
                            case 1:
                                wallEl.setAttribute('x', x * 50 + 45);
                                wallEl.setAttribute('y', y * 50);
                                wallEl.setAttribute('width', 5);
                                wallEl.setAttribute('height', 50);
                                break;
                            case 2:
                                wallEl.setAttribute('x', x * 50);
                                wallEl.setAttribute('y', y * 50 + 45);
                                wallEl.setAttribute('width', 50);
                                wallEl.setAttribute('height', 5);
                                break;
                            case 3:
                                wallEl.setAttribute('x', x * 50);
                                wallEl.setAttribute('y', y * 50);
                                wallEl.setAttribute('width', 5);
                                wallEl.setAttribute('height', 50);
                                break;
                        }
                        wallEl.setAttribute('fill', 'blue');
                        this.map.append(wallEl);
                    }
                });

            });
        });
    }


}
window.customElements.define('pac-man', PacMan);