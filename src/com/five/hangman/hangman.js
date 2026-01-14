import BaseComponent from "../core/base-component.js";

export default class HangMan extends BaseComponent {
    static observedAttributes = [];
    answer;
    clue;

    dictionaryAnimals = [
        { word: "AARDVARK", clue: ["🐜", "🦛"] },
        { word: "ANTELOPE", clue: ["🦌"] },
        { word: "BABOON", clue: ["🐒"] },
        { word: "BADGER", clue: ["🦡"] },
        { word: "BAT", clue: ["🦇"] },
        { word: "BEAR", clue: ["🐻"] },
        { word: "BEAVER", clue: ["🦫"] },
        { word: "BEE", clue: ["🐝"] },
        { word: "BIRD", clue: ["🐦"] },
        { word: "BUFFALO", clue: ["🐃"] },
        { word: "BUTTERFLY", clue: ["🦋"] },
        { word: "CAMEL", clue: ["🐪"] },
        { word: "CAT", clue: ["🐱"] },
        { word: "CHEETAH", clue: ["🐆"] },
        { word: "CHICKEN", clue: ["🐔"] },
        { word: "CHIMPANZEE", clue: ["🐒"] },
        { word: "COW", clue: ["🐄"] },
        { word: "CROCODILE", clue: ["🐊"] },
        { word: "DEER", clue: ["🦌"] },
        { word: "DOG", clue: ["🐶"] },
        { word: "DOLPHIN", clue: ["🐬"] },
        { word: "DUCK", clue: ["🦆"] },
        { word: "EAGLE", clue: ["🦅"] },
        { word: "ELEPHANT", clue: ["🐘"] },
        { word: "FISH", clue: ["🐟"] },
        { word: "FOX", clue: ["🦊"] },
        { word: "FROG", clue: ["🐸"] },
        { word: "GIRAFFE", clue: ["🦒"] },
        { word: "GOAT", clue: ["🐐"] },
        { word: "GORILLA", clue: ["🦍"] },
        { word: "HIPPOPOTAMUS", clue: ["🦛"] },
        { word: "HORSE", clue: ["🐎"] },
        { word: "KANGAROO", clue: ["🦘"] },
        { word: "KOALA", clue: ["🐨"] },
        { word: "LION", clue: ["🦁"] },
        { word: "LIZARD", clue: ["🦎"] },
        { word: "MONKEY", clue: ["🐒"] },
        { word: "MOUSE", clue: ["🐭"] },
        { word: "OCTOPUS", clue: ["🐙"] },
        { word: "OSTRICH", clue: ["🦩"] },
        { word: "OTTER", clue: ["🦦"] },
        { word: "OWL", clue: ["🦉"] },
        { word: "PANDA", clue: ["🐼"] },
        { word: "PARROT", clue: ["🦜"] },
        { word: "PENGUIN", clue: ["🐧"] },
        { word: "PIG", clue: ["🐷"] },
        { word: "RABBIT", clue: ["🐰"] },
        { word: "RACCOON", clue: ["🦝"] },
        { word: "RHINO", clue: ["🦏"] },
        { word: "SEAL", clue: ["🦭"] },
        { word: "SHARK", clue: ["🦈"] },
        { word: "SHEEP", clue: ["🐑"] },
        { word: "SNAKE", clue: ["🐍"] },
        { word: "SPIDER", clue: ["🕷️"] },
        { word: "SQUIRREL", clue: ["🐿️"] },
        { word: "TIGER", clue: ["🐅"] },
        { word: "TURTLE", clue: ["🐢"] },
        { word: "WHALE", clue: ["🐋"] },
        { word: "WOLF", clue: ["🐺"] },
        { word: "ZEBRA", clue: ["🦓"] }
    ];

