import BaseComponent from "../core/base-component.js";
import Calendar from "../shared/calendar.js";
import Routes from "../Routes.js";

export default class BirthdaysCalendar extends BaseComponent {
    date = new Date();
    constructor() {
        super(/*html*/`
            <div style="display:flex;">
                <div>
                    <five-calendar data-name="calendar"></five-calendar>
                    <div data-name="loadingBanner">Loading events...</div>
                </div>
            </div>
        `);
    }
    connectedCallback() {
        this.calendar.addEventListener('monthChanged', e => {
            this.month = e.detail;
            this.fetchBirthdays();
        });
        this.fetchBirthdays();
        this.updateUI();
    }
    updateUI() {
        this.loadingBanner.style.display = this.loading ? 'block' : 'none';
    }
    async fetchBirthdays() {
        this.loading = true;
        this.updateUI();
        if (this.month !== undefined) {
            const monthStr = Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(this.date.getFullYear(), this.month));

            const search = new URLSearchParams({
                month: monthStr
            }).toString();
            const response = await fetch(Routes.birthdays.api.root + `?${search}`);
            if (response.status !== 200) {
                console.error('Failed to fetch birthdays');
                return;
            }
            const data = await response.json();
            this.calendar.addCalendarEvents(data.birthdays.map(b => ({
                month: b.month - 1,
                date: b.date,
                title: `${b.name}'s Birthday`,
                color: 'cornflowerblue'
            })));
        }
        this.loading = false;
        this.updateUI();
    }
}
customElements.define('birthdays-calendar', BirthdaysCalendar);