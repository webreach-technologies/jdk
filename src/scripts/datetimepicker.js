class MinimalDateTimePicker {
            constructor(elementOrSelector, options = {}) {
                this.input = typeof elementOrSelector === 'string' 
                    ? document.querySelector(elementOrSelector) 
                    : elementOrSelector;

                if (!this.input) return;

                this.options = {
                    minuteStep: options.minuteStep || 5,
                    ...options
                };

                this.isOpen = false;
                this.step = 'date'; 
                this.viewDate = new Date();
                
                this.tempDate = null;
                this.tempHour = 12;
                this.tempMinute = 0;
                this.tempAmPm = 'PM';

                this.init();
            }

            init() {
                this.picker = document.createElement('div');
                this.picker.className = 'fixed hidden z-[9999] w-[300px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden picker-container no-select';
                document.body.appendChild(this.picker);

                this.picker.addEventListener('click', (e) => e.stopPropagation());

                this.input.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.open();
                });

                document.addEventListener('click', (e) => {
                    if (this.isOpen && e.target !== this.input) this.close();
                });

                window.addEventListener('resize', () => this.isOpen && this.reposition());
            }

            open() {
                this.isOpen = true;
                this.step = 'date';
                this.picker.classList.remove('hidden');
                
                document.body.style.overflow = 'hidden';
                
                this.render();
                
                // Wait for DOM paint then position ONCE
                requestAnimationFrame(() => {
                    this.reposition();
                });
            }

            close() {
                this.isOpen = false;
                this.picker.classList.add('hidden');
                
                // Re-enable background scrolling
                document.body.style.overflow = '';
            }

            reposition() {
                if (!this.isOpen) return;

                const rect = this.input.getBoundingClientRect();
                const pickerRect = this.picker.getBoundingClientRect();
                
                let top = rect.bottom + 12;
                let left = rect.left;

                if (top + pickerRect.height > window.innerHeight) {
                    const flippedTop = rect.top - pickerRect.height - 12;
                    if (flippedTop > 0) {
                        top = flippedTop;
                    } else {
                        top = Math.max(10, window.innerHeight - pickerRect.height - 15);
                    }
                } else if (top < 0) {
                    top = 10;
                }

                if (left + pickerRect.width > window.innerWidth) {
                    left = window.innerWidth - pickerRect.width - 15;
                }
                if (left < 10) left = 10;

                this.picker.style.top = `${top}px`;
                this.picker.style.left = `${left}px`;
            }

            render() {
                this.picker.innerHTML = '';
                
                const body = document.createElement('div');
                body.className = this.step === 'date' ? 'p-4' : 'p-0';

                if (this.step === 'date') this.renderCalendar(body);
                else this.renderTimePicker(body);

                this.picker.appendChild(body);
                this.attachListeners();

                if (this.step === 'time') {
                    setTimeout(() => {
                        this.centerSelectedItems(true);
                    }, 10);
                }

            }

            renderCalendar(container) {
                const year = this.viewDate.getFullYear();
                const month = this.viewDate.getMonth();
                const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(this.viewDate);

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();

                container.innerHTML = `
                    <div class="flex items-center justify-between mb-4 px-1">
                        <button class="prev-m p-2 hover:bg-slate-100 rounded-xl transition-all group ${isCurrentMonth ? 'opacity-20 pointer-events-none' : ''}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500 group-hover:text-primary">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <span class="text-sm font-bold text-slate-700">${monthName} ${year}</span>
                        <button class="next-m p-2 hover:bg-slate-100 rounded-xl transition-all group">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500 group-hover:text-primary">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                    <div class="grid grid-cols-7 gap-1 text-center mb-2 px-1">
                        ${['S','M','T','W','T','F','S'].map(d => `<span class="text-[10px] font-bold text-slate-300 uppercase">${d}</span>`).join('')}
                    </div>
                    <div class="grid grid-cols-7 gap-1 px-1">
                        ${this.generateCalendarDays(year, month)}
                    </div>
                `;
            }

            generateCalendarDays(year, month) {
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                let html = '';

                for (let i = 0; i < firstDay; i++) html += '<div></div>';

                for (let d = 1; d <= daysInMonth; d++) {
                    const dateObj = new Date(year, month, d);
                    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    const isSelected = this.tempDate && d === this.tempDate.getDate() && month === this.tempDate.getMonth() && year === this.tempDate.getFullYear();
                    const isPast = dateObj < today;
                    
                    const classes = ['date-btn', 'h-9', 'w-9', 'text-sm', 'font-semibold', 'rounded-xl'];

                    if (isPast) {
                        classes.push('past-date');
                    } else if (isSelected) {
                        classes.push('selected-item');
                    } else if (isToday) {
                        classes.push('today-mark');
                    } else {
                        classes.push('text-slate-600');
                    }

                    html += `<button class="${classes.join(' ')}" data-day="${d}">${d}</button>`;
                }
                return html;
            }

            renderTimePicker(container) {
                const timeWrapper = document.createElement('div');
                timeWrapper.className = 'flex h-70 relative overflow-hidden bg-white';

                let hourHtml = `<div class="time-column flex-1 overflow-y-auto border-r border-slate-50" id="hour-col">`;
                for(let i=1; i<=12; i++) {
                    const active = this.tempHour === i;
                    hourHtml += `<button class="hour-opt w-full py-3 text-sm font-bold ${active ? 'selected-item' : 'unselected-item'}" data-val="${i}">${i.toString().padStart(2, '0')}</button>`;
                }
                hourHtml += `</div>`;

                let minHtml = `<div class="time-column flex-1 overflow-y-auto border-r border-slate-50" id="min-col">`;
                for(let i=0; i<60; i += this.options.minuteStep) {
                    const active = this.tempMinute === i;
                    minHtml += `<button class="min-opt w-full py-3 text-sm font-bold ${active ? 'selected-item' : 'unselected-item'}" data-val="${i}">${i.toString().padStart(2, '0')}</button>`;
                }
                minHtml += `</div>`;

                const ampmHtml = `
                    <div class="flex-1 flex flex-col justify-center gap-2 px-3 bg-slate-50/30" id="ampm-col">
                        <button class="ampm-opt py-4 rounded-2xl text-xs font-black border ${this.tempAmPm === 'AM' ? 'ampm-active shadow-md shadow-blue-100' : 'ampm-inactive'}" data-val="AM">AM</button>
                        <button class="ampm-opt py-4 rounded-2xl text-xs font-black border ${this.tempAmPm === 'PM' ? 'ampm-active shadow-md shadow-blue-100' : 'ampm-inactive'}" data-val="PM">PM</button>
                    </div>
                `;

                timeWrapper.innerHTML = hourHtml + minHtml + ampmHtml;
                container.appendChild(timeWrapper);
            }

            centerSelectedItems(immediate = false) {
                const hourCol = this.picker.querySelector('#hour-col');
                const minCol = this.picker.querySelector('#min-col');
                
                const selectedHour = hourCol?.querySelector('.selected-item');
                const selectedMin = minCol?.querySelector('.selected-item');

                if (selectedHour) {
                    const scrollTarget = selectedHour.offsetTop - (hourCol.offsetHeight / 2) + (selectedHour.offsetHeight / 2);
                    hourCol.scrollTo({ top: scrollTarget, behavior: immediate ? 'auto' : 'smooth' });
                }
                if (selectedMin) {
                    const scrollTarget = selectedMin.offsetTop - (minCol.offsetHeight / 2) + (selectedMin.offsetHeight / 2);
                    minCol.scrollTo({ top: scrollTarget, behavior: immediate ? 'auto' : 'smooth' });
                }
            }

            attachListeners() {
                if (this.step === 'date') {
                    this.picker.querySelector('.prev-m').onclick = (e) => { 
                        e.stopPropagation(); 
                        this.viewDate.setMonth(this.viewDate.getMonth() - 1); 
                        this.render(); 
                    };
                    this.picker.querySelector('.next-m').onclick = (e) => { 
                        e.stopPropagation(); 
                        this.viewDate.setMonth(this.viewDate.getMonth() + 1); 
                        this.render(); 
                    };
                    this.picker.querySelectorAll('.date-btn').forEach(btn => {
                        btn.onclick = (e) => {
                            if (btn.classList.contains('past-date')) return;
                            e.stopPropagation();
                            this.tempDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), parseInt(btn.dataset.day));
                            this.step = 'time';
                            this.render();
                        };
                    });
                } else {
                    this.picker.querySelectorAll('.hour-opt').forEach(btn => {
                        btn.onclick = (e) => {
                            e.stopPropagation();
                            this.tempHour = parseInt(btn.dataset.val);
                            this.picker.querySelectorAll('.hour-opt').forEach(b => {
                                b.classList.remove('selected-item');
                                b.classList.add('unselected-item');
                            });
                            btn.classList.add('selected-item');
                            btn.classList.remove('unselected-item');
                            this.centerSelectedItems();
                        };
                    });

                    this.picker.querySelectorAll('.min-opt').forEach(btn => {
                        btn.onclick = (e) => {
                            e.stopPropagation();
                            this.tempMinute = parseInt(btn.dataset.val);
                            this.picker.querySelectorAll('.min-opt').forEach(b => {
                                b.classList.remove('selected-item');
                                b.classList.add('unselected-item');
                            });
                            btn.classList.add('selected-item');
                            btn.classList.remove('unselected-item');
                            this.centerSelectedItems();
                        };
                    });

                    this.picker.querySelectorAll('.ampm-opt').forEach(btn => {
                        btn.onclick = (e) => {
                            e.stopPropagation();
                            this.tempAmPm = btn.dataset.val;
                            this.picker.querySelectorAll('.ampm-opt').forEach(b => {
                                b.classList.remove('ampm-active', 'shadow-md', 'shadow-blue-100');
                                b.classList.add('ampm-inactive');
                            });
                            btn.classList.add('ampm-active', 'shadow-md', 'shadow-blue-100');
                            btn.classList.remove('ampm-inactive');
                            
                            this.finalize();
                        };
                    });
                }
            }

            finalize() {
                let h = this.tempHour;
                if (this.tempAmPm === 'PM' && h < 12) h += 12;
                if (this.tempAmPm === 'AM' && h === 12) h = 0;

                this.tempDate.setHours(h);
                this.tempDate.setMinutes(this.tempMinute);

                const dateStr = this.tempDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = `${this.tempHour.toString().padStart(2, '0')}:${this.tempMinute.toString().padStart(2, '0')} ${this.tempAmPm}`;

                this.input.value = `${dateStr}, ${timeStr}`;
                this.input.dispatchEvent(new Event("input", { bubbles: true }));
                this.input.dispatchEvent(new Event("change", { bubbles: true }));
                this.close();
                
                if (this.options.onChange) this.options.onChange(this.tempDate);
            }
        }

        window.onload = () => {
            document.querySelectorAll('.minimal-picker').forEach(el => {
                new MinimalDateTimePicker(el, { minuteStep: 5 });
            });
        };