    dictionaryCountries = [
        { word: "AFGHANISTAN", clue: ["🇦🇫"] },
        { word: "ARGENTINA", clue: ["🇦🇷"] },
        { word: "AUSTRALIA", clue: ["🇦🇺"] },
        { word: "BRAZIL", clue: ["🇧🇷"] },
        { word: "CANADA", clue: ["🇨🇦"] },
        { word: "CHINA", clue: ["🇨🇳"] },
        { word: "EGYPT", clue: ["🇪🇬"] },
        { word: "FRANCE", clue: ["🇫🇷"] },
        { word: "GERMANY", clue: ["🇩🇪"] },
        { word: "GREECE", clue: ["🇬🇷"] },
        { word: "INDIA", clue: ["🇮🇳"] },
        { word: "INDONESIA", clue: ["🇮🇩"] },
        { word: "IRAN", clue: ["🇮🇷"] },
        { word: "IRAQ", clue: ["🇮🇶"] },
        { word: "ITALY", clue: ["🇮🇹"] },
        { word: "JAPAN", clue: ["🇯🇵"] },
        { word: "MEXICO", clue: ["🇲🇽"] },
        { word: "NIGERIA", clue: ["🇳🇬"] },
        { word: "PAKISTAN", clue: ["🇵🇰"] },
        { word: "RUSSIA", clue: ["🇷🇺"] },
        { word: "SAUDI ARABIA", clue: ["🇸🇦"] },
        { word: "SOUTH AFRICA", clue: ["🇿🇦"] },
        { word: "SOUTH KOREA", clue: ["🇰🇷"] },
        { word: "SPAIN", clue: ["🇪🇸"] },
        { word: "SWEDEN", clue: ["🇸🇪"] },
        { word: "SWITZERLAND", clue: ["🇨🇭"] },
        { word: "THAILAND", clue: ["🇹🇭"] },
        { word: "TURKEY", clue: ["🇹🇷"] },
        { word: "UKRAINE", clue: ["🇺🇦"] },
        { word: "UNITED ARAB EMIRATES", clue: ["🇦🇪"] },
        { word: "UNITED KINGDOM", clue: ["🇬🇧"] },
        { word: "UNITED STATES", clue: ["🇺🇸"] },
        { word: "VENEZUELA", clue: ["🇻🇪"] },
        { word: "VIETNAM", clue: ["🇻🇳"] }
    ];

    dictionaryFruits = [
        { word: "APPLE", clue: ["🍎", "🍏"] },
        { word: "BANANA", clue: ["🍌"] },
        { word: "CHERRY", clue: ["🍒"] },
        { word: "DATE", clue: ["🌴"] },
        { word: "ELDERBERRY", clue: ["🍇"] },
        { word: "FIG", clue: ["🍈"] },
        { word: "GRAPE", clue: ["🍇"] },
        { word: "HONEYDEW", clue: ["🍈"] },
        { word: "JACKFRUIT", clue: ["🍈"] },
        { word: "KIWI", clue: ["🥝"] },
        { word: "LEMON", clue: ["🍋"] },
        { word: "MANGO", clue: ["🥭"] },
        { word: "NECTARINE", clue: ["🍑"] },
        { word: "ORANGE", clue: ["🍊"] },
        { word: "PAPAYA", clue: ["🥭"] },
        { word: "QUINCE", clue: ["🍐"] },
        { word: "RASPBERRY", clue: ["🍇"] },
        { word: "STRAWBERRY", clue: ["🍓"] },
        { word: "TANGERINE", clue: ["🍊"] },
        { word: "WATERMELON", clue: ["🍉"] }
    ];

    dictionaryColors = [
        { word: "AQUA", clue: ["💧"] },
        { word: "BEIGE", clue: ["🪶"] },
        { word: "CRIMSON", clue: ["❤️"] },
        { word: "DARKBLUE", clue: ["🌌"] },
        { word: "EMERALD", clue: ["💚"] },
        { word: "FUCHSIA", clue: ["💖"] },
        { word: "GOLD", clue: ["🏆"] },
        { word: "HONEYDEW", clue: ["🍈"] },
        { word: "INDIGO", clue: ["🌌"] },
        { word: "JADE", clue: ["🐉"] },
        { word: "KHAKI", clue: ["👕"] },
        { word: "LAVENDER", clue: ["💜"] },
        { word: "MAGENTA", clue: ["🌺"] },
        { word: "NAVY", clue: ["🚢"] },
        { word: "OLIVE", clue: ["🫒"] },
        { word: "PINK", clue: ["🌸"] },
        { word: "QUARTZ", clue: ["💎"] },
        { word: "RED", clue: ["❤️"] },
        { word: "SILVER", clue: ["🥈"] },
        { word: "TURQUOISE", clue: ["🌊"] },
        { word: "ULTRAMARINE", clue: ["🌌"] },
        { word: "VIOLET", clue: ["💜"] },
        { word: "WHITE", clue: ["⚪"] },
        { word: "YELLOW", clue: ["💛"] }
    ];

