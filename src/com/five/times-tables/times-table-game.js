import BaseComponent from "../core/base-component.js";

const PICKING_NUMBER = 0, PICKING_MULTIPLIER = 1, FINDING_ANSWER = 2, ROUND_OVER = 4;
const MAX_TIME = 25;
const ONE_TO_TWELVE = new Array(12).fill(null, 0, 12).map((_, i) => i + 1);

const scoreMessages = [
  'Could do better!',
  'Not bad!',
  'Getting there!',
  'Great work!',
  'Nice one!',
  'Awesome!',
];
const goodEmojis = ['👍', '👏', '😊', '🥳', '🙌', '🎉', '🔥', '🌟', '👌', '🤩', '👑', '💯', '🌈', '🎊', '🤗', '👋', '🥇', '🎈', '👼'];
const whoopsEmojis = ['🤦', '🤷', '🤔', '🙄', '😬', '😅', '😂', '🤣', '😭', '😢', '😓', '😩', '😱', '😳', '😵', '😡', '🤬', '🤯', '🤢', '🤮'];

export default class TimesTableGame extends BaseComponent {
  static observedAttributes = [];
  gamestate = PICKING_NUMBER;
  timeLeft;

  currentNumber;
  currentMultiplier;
  wrongAnswers = [];
  correctAnswers = [];
  chosenNumbers = [];
  doneAnswers = [];
  score = 0;


