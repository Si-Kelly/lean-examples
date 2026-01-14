import BaseComponent from '../core/base-component.js';
import RatingInput from '../shared/rating-input.js';

export default class ReviewEditor extends BaseComponent {
    rating = 0;
    content = '';
    name = '';

    constructor() {
        super(/*html*/`
            <style>
                .review-form {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75em;
                }
            </style>
            <div class="review-editor-container">
                <div data-name="reviewForm" class="review-form">
                    <label for="rating">Your review</label>
                    <five-rating id="rating" data-name="ratingInput" required></five-rating>       
                    <textarea id="content" placeholder="Comments" data-name="contentInput" cols="75" required></textarea>
    
                    <label for="name">Your name</label>
                    <input id="name" data-name="nameInput" type="text" required />
                    <div>
                        <button data-name="saveButton">Submit review</button>
                    </div>
                </div>

            </div>
        `);
    }
    connectedCallback() {
        super.connectedCallback();
        this.saveButton.addEventListener('click', () => {
            this.content = this.contentInput.value;
            this.name = this.nameInput.value;
            this.rating = this.ratingInput.value;
            this.submitReview();
        });
        this.updateUI();
    }
    updateUI() {
        this.ratingInput.setValue(this.rating);
        this.contentInput.value = this.content;
        this.nameInput.value = this.name;
    }
    submitReview() {
        this.fireEvent('reviewAdded', { rating: this.rating, content: this.content, name: this.name });
        this.clear();
        this.updateUI();
    }
    clear() {
        this.rating = 0;
        this.content = '';
        this.name = '';
        this.updateUI();
    }
}
customElements.define('review-editor', ReviewEditor);