    dictionarySports = [
        { word: "ARCHERY", clue: ["🏹"] },
        { word: "BASEBALL", clue: ["⚾"] },
        { word: "BASKETBALL", clue: ["🏀"] },
        { word: "BOXING", clue: ["🥊"] },
        { word: "CRICKET", clue: ["🏏"] },
        { word: "CYCLING", clue: ["🚴‍♂️"] },
        { word: "DIVING", clue: ["🤿"] },
        { word: "FOOTBALL", clue: ["🏈"] },
        { word: "GOLF", clue: ["🏌️‍♂️"] },
        { word: "GYMNASTICS", clue: ["🤸‍♀️"] },
        { word: "HOCKEY", clue: ["🏒"] },
        { word: "JUDO", clue: ["🥋"] },
        { word: "KARATE", clue: ["🥋"] },
        { word: "LACROSSE", clue: ["🥍"] },
        { word: "MARTIALARTS", clue: ["🥋"] },
        { word: "NETBALL", clue: ["🥅"] },
        { word: "OLYMPICS", clue: ["🏅"] },
        { word: "POLO", clue: ["🏇"] },
        { word: "RUGBY", clue: ["🏉"] },
        { word: "SOCCER", clue: ["⚽"] },
        { word: "TENNIS", clue: ["🎾"] },
        { word: "VOLLEYBALL", clue: ["🏐"] },
        { word: "WRESTLING", clue: ["🤼‍♂️"] },
        { word: "YOGA", clue: ["🧘‍♀️"] }
    ];

    dictionaryFilms = [
        { word: "GOOD WILL HUNTING", clue: ["📝", "👨‍🏫"] },
        { word: "THE GODFATHER", clue: ["👨‍👦‍👦", "🔫"] },
        { word: "THE SHAWSHANK REDEMPTION", clue: ["🏢", "⛏️"] },
        { word: "THE DARK KNIGHT", clue: ["🦇", "🃏"] },
        { word: "PULP FICTION", clue: ["💼", "🍔"] },
        { word: "THE LORD OF THE RINGS", clue: ["💍", "🧙‍♂️"] },
        { word: "THE MATRIX", clue: ["🕶️", "💊"] },
        { word: "STAR WARS", clue: ["🌌", "🚀"] },
        { word: "THE TERMINATOR", clue: ["🤖", "🔫"] },
        { word: "THE LION KING", clue: ["🦁", "🌅"] },
        { word: "THE WIZARD OF OZ", clue: ["🌪️", "🦁"] },
        { word: "THE SOUND OF MUSIC", clue: ["🎶", "🗻"] },
        { word: "THE GRADUATE", clue: ["🎓", "🎸"] },
        { word: "THE EXORCIST", clue: ["👧", "😈"] },
        { word: "THE SHINING", clue: ["🪓", "🏨"] },
        { word: "THE SILENCE OF THE LAMBS", clue: ["🍽️", "🧠"] },
        { word: "THE BIG LEBOWSKI", clue: ["🎳", "🥃"] },
        { word: "THE BREAKFAST CLUB", clue: ["🍳", "🏫"] },
        { word: "THE PRINCESS BRIDE", clue: ["👸", "🤺"] },
        { word: "THE GOONIES", clue: ["💰", "👑"] },
        { word: "THE BLUES BROTHERS", clue: ["🎵", "🚗"] },
        { word: "THE ROCKY HORROR PICTURE SHOW", clue: ["🕺", "👩‍🎤"] },
        { word: "THE NIGHTMARE BEFORE CHRISTMAS", clue: ["🎃", "🎄"] },
        { word: "THE INCREDIBLES", clue: ["🦸‍♂️", "🦸‍♀️"] },
        { word: "THE AVENGERS", clue: ["🦸‍♂️", "🦸‍♀️"] },
        { word: "THE SHAPE OF WATER", clue: ["🐟", "❤️"] },
        { word: "THE IRISHMAN", clue: ["🕴️", "🔫"] },
        { word: "THE FAREWELL", clue: ["👵", "👋"] },
        { word: "THE IRON GIANT", clue: ["🤖", "🌳"] },
        { word: "THE LITTLE MERMAID", clue: ["🧜‍♀️", "🌊"] },
        { word: "THE JUNGLE BOOK", clue: ["🐻", "🐍"] }
    ];
    dictionaryKidsFilms = [
        { word: "ALADDIN", clue: ["🧞‍♂️", "🕌"] },
        { word: "THE LION KING", clue: ["🦁", "🌅"] },
        { word: "FROZEN", clue: ["❄️", "👑"] },
        { word: "TOY STORY", clue: ["🧸", "🚀"] },
        { word: "CINDERELLA", clue: ["👠", "🎃"] },
        { word: "MOANA", clue: ["🌊", "🚣‍♀️"] },
        { word: "FINDING NEMO", clue: ["🐠", "🔍"] },
        { word: "THE LITTLE MERMAID", clue: ["🧜‍♀️", "🌊"] },
        { word: "BEAUTY AND THE BEAST", clue: ["🌹", "👹"] },
        { word: "PETER PAN", clue: ["🧚‍♂️", "🗺️"] },
        { word: "THE JUNGLE BOOK", clue: ["🐻", "🐍"] },
        { word: "THE PRINCESS AND THE FROG", clue: ["👸", "🐸"] },
        { word: "TANGLED", clue: ["👸", "🎶"] },
        { word: "COCO", clue: ["🎸", "💀"] },
        { word: "MULAN", clue: ["👩‍🎤", "⚔️"] },
        { word: "THE INCREDIBLES", clue: ["🦸‍♂️", "🦸‍♀️"] },
        { word: "FINDING DORY", clue: ["🐠", "🔍"] },
        { word: "THE SECRET LIFE OF PETS", clue: ["🐶", "🐱"] },
        { word: "CARS", clue: ["🚗", "🏎️"] },
        { word: "UP", clue: ["🎈", "🏠"] }
    ];
    dictionaries = {
        'Animal': this.dictionaryAnimals,
        'Country': this.dictionaryCountries,
        'Fruit': this.dictionaryFruits,
        'Color': this.dictionaryColors,
        'Sport': this.dictionarySports,
        'Film': this.dictionaryFilms,
        'Kids film': this.dictionaryKidsFilms
    }
    theme = 'Kids film';
    guessedLetters = [];
    guessedWords = [];
    maxGuesses = 10;
    win = false;
    lose = false;