  constructor() {
    super(/*html*/`
    <style>
      .container{
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1em;
      max-width: 550px;
      }
      .number-choice-panel {
      display: flex;
      flex-wrap: wrap;
      }
      .number-choice-panel button {
      margin: 5px;
      padding: 5px;
      font-size: 20px;
      }
      .game-area {
      display:flex;
      gap: 1em;
      }
      .card-area {
      display: flex;
      gap: 0.75em;
      flex-wrap: wrap;
      }
      .card {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: lightsalmon;
        border: 3px solid white;
        border-radius: 5px;
        padding: 5px;
        font-size: 20px;
        width:2em;
        height:4em;
        cursor: pointer;
        color: black;
      }
      .card.selected {
      background-color: lightgreen;
      }
      .card.face-down .number{
      visibility: hidden;
      }
      .card.wrong-answer, .answers .card.card.wrong-answer {
      background-color: lightcoral;
      color: darkred;
      }
      .answers .card {
      background-color: lightblue;
      }
      .time {
          display: flex;
          width: 80%;
          align-items: center;
          gap: 0.5em;
      }
      .time-left {
      font-size: 20px;
      }
      .progress {
      height: 20px;
      background-color: lightgreen;
      }
      .end-screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1em;
        font-size: 2em;
      }
      .end-screen button{
        padding:1em;
      }
      .emoji { 
      font-size: 2em;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: emojiAnimation 800ms forwards;
      }
      @keyframes emojiAnimation {
      0% {
        font-size: 2em;
        opacity: 1;
      }
      50% {
        font-size: 20em;
        opacity: 0.8;
      }
      99% {
        font-size: 36em;
        opacity: 0;
      }
      100% {
        font-size: 0em;
        opacity: 0;
      }
      }
      .score-banner {
        display: flex;
        justify-content: space-between;
        width: 100%;
        font-size: 0.9em;
        font-weight: bold;
        font-family: 'Courier New', Courier, monospace;
        color:lightskyblue;
      }

    </style>

      <div class="container">
        <div class="score-banner">
          <div>
            Game score:
            <span data-name="gameScoreEl"></span>
          </div>
          <div>
            Total score:
            <span data-name="totalScoreEl"></span>
          </div>
        </div>
      <h3 data-name="instructionEl"></h3>
      <template data-name="emojiTemplate">
        <div class="emoji">
          <span data-name="emojiValue" ></span>
        </div>
      </template>
      <div data-name="startScreenEl">
      <div data-name="choices">
      <div data-name="tables" class="number-choice-panel">
      </div>
      <template data-name="numberChoiceTemplate">
        <button class="number-choice"></button>
      </template>
      </div>
      </div>
      <div data-name="gameAreaEl" class="game-area">
      <div data-name="cardAreaEl" class="card-area"></div>
      <div data-name="answerAreaEl" class="card-area answers"></div>
      </div>
      <div data-name="timerEl" class="time">
      <div data-name="timeLeftEl" class="time-left"></div>
      <div data-name="progressEl" class="progress"></div>
      </div>
      <template data-name="numberCardTemplate">
      <button class="card"><span class="number"></span></button>
      </template>
      <div data-name="endScreenEl" class="end-screen">
      <div data-name="endGameScoreEl"></div>
      <button data-name="restartButton">Play again!</button>
      </div>
      </div>
    `);
  }
  connectedCallback() {
    super.connectedCallback();
    ONE_TO_TWELVE.forEach(i => {
      const button = this.numberChoiceTemplate.clone();
      button.textContent = i;
      button.onclick = () => this.startGame(i);
      this.tables.appendChild(button);
    })
    ONE_TO_TWELVE.sort(() => Math.random() - 0.5).forEach(i => {
      const card = this.numberCardTemplate.clone();
      card.querySelector('.number').textContent = i;
      card.dataset.number = i;
      card.onclick = () => this.startRound(i);
      this.cardAreaEl.appendChild(card);
    });
    this.restartButton.onclick = () => this.start();
    this.start();
    this.updateUI();
  }
  updateUI() {
    this.startScreenEl.style.display = this.gamestate === PICKING_NUMBER ? '' : 'none';
    this.gameAreaEl.style.display = this.gamestate === PICKING_MULTIPLIER || this.gamestate === FINDING_ANSWER ? '' : 'none';
    this.endScreenEl.style.display = this.gamestate === ROUND_OVER ? '' : 'none';
    this.instructionEl.innerText = this.instruction ?? '';
    if (this.emoji) {
      if (this.emojiEl) this.emojiEl.remove();
      this.emojiEl = this.emojiTemplate.clone({ emojiValue: this.emoji });
      this.gameAreaEl.appendChild(this.emojiEl);
      this.emoji = null;
    }
    this.tables.querySelectorAll('.number-choice').forEach((button, i) => {
      button.classList.toggle('selected', this.currentNumber === i + 1);
    });
    this.cardAreaEl.querySelectorAll('.card').forEach(card => {
      const m = +card.dataset.number;
      card.classList.toggle('selected', this.currentMultiplier == m);
      card.classList.toggle('face-down', this.currentMultiplier != m);
      card.style.visibility = this.chosenNumbers.includes(m) && this.currentMultiplier != m ? 'hidden' : '';
      card.disabled = this.gamestate != PICKING_MULTIPLIER;
    });
    this.answerAreaEl.innerHTML = '';
    if (this.answers) {
      this.answers.forEach(answer => {
        const card = this.numberCardTemplate.clone();
        card.classList.toggle('wrong-answer', this.wrongAnswers.includes(answer));
        card.classList.toggle('selected', this.correctAnswers.includes(answer));
        card.classList.toggle('face-down', this.gamestate === PICKING_MULTIPLIER || this.gamestate === ROUND_OVER);

        card.style.visibility = this.correctAnswers.includes(answer) && this.currentMultiplier * this.currentNumber != answer ? 'hidden' : '';
        card.disabled = this.gamestate != FINDING_ANSWER;
        card.querySelector('.number').textContent = answer;
        card.onclick = () => {
          this.checkAnswer(answer);
        };
        this.answerAreaEl.appendChild(card);
      });
    }
    this.updateTimerUI();
    this.endGameScoreEl.textContent = `Your score: ${this.gameScore}`;
    this.gameScoreEl.textContent = this.gamestate === FINDING_ANSWER || this.gamestate == PICKING_MULTIPLIER ? `${this.gameScore}` : '---';
    this.totalScoreEl.textContent = `${this.score}`;
  }
  updateTimerUI() {
    this.timerEl.style.display = this.gamestate === FINDING_ANSWER ? '' : 'none';
    this.timeLeftEl.textContent = this.timeLeft;
    this.progressEl.style.width = `${(this.timeLeft / MAX_TIME) * 100}%`;
  }
  startGame(n) {
    this.currentNumber = n;
    this.answers = ONE_TO_TWELVE.map((_, i) => this.currentNumber * (i + 1)).sort(() => Math.random() - 0.5);
    const randomWrongAnswers = ONE_TO_TWELVE.map(() => Math.floor(Math.random() * this.currentNumber * 12) + 1);
    this.answers = [...new Set(this.answers.concat(randomWrongAnswers))].sort(() => Math.random() - 0.5).slice();
    this.gamestate = PICKING_MULTIPLIER;
    this.instruction = 'Pick a red card';
    this.updateUI();
  }
  startRound(number) {
    this.instruction = `Quick! Find the answer to ${number} * ${this.currentNumber}`;
    this.currentMultiplier = number;
    this.chosenNumbers.push(number);
    this.timeLeft = MAX_TIME;
    this.gamestate = FINDING_ANSWER;
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft === 0) {
        this.endGame();
      }
      this.updateTimerUI();
    }, 1000);
    this.updateUI();
  }
  endGame() {
    clearInterval(this.timer);
    this.gamestate = ROUND_OVER;
    this.maxPossibleScore = 12 * 100 * this.currentMultiplier;
    console.log('score:', this.gameScore, 'max:', this.maxPossibleScore, 'message index:', Math.floor(this.gameScore / this.maxPossibleScore * scoreMessages.length));
    this.instruction = scoreMessages[Math.floor(this.gameScore / this.maxPossibleScore * scoreMessages.length)] ?? 'Incredible!';
    this.instruction += ` ${this.gameScore < this.maxPossibleScore / 2 ? whoopsEmojis[Math.floor(Math.random() * whoopsEmojis.length)] : goodEmojis[Math.floor(Math.random() * goodEmojis.length)]}`;
    this.score += this.gameScore;
    this.updateUI();
  }
  start() {
    this.setUpGame();
    this.gamestate = PICKING_NUMBER;
    this.instruction = 'Choose a number to practice your times tables.';
    this.updateUI();
  }
  setUpRound() {
    this.roundScore = 0;
    this.wrongAnswers = [];
    this.currentMultiplier = null;
    this.timeLeft = MAX_TIME;
  }
  setUpGame() {
    this.setUpRound();
    this.gameScore = 0;
    this.instruction = '';
    this.currentNumber = null;
    this.correctAnswers = [];
    this.chosenNumbers = [];
    this.doneAnswers = [];
  }
  checkAnswer(answer) {
    if (answer === this.currentNumber * this.currentMultiplier) {
      clearInterval(this.timer);
      this.roundScore = Math.floor(this.timeLeft / MAX_TIME * 100) * this.currentMultiplier;
      this.gameScore += this.roundScore;
      if (this.chosenNumbers.length === 12) {
        this.endGame();
      } else {
        this.emoji = goodEmojis[Math.floor(Math.random() * goodEmojis.length)];
        this.instruction = 'Well done! Pick another red card';
        this.correctAnswers.push(answer);
        this.setUpRound();
        this.gamestate = PICKING_MULTIPLIER;
        this.updateUI();
      }
    } else {
      this.emoji = whoopsEmojis[Math.floor(Math.random() * whoopsEmojis.length)];
      this.gameScore -= 5;
      this.wrongAnswers.push(answer);
      this.updateUI();
    }
  }
}
customElements.define('times-table-game', TimesTableGame);