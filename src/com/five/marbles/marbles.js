import BaseComponent from "../core/base-component.js";

import { SVGUtil, Drag, XY, XYA } from "../core/ui-utils.js";

const pl = planck,
    Vec2 = planck.Vec2,
    RADIANS_TO_DEGREES = 57.2958;

const WAITING = 0,
    BUILDING = 1,
    PLAYING = 2,
    PLAYING_READY = 3,
    END_WIN = 4,
    END_LOSE = 5;

const collisionThreshold = 0.1;

export default class Marbles extends BaseComponent {

    gameObjects = [];

    world;
    svgUtil;
    containerWidth;
    containerHeight;
    activeLevel;
    levels;
    drag;

    mode = WAITING;
    level = 0;

    constructor() {
        super(/*html*/`
        <script src="https://cdn.jsdelivr.net/npm/planck@1.0.0-alpha.3/dist/planck.min.js"></script>
        <style>
        .container {
            max-width: 350px;
            margin: auto;
        }

        svg {
            background-color: #1d4349;
            height: 80%;
            margin-top: 0.25em;
        }

        g.level {
            display: none;
        }

        g.level.active {
            display: initial;
        }

        .kinematic {
            fill: #c93fec;
        }

        .dynamic {
            fill: #b4ec3f;
        }

        #player.dynamic {
            fill: #ff1e00;
        }

        .static {
            fill: #00d9ff;
        }

        .border {
            stroke: #00d9ff;
            stroke-width: 0.05;
        }

        .win .border {
            stroke: #51ff00;
        }

        .lose .border {
            stroke: #ff3c00;
        }

        .ready #player {
            fill: #51ff00;
        }

        .lose.ready #player {
            fill: #ff3c00;
        }

        .build .border {
            stroke: #002930;
        }

        button {
            cursor: pointer;
            font-size: 1em;
            color: #008fa8;
            border: 1px solid #015e6e;
            background-color: #002930;
        }

        .controls {
            width: 100%;
            text-align: right;
        }

        .build button {
            color: #00d9ff;
            border: 1px solid #00d9ff;
            background-color: #002930;
        }

        #progress rect.red {
            fill: #2b0500;
        }

        #progress rect.red.active {
            fill: #ff1e00;
        }

        #progress rect.green {
            fill: #081a00;
        }

        #progress rect.green.active {
            fill: #51ff00;
        }

        .lose #progress rect.green.active {
            fill: #ff3c00;
        }

        </style>
            <div data-name="outer">
                <audio src="bounce6.wav" data-name="bounceSound" id="bounce-wav" preload="auto">
                    Your browser does not support the
                    <code>audio</code> element.
                </audio>
                <audio src="ready.wav" data-name="readySound"  preload="auto"></audio>
                <audio src="win.wav" data-name="winSound" preload="auto"></audio>
                <audio src="lose.wav" data-name="loseSound"  preload="auto"></audio>
                <div class="container">
                    <div class="controls">
                        <span data-name="levelContainerEl" id="level-container">
                            <button data-name="previousLevelButton">&lt;</button>
                            <span data-name="levelEl"></span>
                            <button data-name="nextLevelButton">&gt;</button>
                        </span>

                        <button data-name="startButton">Start</button>
                        <button data-name="resetButton">Reset</button>
                    </div>
                    <svg data-name="svgEl" viewBox="0 0 4.5 8">
                        <g data-name="progressEl" id="progress">
                            <rect width="0.05" height="0.2" x="0.2" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="0.27" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="0.34" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="0.41" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="0.48" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="0.55" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="0.62" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="0.69" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="0.76" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="0.83" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="0.9" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="0.97" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="1.04" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="1.11" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="1.18" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="1.25" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="1.32" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="1.39" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="1.46" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="1.53" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="1.6" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="1.67" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="1.74" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="1.81" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="1.88" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="1.95" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="2.02" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="2.09" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="2.16" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="2.23" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="2.3" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="2.37" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="2.44" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="2.51" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="2.58" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="2.65" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="2.72" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="2.79" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="2.86" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="2.93" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="3" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="3.07" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="3.14" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="3.21" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="3.28" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="3.35" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="3.42" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="3.49" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="3.56" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="3.63" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="3.7" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="3.77" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="3.84" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="3.91" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="3.98" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="4.05" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="4.12" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="4.19" y="0.2"></rect>
                            <rect width="0.05" height="0.2" x="4.26" y="0.2"></rect>
                        </g>
                        <g class="level" data-level="1" data-min-time="8" data-max-time="10">
                            <rect data-type="kinematic" width="1" height="1" x="0" y="0" class="kinematic" transform="translate(3.161024332046509 6.605589389801025) rotate(0) "></rect>
                            <rect data-type="kinematic" width="0.2" height="0.2" x="0" y="0" class="kinematic" transform="translate(1.276397466659546 3.311002731323242) rotate(0) "></rect>
                            <rect data-type="kinematic" width="0.2" height="0.2" x="0" y="0" class="kinematic" transform="translate(0.7965922951698303 3.2476954460144043) rotate(0) "></rect>
                            <rect data-type="kinematic" width="2" height="0.2" x="0" y="0" class="kinematic" transform="translate(1.3892576694488525 1.4494404792785645) rotate(0) "></rect>
                            <rect data-type="kinematic" width="2" height="0.2" x="0" y="0" class="kinematic" transform="translate(1.5572540760040283 4.847449779510498) rotate(0) "></rect>
                            <rect data-type="kinematic" width="1" height="1" x="0" y="0" class="kinematic" transform="translate(0.9846596717834473 6.949036598205566) rotate(0) "></rect>
                            <rect data-type="dynamic" width="0.2" height="0.2" x="0" y="0" class="dynamic" transform="translate(0.46195017945367123 2.5331506751260298) rotate(6.955854899368794) "></rect>
                            <rect data-type="dynamic" width="0.2" height="0.2" x="0" y="0" class="dynamic" transform="translate(2.3268561391881977 4.832449780017247) rotate(-90.00003216091525) "></rect>
                            <rect data-type="dynamic" width="0.2" height="0.2" x="0" y="0" class="dynamic" transform="translate(0.46643067954548695 2.5186160092900542) rotate(-83.02844253570288) "></rect>
                            <rect data-type="dynamic" width="0.2" height="0.2" x="0" y="0" class="dynamic" transform="translate(3.361684897317037 1.4347856932674998) rotate(179.3593378388447) "></rect>
                            <rect data-type="dynamic" width="1.5" height="0.2" x="0" y="0" class="dynamic" transform="translate(1.6998690396145395 1.2368630317430154) rotate(-8.333757728395177) "></rect>
                            <rect data-type="dynamic" width="0.2" height="0.2" x="0" y="0" class="dynamic" transform="translate(0.42098367668226205 2.946161303046576) rotate(-83.06532941346735) "></rect>
                            <rect data-type="dynamic" width="2" height="0.2" x="0" y="0" class="dynamic" transform="translate(2.179369195453365 3.376257814997912) rotate(-173.07465882317288) "></rect>
                            <circle data-type="dynamic" r="0.3" cx="0" cy="0" class="dynamic" transform="translate(2.864671230316162 4.537917137145996) rotate(-76.9476318359375) "></circle>

                            <line class="border static" data-type="static" x1="0" y1="0" x2="2" y2="0" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            <line class="border static" data-type="static" x1="2.5" y1="0" x2="4.5" y2="0" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            <line class="border static" data-type="static" x1="0" y1="0" x2="0" y2="8" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            <line class="border static" data-type="static" x1="0" y1="8" x2="2" y2="8" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            <line class="border static" data-type="static" x1="2.5" y1="8" x2="4.5" y2="8" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            <line class="border static" data-type="static" x1="4.5" y1="0" x2="4.5" y2="8" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            
                        </g>
                        <g class="level" data-level="2" data-min-time="10" data-max-time="11">
                            <rect data-type="dynamic" width="2" height="0.1" x="0" y="0" class="dynamic" transform="translate(2.478720405605702 7.548042638947742) rotate(0.027935327027039228) "></rect>
                            <rect data-type="dynamic" width="2" height="0.1" x="0" y="0" class="dynamic" transform="translate(2.475429750269154 7.661825934392508) rotate(0.02646832775485876) "></rect>
                            <rect data-type="dynamic" width="2" height="0.1" x="0" y="0" class="dynamic" transform="translate(2.478547206944667 7.774525724805122) rotate(0.022355461420090345) "></rect>
                            <rect data-type="dynamic" width="2" height="0.1" x="0" y="0" class="dynamic" transform="translate(2.4795166713848285 7.886342866097702) rotate(0.013415194441738635) "></rect>
                            <rect data-type="kinematic" width="0.2" height="0.2" x="0" y="0" class="kinematic" transform="translate(2.2646596431732178 4.029036521911621) rotate(0) "></rect>
                            <rect data-type="kinematic" width="0.2" height="0.2" x="0" y="0" class="kinematic" transform="translate(1.884659767150879 4.009036540985107) rotate(0) "></rect>
                            <rect data-type="kinematic" width="0.2" height="0.2" x="0" y="0" class="kinematic" transform="translate(1.9146597385406494 3.6190366744995117) rotate(0) "></rect>
                            <rect data-type="kinematic" width="0.2" height="0.2" x="0" y="0" class="kinematic" transform="translate(2.2646596431732178 3.599036693572998) rotate(0) "></rect>

                            <circle data-type="kinematic" r="0.2" cx="0" cy="0" class="kinematic" transform="translate(2.864670991897583 4.657917499542236) rotate(-76.9476318359375) "></circle>
                            <circle data-type="kinematic" r="0.2" cx="0" cy="0" class="kinematic" transform="translate(1.4846711158752441 4.627917289733887) rotate(-76.9476318359375) "></circle>
                            <circle data-type="kinematic" r="0.2" cx="0" cy="0" class="kinematic" transform="translate(1.5446710586547852 3.3879170417785645) rotate(-76.9476318359375) "></circle>
                            <circle data-type="kinematic" r="0.2" cx="0" cy="0" class="kinematic" transform="translate(2.8346712589263916 3.347916841506958) rotate(-76.9476318359375) "></circle>


                            <line class="border static" data-type="static" x1="0" y1="0" x2="2" y2="0" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            <line class="border static" data-type="static" x1="2.5" y1="0" x2="4.5" y2="0" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            <line class="border static" data-type="static" x1="0" y1="0" x2="0" y2="8" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            <line class="border static" data-type="static" x1="0" y1="8" x2="2" y2="8" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            <line class="border static" data-type="static" x1="2.5" y1="8" x2="4.5" y2="8" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            <line class="border static" data-type="static" x1="4.5" y1="0" x2="4.5" y2="8" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                        </g>
                        <g class="level" data-level="3" data-min-time="19" data-max-time="20">
                            <rect data-type="dynamic" width="0.5" height="0.5" x="0" y="0" class="dynamic" transform="translate(0.22658945667859903 7.485013742093112) rotate(-0.3529347929353176) "></rect>
                            <rect data-type="dynamic" width="0.5" height="0.5" x="0" y="0" class="dynamic" transform="translate(0.7664057029514485 7.484195126369665) rotate(0.09230617686605945) "></rect>
                            <rect data-type="dynamic" width="0.5" height="0.5" x="0" y="0" class="dynamic" transform="translate(1.7981091130507727 7.482785926586369) rotate(90.29364004082893) "></rect>
                            <rect data-type="dynamic" width="0.5" height="0.5" x="0" y="0" class="dynamic" transform="translate(3.111539217929867 6.982297046960223) rotate(-10.849958853237116) "></rect>
                            <rect data-type="dynamic" width="0.5" height="0.5" x="0" y="0" class="dynamic" transform="translate(2.9770694426350666 7.486019935422004) rotate(-0.01249272755304948) "></rect>
                            <rect data-type="dynamic" width="0.5" height="0.5" x="0" y="0" class="dynamic" transform="translate(3.494370259281215 7.483733362628291) rotate(-0.24834773639383212) "></rect>
                            <rect data-type="kinematic" width="0.5" height="0.5" x="0" y="0" class="kinematic" transform="translate(1.0963952541351318 4.651002407073975) rotate(0) "></rect>
                            <rect data-type="kinematic" width="0.275" height="0.275" x="0" y="0" class="kinematic" transform="translate(0.6765933632850647 4.967695236206055) rotate(0) "></rect>
                            <rect data-type="kinematic" width="0.2" height="0.2" x="0" y="0" class="kinematic" transform="translate(0.6865916848182678 4.66769552230835) rotate(0) "></rect>
                        
                            <rect data-type="dynamic" width="3" height="0.2" x="0" y="0" class="dynamic" transform="translate(0.8987552022641399 7.274373386959027) rotate(-12.984063510256146) "></rect>
                            <rect data-type="dynamic" width="2.5" height="0.2" x="0" y="0" class="dynamic" transform="translate(1.1324805866671541 7.000424351863387) rotate(-12.957650737713784) "></rect>
                            <rect data-type="dynamic" width="2" height="0.2" x="0" y="0" class="dynamic" transform="translate(1.763790338021955 4.921983846817219) rotate(49.80692107445855) "></rect>
                        
                            <line class="border static" data-type="static" x1="0" y1="0" x2="2" y2="0" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            <line class="border static" data-type="static" x1="2.5" y1="0" x2="4.5" y2="0" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            <line class="border static" data-type="static" x1="0" y1="0" x2="0" y2="8" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            <line class="border static" data-type="static" x1="0" y1="8" x2="2" y2="8" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            <line class="border static" data-type="static" x1="2.5" y1="8" x2="4.5" y2="8" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                            <line class="border static" data-type="static" x1="4.5" y1="0" x2="4.5" y2="8" transform="translate(0 0) rotate(0) " x="0" y="0"></line>
                        </g>
                        <circle cx="4.25" cy="0.2" r="0.2" data-type="dynamic" data-name="player"></circle>
                    </svg>
                </div>
            </div>
        `);
    }