    constructor() {
        super(/*html*/`
            <style>
                .hangman-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1em;
                    padding: 1.25em;
                    width:fit-content;
                    align-items: center;
                    background: rgba(0, 0, 0, 0.23);
                }
                .answer {
                    display: flex;
                    gap: 1em;
                    flex-wrap: wrap;
                }
                .word{
                    display: flex;
                    gap: 0.2em;
                    margin:1.5em 0;
                }
                .letter {
                    border-bottom: 2px solid white;
                    width: 1em;
                    height: 25px;
                    text-align: center;
                    padding: 0.25em;
                }
                .guess {
                    text-transform: uppercase;
                    font-size: 1.2em;
                    font-weight: bold;
                    padding: 0.25em;
                    background-color: black;
                    width: 1em;
                    text-align: center;
                    min-height: 1em;
                }
                .incorrect {
                    background-color: #800000;
                }
                
                .guess-container {
                    display: flex;
                    gap: 0.25em;
                }
                .clue {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5em;
                    font-size: 0.9em;
                    align-items: center;
                }
                .clue-text {
                    font-size: 1.1em;
                    font-weight: bold;
                }
                .emoji-clue {
                    font-size: 2.5em;
                }
                .theme-change {
                    margin-top: 3em;
                    display: flex;
                    flex-direction: column;
                    gap:0.5em;
                    padding: 0.5em;
                    border-top: 1px solid black;
                    width:100%;
                }
                .play-again button{
                    font-size: 1.2em;
                }
            </style>
            <div class="hangman-container">
                <div class="clue">
                    <div><span class="emoji-clue" data-name="emojiClueEl"></span></div>
                    <div><span class="clue-text" data-name="themeTitleEl"></span></div>    
                </div>
                <div class="answer" data-name="answerContainer"></div>
                <template data-name="wordTemplate">
                    <div class="word"></div>
                </template>
                <template data-name="letterTemplate">
                    <div class="letter"></div>
                </template>
                <div>
                    <input data-name="guessInput" placeholder="Type a letter or word" type="text" size="15">
                    <button class="bg green" data-name="guessButton">Guess</button>
                </div>
                <div>
                    <div data-name="guessesEl" class="guess-container"></div>
                    <template data-name="guessTemplate"><div class="guess"></div></template>
                </div>
                <div data-name="statusEl"></div>
                <div data-name="playAgainEl" class="play-again">
                    <button class="bg green" data-name="playAgainButton">Play again!</button>
                </div>
                <div class="theme-change">
                    <div>Change theme</div>
                    <div>
                        <select data-name="themeSelect"></select>
                    </div>
                </div>
            </div>
        `);
    }

