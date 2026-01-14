import BaseComponent from '../core/base-component.js';
import '../shared/icon-component.js';
import './main-title.js';

const demos = [
    {
        name: 'Hangman',
        image: 'hangman/hangman.png',
        link: 'hangman/',
        description: 'Guess the word game with emoji clues',
        featured: true
    },
    {
        name: 'Tic Tac Toe',
        image: 'tic-tac-toe/tic-tac-toe.png',
        link: 'tic-tac-toe/',
        description: 'Classic game of Xs and Os',
        featured: true
    },
    {
        name: 'Marble run game',
        image: 'marbles/marbles.png',
        link: 'marbles/',
        description: 'Marble run game with physics',
        featured: true
    },
    {
        name: 'Mine Sweeper',
        image: 'speedsweeper/speedsweeper.png',
        link: 'speedsweeper/',
        description: 'Find the mines without blowing up',
        featured: true
    },
    {
        name: 'Tetris',
        image: 'tetris/tetris.png',
        link: 'tetris/',
        description: 'Classic game of falling blocks',
        featured: true
    },
    {
        name: 'Pac-man',
        link: 'pac-man/'
    },
    {
        name: 'Birthday calendar',
        link: 'birthdays/',
    },
    {
        name: 'Review widget',
        link: 'reviews/',
    },
    {
        name: 'SVG Studio',
        link: 'svgstudio/',
    }

];
export default class LandingPage extends BaseComponent {
    constructor() {
        super(/*html*/`
    <style>
        .outer {
            display: flex;
            flex-direction: column;
        }
        .title-container {
            width:90%;
            margin-bottom:2em;
        }
        .main-title {
            font-size: 2em;
        }
        .feature-grid {
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            gap: 2em;
        }
        .feature .game-image {
            height: 180px;
        }
        .feature {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 10px;
        }
        .games-list {   
            display:flex;
            flex-direction: column;
            gap: 1em;
            padding-top: 1em;
        }
    </style>
    <div class="outer">
        <div class="title-container">
            <five-main-title></five-main-title>
        </div>
        <section>
            <h2>Featured Five</h2>
            <section>
                <div class="feature-grid" data-name="featuredGamesEl">
                </div>
                <template data-name="featuredGameTemplate">
                    <div class="feature">
                        <div>
                            <a href="">
                                <img class="game-image" src="" alt="">
                            </a>
                        </div>
                        <div>
                            <a href="" class="game-link"></a>
                        </div>
                    </div>
                </template>
            </section>
            <h2>Everything else</h2>
            <section>
                <div data-name="gamesListEl" class="games-list">
                </div>
                <template data-name="gameListItemTemplate">
                    <div>
                        <five-icon key="rightArrow"></five-icon>
                        <a href="" data-name="link"></a>
                    </div>
                </template>
            </section>
        </section>
    </div>
    `);
    }
    connectedCallback() {
        this.updateUI();
    }
    updateUI() {
        const featured = demos.filter(game => game.featured);
        featured.forEach(game => {
            const el = this.featuredGameTemplate.clone();
            this.featuredGamesEl.appendChild(el);
            el.querySelector('.game-image').src = game.image;
            el.querySelectorAll('a').forEach(a => a.href = game.link);
            el.querySelector('a.game-link').textContent = game.name;
        });
        const others = demos.filter(game => !game.featured);
        others.forEach(game => {
            const el = this.gameListItemTemplate.clone();
            this.gamesListEl.appendChild(el);
            el.querySelector('a').href = game.link;
            el.querySelector('a').textContent = game.name;
        });
    }

}
customElements.define('landing-page', LandingPage);