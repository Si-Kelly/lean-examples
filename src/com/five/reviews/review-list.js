import BaseComponent from "../core/base-component.js";
import fiveRating from "../shared/rating-input.js";

export default class ReviewList extends BaseComponent {
    static observedAttributes = ['reviews'];
    constructor() {
        super(/*html*/`
            <style>
                .review-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5em;
                }
                .review {
                    padding-top: 0.5em; 
                    display: flex;
                    flex-direction:column;
                    gap: 0.5em;
                    margin-bottom: 1em;
                    border-left: 1px solid #3e5471;
                    background-color: #272727;
                    padding: 0.5em;
                }
                .review-header {
                    display: flex;
                    justify-content: space-between;
                }
            </style>
            <div class="review-list" data-name="reviewList"></div>
            <template data-name="reviewTemplate">
                <div class="review">
                    <div class="review-header">
                        <span><five-rating readonly="true"></five-rating></span><span>Reviewed by <span data-name="name"></span></span> 
                    </div>
                    <div data-name="content"></div>
                    <div></div>
                </div>
            </template>
        `);
        this.addAttributeChangeListener('reviews', reviews => {
            this.updateUI();
        });
    }
    updateUI() {
        this.reviewList.innerHTML = '';
        this.reviews.forEach(review => {
            const clone = this.reviewTemplate.clone(review);
            this.reviewList.appendChild(clone);
            clone.querySelector('five-rating').setValue(review.rating);
        });
    }
    setReviews(reviews) {
        this.reviews = reviews;
        this.updateUI();
    }
}
customElements.define('review-list', ReviewList);