    connectedCallback() {
        super.connectedCallback();
        this.svgUtil = new SVGUtil(this.svgEl);
        const viewbox = this.svgUtil.viewbox()
        this.containerWidth = viewbox[2]
        this.containerHeight = viewbox[3];

        this.world = new planck.World(planck.Vec2(0, 10), {
            sleep: true
        })
        this.world.on('remove-fixture', (fixture) => {
            // no-op yet
        });

        this.world.on('post-solve', (contact, oldManifold) => {
            if (this.isBuilding() || this.isPlaying()) {
                let worldManifold = contact.getWorldManifold();
                let bodyA = contact.getFixtureA().getBody();
                let bodyB = contact.getFixtureB().getBody();
                let point = worldManifold.points[0];
                let vA = bodyA.getLinearVelocityFromWorldPoint(point);
                let vB = bodyB.getLinearVelocityFromWorldPoint(point);
                let approachVelocity = planck.Vec2.dot(vB.sub(vA), worldManifold.normal);
                if (approachVelocity > collisionThreshold) {
                    const rate = this.lerp(1, 16, Math.random());
                    this.bounceSound.playbackRate = rate;
                    this.bounceSound.volume = this.clamp(approachVelocity / 3, 0, 1);
                    try {
                        this.bounceSound.play();
                    } catch (error) { }
                }
            }
        });
        this.startButton.onclick = () => {
            this.play();
        }
        this.resetButton.onclick = () => {
            this.reset();
        }
        this.previousLevelButton.onclick = () => {
            this.moveLevel(-1);
        }
        this.nextLevelButton.onclick = () => {
            this.moveLevel(1);
        };
        this.onmousemove = (e) => {
            this.mouseMove(e);
        };
        this.onmouseup = (e) => {
            this.endDrag(e);
        };
        this.ontouchmove = (e) => {
            this.mouseMove(e);
        };
        this.ontouchend = (e) => {
            this.endDrag(e);
        };

        this.progressEls = Array.from(this.progressEl.getElementsByTagName('rect'));
        this.levels = Array.from(this.svgEl.getElementsByClassName('level'));
        this.levels.forEach(l => l.unlocked = false);

        this.loadLevel(this.level);
        this.time = 0;
        this.next();

    }
    updateUI() {
        const max = this.progressEls.length;
        const progress = this.lerp(0, max, this.time / this.activeLevel.maxTime);
        const min = this.lerp(0, max, this.activeLevel.minTime / this.activeLevel.maxTime);

        this.progressEls.forEach((el, i) => {
            el.classList.toggle('red', i < min);
            el.classList.toggle('green', i >= min);
            el.classList.toggle('active', i == progress);
        });

        this.gameObjects.forEach(el => {
            const p = el.body.getPosition();
            el.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ') rotate(' + el.body.getAngle() * RADIANS_TO_DEGREES + ') ');
            el.classList.toggle('static', el.body.isStatic());
            el.classList.toggle('dynamic', el.body.isDynamic());
            el.classList.toggle('kinematic', el.body.isKinematic());
        });

