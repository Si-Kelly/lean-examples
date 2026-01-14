class MarblesGame {
    constructor() {
        this.pl = planck;
        this.Vec2 = planck.Vec2;
        this.RADIANS_TO_DEGREES = 57.2958;

        this.WAITING = 0;
        this.BUILDING = 1;
        this.PLAYING = 2;
        this.PLAYING_READY = 3;
        this.END_WIN = 4;
        this.END_LOSE = 5;

        this.collisionThreshold = 0.1;

        this.gameObjects = [];

        this.world = null;
        this.svg = null;
        this.svgUtil = null;
        this.containerWidth = 0;
        this.containerHeight = 0;
        this.activeLevel = null;
        this.player = null;
        this.levels = null;
        this.levelEl = null;
        this.progressEls = null;
        this.startButtonEl = null;
        this.resetButtonEl = null;
        this.bounceSound = null;
        this.winSound = null;
        this.readySound = null;
        this.loseSound = null;
        this.drag = null;

        this.mode = this.WAITING;
        this.level = 0;

        window.addEventListener('load', () => {
            this.svg = document.getElementsByTagName('svg')[0];
            this.svgUtil = new SVGUtil(this.svg);
            const viewbox = this.svgUtil.viewbox();
            this.containerWidth = viewbox[2];
            this.containerHeight = viewbox[3];

            this.world = new this.pl.World(this.pl.Vec2(0, 10), {
                sleep: true
            });
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
                    let approachVelocity = this.Vec2.dot(vB.sub(vA), worldManifold.normal);
                    if (approachVelocity > this.collisionThreshold) {
                        const rate = this.lerp(1, 16, Math.random());
                        this.bounceSound.playbackRate = rate;
                        this.bounceSound.volume = this.clamp(approachVelocity / 3, 0, 1);
                        try {
                            this.bounceSound.play();
                        } catch (error) {}
                    }
                }
            });

            this.startButtonEl = document.getElementById('start');
            this.resetButtonEl = document.getElementById('reset');
            this.levelEl = document.getElementById('level');
            this.progressEls = Array.from(document.getElementById('progress').getElementsByTagName('rect'));
            this.player = document.getElementById('player');
            this.bounceSound = document.getElementById('bounce-wav');
            this.winSound = document.getElementById('win-wav');
            this.loseSound = document.getElementById('lose-wav');
            this.readySound = document.getElementById('ready-wav');
            this.levelContainerEl = document.getElementById('level-container');
            this.nextEl = document.getElementById('next');
            this.prevEl = document.getElementById('back');

            this.levels = Array.from(this.svg.getElementsByClassName('level'));
            this.levels.forEach(l => l.unlocked = false);

            this.loadLevel(this.level);
            this.time = 0;
            this.next();
        });
    }

    loadLevel(levelNumber) {
        if (this.activeLevel) {
            this.unloadActiveLevel();
        }
        const level = this.levels[levelNumber];
        if (!level.loaded) {
            level.circles = level.getElementsByTagName('circle');
            level.rects = level.getElementsByTagName('rect');
            level.lines = level.getElementsByTagName('line');
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
        this.gameObjects.forEach(svgEl => {
            svgEl.body.userData = svgEl;
            svgEl.bodyType = svgEl.body.getType();
            if (!level.loaded) {
                svgEl.onmousedown = (e) => this.startDrag(svgEl);
                svgEl.ontouchstart = (e) => this.startDrag(svgEl);
            }
            this.backup(svgEl);
        });
        level.loaded = true;
        level.unlocked = true;
        this.activeLevel = level;
        this.activeLevel.classList.toggle('active');
        this.mode = this.BUILDING;
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
            position: this.Vec2(xya.x, xya.y),
            angle: xya.a / this.RADIANS_TO_DEGREES
        });
        svgEl.body.createFixture(this.pl.Circle(this.Vec2(0, 0), svgEl.r.baseVal.value), {
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
            position: this.Vec2(xya.x, xya.y),
            angle: xya.a / this.RADIANS_TO_DEGREES
        });
        svgEl.body.createFixture(this.pl.Box(width / 2, height / 2, this.Vec2(width / 2, height / 2)), {
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
        svgEl.body.createFixture(this.pl.Edge(this.Vec2(xya1.x, xya1.y), this.Vec2(xya2.x, xya2.y)), 0.0);
        svgEl.setAttribute('x', '0');
        svgEl.setAttribute('y', '0');
        return svgEl;
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
        const max = this.progressEls.length;
        const ready = this.time > this.activeLevel.minTime && this.time < this.activeLevel.maxTime;
        if (ready && this.isPlayingNotReady()) {
            try {
                this.readySound.play();
            } catch (error) {}
            this.mode = this.PLAYING_READY;
        } else if (!ready && this.isPlayingReady()) {
            this.mode = this.PLAYING;
        }
        const progress = this.lerp(0, max, this.time / this.activeLevel.maxTime);
        const min = this.lerp(0, max, this.activeLevel.minTime / this.activeLevel.maxTime);

        this.progressEls.forEach((el, i) => {
            el.classList.toggle('red', i < min);
            el.classList.toggle('green', i >= min);
            el.classList.toggle('active', i == progress);
        });

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
            el.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ') rotate(' + el.body.getAngle() * this.RADIANS_TO_DEGREES + ') ');
            el.classList.toggle('static', el.body.isStatic());
            el.classList.toggle('dynamic', el.body.isDynamic());
            el.classList.toggle('kinematic', el.body.isKinematic());
        });

        this.player.style.display = this.isPlayingOrEnd() ? '' : 'none';
        this.startButtonEl.style.display = this.isBuilding() ? '' : 'none';
        this.prevEl.style.display = this.level > 0 ? '' : 'none';
        this.nextEl.style.display = this.level < this.levels.length - 1 && this.levels[this.level + 1].unlocked ? '' : 'none';
        this.levelEl.innerText = '' + (this.level + 1);
        this.levelContainerEl.style.display = this.levels.reduce((agg, value) => value.unlocked ? ++agg : agg, 0) > 1 ? '' : 'none';
        this.resetButtonEl.style.display = this.isPlayingOrEnd() ? '' : 'none';
        document.body.classList.toggle('win', this.isEndWin());
        document.body.classList.toggle('lose', this.isEndLose());
        document.body.classList.toggle('build', this.isBuilding());
        document.body.classList.toggle('ready', this.isPlayingReady());

        if (this.isPlaying()) {
            this.time += 1 / 60;
            if (!awake) {
                this.end(win);
            }
        }

        window.requestAnimationFrame(() => this.next());
    }

    isPlaying() {
        return this.mode === this.PLAYING || this.mode === this.PLAYING_READY;
    }

    isPlayingNotReady() {
        return this.mode === this.PLAYING;
    }

    isPlayingReady() {
        return this.mode === this.PLAYING_READY;
    }

    isEnd() {
        return this.isEndWin() || this.isEndLose();
    }

    isEndWin() {
        return this.mode === this.END_WIN;
    }

    isEndLose() {
        return this.mode === this.END_LOSE;
    }

    isPlayingOrEnd() {
        return this.isPlaying() || this.isEnd();
    }

    isBuilding() {
        return this.mode === this.BUILDING;
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
        this.player.body.setPosition(this.Vec2(this.containerWidth / 2, 0.2));
        this.player.body.setLinearVelocity(this.Vec2(0, 0));
        this.player.body.setAwake(true);
        this.mode = this.PLAYING;
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
        this.mode = this.BUILDING;
    }

    restore(el) {
        if (el.backup) {
            el.body.setPosition(el.backup.pos.clone());
            el.body.setAngle(el.backup.angle);
            el.body.setLinearVelocity(this.Vec2(0, 0));
            el.body.setType(el.bodyType + '');
        }
    }

    restoreAll() {
        this.gameObjects.forEach(el => {
            this.restore(el);
        });
    }

    end(win) {
        this.mode = win ? this.END_WIN : this.END_LOSE;
        try {
            (win ? this.winSound : this.loseSound).play();
        } catch (error) {}
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
                    obj.body.setPosition(this.Vec2(dxy.x + pos.x, dxy.y + pos.y));
                },
                done: () => {
                    obj.body.setType(obj.bodyType + '');
                    obj.body.setLinearVelocity(this.Vec2(0, 0));
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

class SVGUtil {
    constructor(svgEl) {
        this.svgEl = svgEl;
        this.svgPoint = this.svgEl.createSVGPoint();
        this.inverseCTM = this.svgEl.getCTM().inverse();
    }
    viewbox() {
        return this.svgEl.getAttribute('viewBox').split(' ').map(x => parseFloat(x))
    }
    getSVGXY(xy) {
        if (!this.svgPoint) {
            return new XY(0, 0);
        }
        this.svgPoint.x = xy.x;
        this.svgPoint.y = xy.y;
        return new XY(this.svgPoint.matrixTransform(this.inverseCTM).x, this.svgPoint.matrixTransform(this.inverseCTM).y);
    }
    static getXYA(x, y, el) {
        if (el.transform.baseVal.length == 0) {
            return new XYA(x, y, 0);
        }
        var transforms = el.transform.baseVal;
        var a;

        for (var transform of transforms) {
            if (transform.type == SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                x = transform.matrix.e + x;
                y = transform.matrix.f + y;
            }
            if (transform.type == SVGTransform.SVG_TRANSFORM_ROTATE) {
                a = transform.angle;
            }
        }
        return new XYA(x, y, a);
    }
}

class XY {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    diff(xy) {
        return new XY(this.x - xy.x, this.y - xy.y);
    }
    eq(xy) {
        return xy.x === this.x && xy.y === this.y;
    }
}

class XYA {
    constructor(x, y, a) {
        this.x = x;
        this.y = y;
        this.a = a;
    }
}

class Drag {
    constructor(events) {
        this.events = events;
        this.hasMoved = false;
    }
    done() {
        this.events.done(this.totalDXY);
    }
    nextXY(xy) {
        if (!this.firstXY) {
            this.firstXY = xy;
        }
        this.lastXY = this.thisXY;
        this.thisXY = xy;
        if (!this.firstXY.eq(this.thisXY)) {
            this.hasMoved = true;
        }
        this.events.next(this.dxy, this.thisXY);
    }
    get dxy() {
        if (this.thisXY && this.lastXY) {
            return this.thisXY.diff(this.lastXY);
        }
        return new XY(0, 0);
    }
    get totalDXY() {
        if (this.thisXY && this.firstXY) {
            return this.thisXY.diff(this.firstXY);
        }
        return new XY(0, 0);
    }
}