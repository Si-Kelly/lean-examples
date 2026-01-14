import BaseComponent from "../core/base-component.js";
import IconComponent from "./icon-component.js";
import DropdownSelector from "./dropdown-selector.js";

export default class Calendar extends BaseComponent {
    selectedDate;
    selectedYear = new Date().getFullYear();
    selectedMonth = new Date().getMonth();

    constructor() {
        super(/*html*/`
            <style>
                .calendar {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5em;
                }
                .calendar .dates, .calendar .days-header {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                }
                .day {
                    padding: 0.25em;
                    text-align: center;
                    position: relative;
                    font-size: 0.75em;
                    font-weight:600;
                }
                .date-cell {
                    border-bottom: 2px solid transparent;
                }
                .date-cell button{
                    width: 100%;
                    border:none;
                }
                .date-cell.selected button{
                    color: lightblue;
                    background-color: #2f4355;
                }
                .date-cell.today {
                    border-bottom-color: darkgray;
                }
                .date-cell.has-events {
                    background-color: whitesmoke;
                }
                .event-popup {
                    display:none;
                    position: absolute;
                }
                .date-cell.has-events:hover .event-popup, 
                .date-cell.has-events.selected .event-popup{   
                    display: block;
                }
                .month-nav {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.8em;
                    padding: 0 0.75em;
                }
            </style>
            <div class="calendar">
                <div class="month-nav">
                    <button class="not-button" data-name="previousButton"><five-icon key='navigateLeft'></five-icon></button>
                    <five-dropdown-selector data-name="monthsSelector"></five-dropdown-selector>
                    <button class="not-button" data-name="nextButton"><five-icon key='navigateRight'></five-icon></button>
                    <span data-name="selectedYearEl"></span>
                </div>
                <div class="days-header">
                    <div class="day">Mon</div>
                    <div class="day">Tue</div>
                    <div class="day">Wed</div>
                    <div class="day">Thu</div>
                    <div class="day">Fri</div>
                    <div class="day">Sat</div>
                    <div class="day">Sun</div>
                </div>
                <div class="dates" data-name="dates">
                </div>

                <template data-name="dateCellTemplate">
                    <div class="date-cell">
                        <button>
                            <span class="date"></span>
                        </button>
                        <div class="popup event-popup"></div>
                    </div>
                </template>
                <template data-name="eventTemplate">
                    <div class="event">
                        <span data-name="title"></span>
                    </div>
                </template>
            </div>
        `);
    }
    connectedCallback() {
        super.connectedCallback();
        this.previousButton.addEventListener('click', e => {
            this.offsetMonth(-1);
            this.fireEvent('monthChanged', this.selectedMonth);
        });
        this.nextButton.addEventListener('click', e => {
            this.offsetMonth(1);
            this.fireEvent('monthChanged', this.selectedMonth);
        });
        const monthFormat = new Intl.DateTimeFormat('default', { month: 'long' });
        this.monthsSelector.setOptions(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => ({
                label: monthFormat.format(new Date(0, m)),
                value: m
            }))
        );
        this.monthsSelector.addEventListener('selected', e => {
            this.setSelectedMonth(e.detail);
            this.fireEvent('monthChanged', this.selectedMonth);
        });
        this.updateUI();
    }

    updateUI() {
        this.monthsSelector.setSelectedValue(this.selectedMonth);
        this.selectedYearEl.innerText = this.selectedYear;
        this.dates.innerHTML = '';
        const firstDay = new Date(this.selectedYear, this.selectedMonth, 1);
        const lastDay = new Date(this.selectedYear, this.selectedMonth + 1, 0);
        while (firstDay.getUTCDay() !== 1) {
            firstDay.setDate(firstDay.getDate() - 1);
        }
        let date = new Date(firstDay);
        while (date <= lastDay) {
            const dateCell = this.dateCellTemplate.clone();
            dateCell.querySelector('.date').innerText = date.getDate();
            dateCell.classList.toggle('prev-month', date.getMonth() !== this.selectedMonth);
            dateCell.classList.toggle('today', date.toDateString() === new Date().toDateString());
            dateCell.classList.toggle('selected', this.selectedDate != undefined && date.toDateString() === this.selectedDate.toDateString());
            dateCell.disabled = date.getMonth() !== this.selectedMonth;

            const events = this.events?.filter(e => e.date === date.getDate() && e.month === this.selectedMonth && (e.year == undefined || e.year === this.selectedYear));
            events?.forEach(e => {
                dateCell.querySelector('.event-popup').appendChild(this.eventTemplate.clone(e));
                dateCell.style.backgroundColor = e.color ?? '';
            });
            dateCell.classList.toggle('has-events', events != undefined && events.length > 0);

            const targetDate = new Date(date);
            dateCell.querySelector('button').onclick = e => {
                this.selectedDate = targetDate;
                super.fireEvent('dateSelected', targetDate);
                this.updateUI();
            }
            this.dates.appendChild(dateCell);
            date.setDate(date.getDate() + 1);

        }
    }
    addCalendarEvents(events) {
        this.events = events;
        this.updateUI();
    }
    offsetMonth(offset) {
        const date = new Date(this.selectedYear, this.selectedMonth);
        date.setMonth(date.getMonth() + offset);
        this.selectedMonth = date.getMonth();
        this.selectedYear = date.getFullYear();
        this.updateUI();
    }
    setSelectedMonth(month) {
        this.selectedMonth = new Date(this.selectedYear, month).getMonth();
        this.selectedDate = undefined;
        this.updateUI();
    }
    setSelectedDate(date) {
        this.selectedDate = date;
        this.selectedMonth = date.getMonth();
        this.selectedYear = date.getFullYear();
        this.updateUI();
    }
    clearSelection() {
        this.selectedDate = undefined;
        this.updateUI();
    }

}
customElements.define('five-calendar', Calendar);