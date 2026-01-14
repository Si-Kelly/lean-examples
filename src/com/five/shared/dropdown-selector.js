import BaseComponent from "../core/base-component.js";

export default class DropdownSelector extends BaseComponent {
    static observedAttributes = ['selected'];
    options = [];
    selectedIndex;
    constructor() {
        super(/*html*/`
            <style>
                .options {
                    display: flex;
                    flex-direction:column;
                    position: absolute;
                    z-index: 1;
                    width: 200px;
                    max-height: 400px;
                    overflow-y:auto;
                }
                button.option{
                    display: block;
                    width: 100%;
                    padding: 0.5em;
                    border: none;
                    text-align: left;
                }
                .option:focus {
                    background-color: lightslategray;
                    color: white;
                }
                .dropdown-button {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5em;
                    gap:0.25em;
                }
            </style>
            <button class="not-button dropdown-button" data-name="expandButton">
                <div data-name="selectedLabelEl"></div>
                <div class="icon">
                    <five-icon key="expand"></five-icon>
                </div>
            </button>
            <div class="popup options" data-name="optionsContainer" role="combobox">
                <template data-name="optionTemplate">
                    <button class="option" role="option"><span data-name="label"></span></button>
                </template>
            </div>
        `);
        this.addAttributeChangeListener('selected', value => {
            this.selected = options.find(o => o.value === value);
            this.updateUI();
        });
    }
    connectedCallback() {
        this.expandButton.addEventListener('click', e => {
            this.showDropdown();
        });
        this.updateUI();
        this.clickedOutside = e => {
            const cp = e.composedPath();
            if (cp.includes(this.expandButton)) return;
            if (cp.includes(this.optionsContainer)) return;
            this.expanded = false;
            this.updateUI();
        }
        document.addEventListener('click', this.clickedOutside);

        this.addEventListener('keydown', e => {
            if (this.expanded) {
                if (e.key === 'Escape') {
                    this.expanded = false;
                    this.updateUI();
                }
                else if (e.key == 'ArrowDown') {
                    if (!this.expanded) {
                        this.expanded = true;
                    } else {
                        this.selectedIndex = this.clamp(this.selectedIndex + 1, 0, this.options.length - 1);
                    }
                    this.updateUI();
                }
                else if (e.key == 'ArrowUp' && this.expanded) {
                    this.selectedIndex = this.clamp(this.selectedIndex - 1, 0, this.options.length - 1);
                    this.updateUI();
                }
                else if ((e.key == 'Enter' || e.key == ' ') && this.selectedIndex != undefined) {
                    this.selected = this.options[this.selectedIndex];
                    this.expanded = false;
                    this.updateUI();
                    this.fireEvent('selected', this.selected.value);
                }
            } else if (e.key == 'ArrowDown') {
                this.showDropdown();
            }
        });

    }
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    disconnectedCallback() {
        document.removeEventListener('click', this.clickedOutside);
    }
    updateUI() {
        this.selectedLabelEl.innerText = this.selected?.label ?? '';
        this.optionsContainer.style.display = this.expanded ? '' : 'none';
        this.optionsContainer.setAttribute('aria-expanded', this.expanded);
        this.optionsContainer.innerHTML = '';
        this.options.forEach(o => {
            const el = this.optionTemplate.clone(o);
            el.innerText = o.label;
            el.addEventListener('click', e => {
                this.selected = o;
                this.expanded = false;
                this.updateUI();
                this.fireEvent('selected', o.value);
            });
            el.classList.toggle('selected', o === this.selected);
            el.setAttribute('aria-selected', o === this.selected);
            this.optionsContainer.appendChild(el);
            if (this.selectedIndex != undefined && o === this.options[this.selectedIndex]) {
                el.focus();
            }
        });
    }
    setOptions(options) {
        this.options = options;
        this.updateUI();
    }
    setSelectedValue(value) {
        this.selected = this.options.find(o => o.value === value);
        this.updateUI();
    }
    showDropdown() {
        this.expanded = true;
        this.selectedIndex = this.options.indexOf(this.selected);
        this.updateUI();
    }
}
customElements.define('five-dropdown-selector', DropdownSelector);