        this.player.style.display = this.isPlayingOrEnd() ? '' : 'none';
        this.startButton.style.display = this.isBuilding() ? '' : 'none';
        this.previousLevelButton.style.display = this.level > 0 ? '' : 'none';
        this.nextLevelButton.style.display = this.level < this.levels.length - 1 && this.levels[this.level + 1].unlocked ? '' : 'none';
        this.levelEl.innerText = '' + (this.level + 1);
        this.levelContainerEl.style.display = this.levels.reduce((agg, value) => value.unlocked ? ++agg : agg, 0) > 1 ? '' : 'none';
        this.resetButton.style.display = this.isPlayingOrEnd() ? '' : 'none';
        this.outer.classList.toggle('win', this.isEndWin());
        this.outer.classList.toggle('lose', this.isEndLose());
        this.outer.classList.toggle('build', this.isBuilding());
        this.outer.classList.toggle('ready', this.isPlayingReady());

    }
    loadLevel(levelNumber) {
        if (this.activeLevel) {
            this.unloadActiveLevel();
        }
        const level = this.levels[levelNumber];
        if (!level.loaded) {
            level.circles = level.getElementsByTagName('circle') ?? [];
            level.rects = level.getElementsByTagName('rect') ?? [];
            level.lines = level.getElementsByTagName('line') ?? [];
            level.paths = level.getElementsByTagName('path') ?? [];
            level.minTime = level.dataset.minTime;
            level.maxTime = level.dataset.maxTime;
        }
        this.gameObjects.push(this.circle(this.player, this.world));
        for (let i = 0; i < level.circles.length; i++) {
            this.gameObjects.push(this.circle(level.circles[i], this.world));
        }
        for (let i = 0; i < level.rects.length; i++) {
            this.gameObjects.push(this.rect(level.rects[i], this.world));
        }
        for (let i = 0; i < level.lines.length; i++) {
            this.gameObjects.push(this.line(level.lines[i], this.world));
        }
        for (let i = 0; i < level.paths.length; i++) {
            this.gameObjects.push(this.path(level.paths[i], this.world));
        }
        this.gameObjects.forEach(svgEl => {
            svgEl.body.userData = svgEl;
            svgEl.bodyType = svgEl.body.getType();
            if (!level.loaded) {
                svgEl.onmousedown = (e) => {
                    this.startDrag(svgEl)
                };
                svgEl.ontouchstart = (e) => {
                    this.startDrag(svgEl)
                };
            }
            this.backup(svgEl);
        });
        level.loaded = true;
        level.unlocked = true;
        this.activeLevel = level;
        this.activeLevel.classList.toggle('active');
        this.mode = BUILDING;
    }

    unloadActiveLevel() {
        this.gameObjects = [];
        this.activeLevel.classList.toggle('active', false);
        for (let b = this.world.getBodyList(); b; b = b.getNext()) {
            this.world.destroyBody(b);
        }
    }

    circle(svgEl, world) {
        var xya = SVGUtil.getXYA(svgEl.cx.baseVal.value, svgEl.cy.baseVal.value, svgEl);
        svgEl.body = world.createBody({
            allowSleep: true,
            type: svgEl.dataset.type,
            position: Vec2(xya.x, xya.y),
            angle: xya.a / RADIANS_TO_DEGREES
        });
        svgEl.body.createFixture(pl.Circle(Vec2(0, 0), svgEl.r.baseVal.value), {
            density: 1,
            restitution: 0.6,
            friction: 0.6
        });
        svgEl.setAttribute('cx', '0');
        svgEl.setAttribute('cy', '0');
        return svgEl;
    }

    rect(svgEl, world) {
        var width = svgEl.width.baseVal.value;
        var height = svgEl.height.baseVal.value;
        var xya = SVGUtil.getXYA(svgEl.x.baseVal.value, svgEl.y.baseVal.value, svgEl);
        svgEl.body = world.createBody({
            allowSleep: true,
            type: svgEl.dataset.type,
            position: Vec2(xya.x, xya.y),
            angle: xya.a / RADIANS_TO_DEGREES
        });
        svgEl.body.createFixture(pl.Box(width / 2, height / 2, Vec2(width / 2, height / 2)), {
            density: 1,
            friction: 0.6
        });
        svgEl.setAttribute('x', '0');
        svgEl.setAttribute('y', '0');
        return svgEl;
    }

    line(svgEl, world) {
        var xya1 = SVGUtil.getXYA(svgEl.x1.baseVal.value, svgEl.y1.baseVal.value, svgEl);
        var xya2 = SVGUtil.getXYA(svgEl.x2.baseVal.value, svgEl.y2.baseVal.value, svgEl);
        svgEl.body = world.createBody({
            type: svgEl.dataset.type,
            allowSleep: true
        });
        svgEl.body.createFixture(pl.Edge(Vec2(xya1.x, xya1.y), Vec2(xya2.x, xya2.y)), 0.0);
        svgEl.setAttribute('x', '0');
        svgEl.setAttribute('y', '0');
        return svgEl;
    }

    polyline(svgEl, world) {
        var points = svgEl.points;
        var xya = SVGUtil.getXYA(points[0].x, points[0].y, svgEl);
        svgEl.body = world.createBody({
            type: svgEl.dataset.type,
            allowSleep: true
        });
        for (let i = 1; i < points.length; i++) {
            var xya2 = SVGUtil.getXYA(points[i].x, points[i].y, svgEl);
            svgEl.body.createFixture(pl.Edge(Vec2(xya.x, xya.y), Vec2(xya2.x, xya2.y)), 0.0);
            xya = xya2;
        }
        svgEl.setAttribute('x', '0');
        svgEl.setAttribute('y', '0');
        return svgEl;
    }
    path(svgEl, world) {
        var d = svgEl.getAttribute('d');
        var path = this.parsePath(d);
        var xya = SVGUtil.getXYA(path.start.x, path.start.y, svgEl);
        svgEl.body = world.createBody({
            type: svgEl.dataset.type,
            allowSleep: true
        });
        for (let i = 0; i < path.segments.length; i++) {
            var segment = path.segments[i];
            var xya2 = SVGUtil.getXYA(segment.end.x, segment.end.y, svgEl);
            svgEl.body.createFixture(pl.Edge(Vec2(xya.x, xya.y), Vec2(xya2.x, xya2.y)), 0.0);
            xya = xya2;
        }
        svgEl.setAttribute('x', '0');
        svgEl.setAttribute('y', '0');
        return svgEl;
    }
    parsePath(d) {
        const segments = d.split(/[A-Za-z]/).filter(Boolean);
        return {
            start: {
                x: parseFloat(segments[0].split(',')[0]),
                y: parseFloat(segments[0].split(',')[1])
            },
            segments: segments.map(segment => {
                const [command, ...coords] = segment.split(',');
                return {
                    command,
                    coords: coords.map(coord => parseFloat(coord))
                };
            })
        };
    }

    lerp(x, y, a) {
        return Math.round(x * (1 - a) + y * a);
    }

    clamp(val, min = 0, max = 1) {
        return Math.max(min, Math.min(max, val));
    }

    next() {
        this.world.step(1 / 60);
        let awake = false,
            win = false;
        let p;
        const ready = this.time > this.activeLevel.minTime && this.time < this.activeLevel.maxTime;
        this.gameObjects.forEach(el => {
            if (this.player.body.isAwake()) {
                awake = true;
            }
            p = el.body.getPosition();
            if (el.body.isDynamic() && (p.y > this.containerHeight + 1 || p.y < -1 || p.x < -1 || p.x > this.containerWidth + 1)) {
                if (el === this.player) {
                    awake = false;
                    el.body.setAwake(false);
                    if (ready) {
                        win = true;
                    }
                } else if (this.isBuilding()) {
                    this.restore(el);
                }
            }
        });

        if (ready && this.isPlayingNotReady()) {
            try {
                this.readySound.play();
            } catch (error) { }
            this.mode = PLAYING_READY;
        } else if (!ready && this.isPlayingReady()) {
            this.mode = PLAYING;
        }

        this.updateUI();

        if (this.isPlaying()) {
            this.time += 1 / 60;
            if (!awake) {
                this.end(win);
            }
        }

        window.requestAnimationFrame(() => this.next());
    }

    isPlaying() {
        return this.mode === PLAYING || this.mode === PLAYING_READY;
    }

    isPlayingNotReady() {
        return this.mode === PLAYING;
    }

    isPlayingReady() {
        return this.mode === PLAYING_READY;
    }

    isEnd() {
        return this.isEndWin() || this.isEndLose();
    }

    isEndWin() {
        return this.mode === END_WIN;
    }

    isEndLose() {
        return this.mode === END_LOSE;
    }

    isPlayingOrEnd() {
        return this.isPlaying() || this.isEnd();
    }

    isBuilding() {
        return this.mode === BUILDING;
    }

    moveLevel(dir) {
        const n = this.level + dir;
        if (n >= 0 && n < this.levels.length && this.levels[n].unlocked) {
            this.level = n;
            this.loadLevel(this.level);
        }
    }

    removeNode(el) {
        this.activeLevel.removeChild(el);
        this.world.destroyBody(el.body);
        this.gameObjects.splice(this.gameObjects.indexOf(el), 1);
    }

    play() {
        this.time = 0;
        this.backupAll();
        this.player.body.setPosition(Vec2(this.containerWidth / 2, 0.2));
        this.player.body.setLinearVelocity(Vec2(0, 0));
        this.player.body.setAwake(true);
        this.mode = PLAYING;
    }

    backupAll() {
        this.gameObjects.forEach(el => {
            this.backup(el);
        });
    }

    backup(el) {
        const p = el.body.getPosition();
        el.backup = {
            pos: p.clone(),
            angle: el.body.getAngle()
        };
    }

    reset() {
        this.time = 0;
        this.restoreAll();
        this.mode = BUILDING;
    }

    restore(el) {
        if (el.backup) {
            el.body.setPosition(el.backup.pos.clone());
            el.body.setAngle(el.backup.angle);
            el.body.setLinearVelocity(Vec2(0, 0));
            el.body.setType(el.bodyType + '');
        }
    }

    restoreAll() {
        this.gameObjects.forEach(el => {
            this.restore(el);
        });
    }

    end(win) {
        this.mode = win ? END_WIN : END_LOSE;
        try {
            (win ? this.winSound : this.loseSound).play();
        } catch (error) { }
        setTimeout(() => {
            if (win) {
                this.level++;
                this.loadLevel(this.level);
            }
            if (!this.isBuilding()) {
                this.reset();
            }
        }, 3000);
    }

    startDrag(obj) {
        if (this.isBuilding() && obj.body.getType() !== 'static') {
            obj.body.setType('static');
            this.drag = new Drag({
                next: (dxy) => {
                    const pos = obj.body.getPosition();
                    obj.body.setPosition(Vec2(dxy.x + pos.x, dxy.y + pos.y));
                },
                done: () => {
                    obj.body.setType(obj.bodyType + '');
                    obj.body.setLinearVelocity(Vec2(0, 0));
                }
            });
        }
    }

    mouseMove(e) {
        if (this.drag) {
            var xy = e.changedTouches && e.changedTouches.length == 1 ?
                new XY(e.changedTouches[0].pageX, e.changedTouches[0].pageY) :
                new XY(e.screenX, e.screenY);
            this.drag.nextXY(this.svgUtil.getSVGXY(xy));
            e.preventDefault();
        }
    }

    endDrag(e) {
        if (this.drag) {
            this.drag.done();
            this.drag = undefined;
            e.stopPropagation();
            e.preventDefault();
        }
    }
}

window.customElements.define('marbles-game', Marbles);