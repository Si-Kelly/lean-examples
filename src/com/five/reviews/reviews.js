import BaseComponent from '../core/base-component.js';
import ReviewEditor from './review-editor.js';
import ReviewList from './review-list.js';


export default class Reviews extends BaseComponent {
    reviews = [
        { rating: 3, content: 'Great product', name: 'John Doe' },
        { rating: 5, content: 'I love it', name: 'Jane Doe' },
        { rating: 4, content: 'Pretty good', name: 'Jim Doe' },
        { rating: 2, content: 'Not bad', name: 'Jill Doe' },
        { rating: 1, content: 'Terrible', name: 'Jack Doe' }
    ];
    reviewSubmitted = false;

    constructor() {
        super(/*html*/`
             <style>
                .reviews-example {
                    display: flex;
                    flex-direction: column;
                    gap: 1em;
                    width:100%;
                    max-width:400px;
                }
                .editor{
                    margin-bottom: 2em;
                }
             </style>
            <div class="reviews-example">
                <div class="editor">
                    <review-editor data-name="editor"></review-editor>
                    <div data-name="doneMessage">
                        <p>Thank you for your review!</p>
                    </div>
                </div>
                <div class="reviews">
                    <review-list data-name="list"></review-list>
                </div>
            </div>
        `);
    }
    connectedCallback() {
        super.connectedCallback();
        this.editor.addEventListener('reviewAdded', e => {
            this.reviews.push(e.detail);
            this.reviewSubmitted = true;
            this.updateUI();
        });
        this.updateUI();
    }
    updateUI() {
        this.editor.style.display = this.reviewSubmitted ? 'none' : '';
        this.doneMessage.style.display = this.reviewSubmitted ? '' : 'none';
        this.list.setReviews(this.reviews.slice().reverse());

    }
}
customElements.define('reviews-example', Reviews);