    connectedCallback() {
        super.connectedCallback();

        this.guessButton.onclick = () => {
            this.processGuess(this.guessInput.value?.toUpperCase());
            this.guessInput.value = '';
            this.guessInput.focus();
        }

        this.playAgainButton.onclick = () => {
            this.startGame();
        }

        this.themeSelect.innerHTML = Object.keys(this.dictionaries).map(key => `<option value="${key}">${key}</option>`).join('');
        this.themeSelect.value = 'Animal';

        this.themeSelect.onchange = () => {
            this.theme = this.themeSelect.value;
            this.startGame();
        }

        for (let i = 0; i < this.maxGuesses; i++) {
            const guessEl = this.guessTemplate.clone();
            this.guessesEl.appendChild(guessEl);
        }

        this.guessInput.onkeydown = e => {
            if (e.key === 'Enter') {
                this.processGuess(this.guessInput.value?.toUpperCase());
                this.guessInput.value = '';
                this.guessInput.focus();
            }
        }
        this.guessInput.focus();

        this.startGame();
    }

    updateUI() {

        this.answerContainer.innerHTML = '';

        const answerWords = this.answer.split(' ');
        answerWords.forEach((word, i) => {
            const wordEl = this.wordTemplate.clone();
            this.answerContainer.appendChild(wordEl);
            const letters = word.split('');
            letters.forEach(letter => {
                const letterEl = this.letterTemplate.clone();
                letterEl.innerText = this.win || this.lose || this.guessedWords.includes(word) || this.guessedLetters.includes(letter) ? letter : '';
                wordEl.appendChild(letterEl);
            });

        });

        const incorrectGuesses = this.incorrectLetters.concat(this.incorrectWords);
        this.guessesEl.childNodes.forEach((guessEl, index) => {
            guessEl.innerText = incorrectGuesses[index] || '';
            guessEl.classList.toggle('incorrect', !!incorrectGuesses[index]);
        });

        const remainingGuesses = this.maxGuesses - incorrectGuesses.length;
        this.statusEl.innerText = this.win ? 'You win!' : this.lose ? `You lose! The word was "${this.answer}".` : ``;
        const isGameOver = this.win || this.lose || remainingGuesses <= 0;

        this.guessButton.disabled = isGameOver;
        this.guessInput.disabled = isGameOver;
        this.themeTitleEl.innerText = this.theme;
        this.themeSelect.value = this.theme;
        this.emojiClueEl.innerText = this.clue.join(' ');
        this.playAgainEl.style.display = isGameOver ? 'block' : 'none';
    }

    startGame() {
        this.dictionary = this.dictionaries[this.theme];
        const selectedEntry = this.dictionary[Math.floor(Math.random() * this.dictionary.length)];
        this.answer = selectedEntry.word;
        this.clue = selectedEntry.clue;
        this.win = false;
        this.lose = false;
        this.guessedLetters = [];
        this.guessedWords = [];
        this.incorrectLetters = [];
        this.incorrectWords = [];
        this.updateUI();
    }

    processGuess(guess) {
        if (guess.length === 1) {
            this.guessLetter(guess);
        } else {
            const guessWords = guess.split(' ');
            guessWords.forEach(guess => {
                this.guessWord(guess);
            })
        }
    }


    guessLetter(letter) {
        //check for alphabet character
        if (!/^[A-Z]$/.test(letter)) return;
        if (this.guessedLetters.includes(letter) || this.win || this.lose) return;
        this.guessedLetters.push(letter);
        if (!this.answer.includes(letter)) {
            this.incorrectLetters.push(letter);
        }
        this.checkGameStatus();
        this.updateUI();
    }

    guessWord(word) {
        if (this.guessedWords.includes(word) || this.win || this.lose) return;
        this.guessedWords.push(word);
        this.answer.split(' ').forEach(answerWord => {
            if (!answerWord === word) {
                this.incorrectWords.push(word);
            } else {
                word.split('').forEach(letter => {
                    this.guessLetter(letter);
                });
            }
        });
        this.checkGameStatus();
        this.updateUI();
    }

    checkGameStatus() {
        const guessedAllLetters = this.answer.replace(' ', '').split('').every(letter => this.guessedLetters.includes(letter));
        const guessedAllWords = this.answer.split(' ').every(word => this.guessedWords.includes(word));

        if (guessedAllLetters || guessedAllWords) {
            this.win = true;
        } else if (this.incorrectLetters.length + this.incorrectWords.length >= this.maxGuesses) {
            this.lose = true;
        }
    }
}

customElements.define('hangman-game', HangMan);
