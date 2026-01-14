
if (!window.contextPath) {
    var contextPath = '';
    try {
        const api = await import('/five/api');
        contextPath = api.contextPath;
    } catch (error) {
        console.error(error);
    }
}

export default class BaseComponent extends HTMLElement {


    attrListeners = {};

    constructor(templateContent) {
        super();
        if (templateContent) {
            this.templateContent = /*html*/`
                <link rel="stylesheet" href="${contextPath}/style.css" />
                <link rel="stylesheet" href="${contextPath}/icons.css" />
                ${templateContent}
            `;
            this.attachShadow({ mode: "open" });
            this.root = this.shadowRoot;
            this.shadowRoot.innerHTML = this.templateContent;
        } else {
            this.root = this;
        }
        const namedElements = this.root.querySelectorAll('[data-name]');
        namedElements.forEach(el => {
            this[el.dataset.name] = el;
            if (el.tagName === 'TEMPLATE') {
                el.clone = (data, formatters) => BaseComponent.cloneTemplate(el, data, formatters);
            }
        });
    }

    connectedCallback() {
        if (this.loaded) {
            setTimeout(() => {
                this.loaded();
            }, 500);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this.attrListeners[name]) {
            this.attrListeners[name].forEach(listener => listener(newValue));
        }
    }

    addAttributeChangeListener(name, fn) {
        const list = this.attrListeners[name];
        if (!list) {
            this.attrListeners[name] = [fn];
        } else {
            list.push(fn);
        }
    }

    fireEvent(eventName, value) {
        this.dispatchEvent(new CustomEvent(eventName, { detail: value, bubbles: true }));
    }

    static cloneTemplate(template, data, formatters) {
        const el = template.content.cloneNode(true).firstElementChild;
        const slots = el.querySelectorAll('[data-name]');
        slots.forEach(s => {
            el[s.dataset.name] = s;
            if (data?.hasOwnProperty(s.dataset.name)) {
                let val = data[s.dataset.name];
                if (formatters && formatters[s.dataset.name]) {
                    val = formatters[s.dataset.name](val);
                }
                s.append(val);
            }
        });
        return el;
    }
}
