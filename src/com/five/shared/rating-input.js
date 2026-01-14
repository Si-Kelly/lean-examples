import BaseComponent from "../core/base-component.js";
import Icons from "../core/icons.js";

export default class RatingInput extends BaseComponent {
    static observedAttributes = ['value', 'readonly'];
    rating = 0;
    readonly = false;
    constructor() {
        super(/*html*/`
            <style>
            </style>
            <div>
                <button class="not-button"><five-icon></five-icon></button>
                <button class="not-button"><five-icon></five-icon></button>
                <button class="not-button"><five-icon></five-icon></button>
                <button class="not-button"><five-icon></five-icon></button>
                <button class="not-button"><five-icon></five-icon></button>
            </div>
            `);
        this.addAttributeChangeListener('readonly', value => {
            this.readonly = value;
            this.updateUI();
        });
    }
    connectedCallback() {
        this.root.querySelectorAll('button').forEach((button, i) => {
            button.addEventListener('click', () => {
                if (this.readonly) return;

                if (i == 0 && this.rating == 1) {
                    this.rating = 0;
                } else {
                    this.rating = i + 1;
                }
                this.dispatchEvent(new CustomEvent('ratingChanged', { detail: this.rating }));
                this.updateUI();
            });
        });
        this.updateUI();
    }
    updateUI() {
        this.root.querySelectorAll('button').forEach((button, i) => {
            button.disabled = this.readonly;
            button.querySelector('five-icon').setIcon(i + 1 > this.rating ? Icons.ratingStarEmpty : Icons.ratingStarFilled);
        });
    }
    get value() {
        return this.rating;
    }
    setValue(value) {
        this.rating = value;
        this.updateUI();
    }
}
customElements.define('five-rating', RatingInput);