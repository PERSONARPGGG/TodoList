/**
 * UI Module - Chronos Tactical Persona Interface (v0.5.0 Snappy)
 * High-performance DOM, Event Delegation, Instant Multilingual (EN/KR/JP), Snappy Transitions.
 */
import { i18n } from './i18n.js';

export class UI {
    constructor(app) {
        this.app = app;
        this.currentTabIndex = 0;
        this.tabs = ['view-schedule', 'view-info', 'view-urls'];
        this.selectedDateFilter = null;
        this.currentTaskFilter = 'ALL';
        this.currentLinkCategory = 'ALL';
        this.editingGoalType = null;
        
        // Calendar Navigation State
        const now = new Date();
        this.calYear = now.getFullYear();
        this.calMonth = now.getMonth();

        // Touch Gestures
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.bindEvents();
        this.bindGestures();
        this.initNotificationState();
        this.applyTranslations();
    }

    bindEvents() {
        // Language Switcher (EN | KR | JP)
        document.querySelectorAll('#lang-switcher .lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#lang-switcher .lang-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const lang = btn.dataset.lang;
                i18n.setLang(lang);
                this.applyTranslations();
                this.renderTasks();
                this.renderCalendar();
                this.renderStats();
                this.renderGoals();
                this.renderLinks();
            });
        });

        // Cyber Hourglass Flip Interaction
        const hourglass = document.getElementById('cyber-hourglass');
        hourglass?.addEventListener('click', () => {
            hourglass.classList.toggle('flip');
            this.playSlashEffect(i18n.currentLang === 'KR' ? '시간 엔진 회전' : (i18n.currentLang === 'JP' ? '時間反転' : 'TEMPORAL FLIP'));
        });

        // Fast Command Bar Submission (Natural Language Parser)
        const quickForm = document.getElementById('form-quick-cmd');
        const quickInput = document.getElementById('input-quick-cmd');
        quickForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = quickInput.value.trim();
            if (!text) return;

            const parsed = this.app.store.parseQuickInput(text);
            this.app.store.addTask({
                title: parsed.title,
                time: parsed.time,
                isDaily: parsed.isDaily,
                type: parsed.isDaily ? 'critical' : 'normal'
            });

            quickInput.value = '';
            this.playSlashEffect(i18n.currentLang === 'KR' ? '일정 등록 완료' : (i18n.currentLang === 'JP' ? '目標登録完了' : 'DIRECTIVE ENGAGED'));
            this.renderTasks();
            this.renderCalendar();
            this.renderStats();
        });

        // Tab Navigation Buttons (Right Bookmark)
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetIndex = parseInt(btn.dataset.index, 10);
                this.switchTabByIndex(targetIndex);
            });
        });

        // Swipe Dots Click
        document.querySelectorAll('.swipe-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.dataset.index, 10);
                this.switchTabByIndex(index);
            });
        });

        // Sub-tabs in Schedule: Timeline vs Calendar
        const btnTimeline = document.getElementById('tab-sub-timeline');
        const btnCalendar = document.getElementById('tab-sub-calendar');
        const calWidget = document.getElementById('calendar-widget');

        btnTimeline?.addEventListener('click', () => {
            btnTimeline.className = "text-xs uppercase font-bold tracking-wider text-red-500 pb-0.5 border-b-2 border-red-500 transition-colors";
            btnCalendar.className = "text-xs uppercase font-bold tracking-wider text-gray-500 hover:text-white pb-0.5 border-b-2 border-transparent transition-colors";
            calWidget.classList.add('hidden');
        });

        btnCalendar?.addEventListener('click', () => {
            btnCalendar.className = "text-xs uppercase font-bold tracking-wider text-yellow-400 pb-0.5 border-b-2 border-yellow-400 transition-colors";
            btnTimeline.className = "text-xs uppercase font-bold tracking-wider text-gray-500 hover:text-white pb-0.5 border-b-2 border-transparent transition-colors";
            calWidget.classList.remove('hidden');
            this.renderCalendar();
        });

        // Calendar Month Prev / Next
        document.getElementById('btn-cal-prev')?.addEventListener('click', () => {
            this.calMonth--;
            if (this.calMonth < 0) {
                this.calMonth = 11;
                this.calYear--;
            }
            this.renderCalendar();
        });

        document.getElementById('btn-cal-next')?.addEventListener('click', () => {
            this.calMonth++;
            if (this.calMonth > 11) {
                this.calMonth = 0;
                this.calYear++;
            }
            this.renderCalendar();
        });

        document.getElementById('btn-clear-date-filter')?.addEventListener('click', () => {
            this.selectedDateFilter = null;
            document.getElementById('cal-filter-banner')?.classList.add('hidden');
            this.renderCalendar();
            this.renderTasks();
        });

        // Status Filter Chips
        document.querySelectorAll('#task-filter-chips .task-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('#task-filter-chips .task-chip').forEach(c => {
                    c.className = "px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-gray-900 text-gray-400 hover:text-white task-chip";
                });
                chip.className = "px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-red-600 text-white task-chip active";
                this.currentTaskFilter = chip.dataset.filter;
                this.renderTasks();
            });
        });

        // Event Delegation for Task List
        const taskListEl = document.getElementById('task-list');
        taskListEl?.addEventListener('click', (e) => {
            const completeBtn = e.target.closest('[data-action="toggle-complete"]');
            if (completeBtn) {
                const taskId = completeBtn.dataset.id;
                this.toggleTaskComplete(taskId);
                return;
            }

            const deleteBtn = e.target.closest('[data-action="delete-task"]');
            if (deleteBtn) {
                const taskId = deleteBtn.dataset.id;
                this.app.store.deleteTask(taskId);
                this.renderTasks();
                this.renderStats();
                this.renderCalendar();
                return;
            }
        });

        // Detailed Add Objective Modal
        const modal = document.getElementById('add-modal');
        document.getElementById('btn-add')?.addEventListener('click', () => {
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.remove('opacity-0'), 10);
            
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
            const localISOTime = (new Date(Date.now() - tzoffset + 3600000)).toISOString().slice(0, 16);
            document.getElementById('input-time').value = localISOTime;
            document.getElementById('input-task').value = '';
            document.getElementById('input-is-daily').checked = false;
            document.getElementById('input-task').focus();
        });

        document.getElementById('btn-cancel')?.addEventListener('click', () => {
            modal.classList.add('opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 150);
        });

        // Save Objective from Detailed Modal
        document.getElementById('btn-save')?.addEventListener('click', () => {
            const title = document.getElementById('input-task').value.trim();
            const time = document.getElementById('input-time').value;
            const priority = document.getElementById('input-priority').value;
            const isDaily = document.getElementById('input-is-daily').checked;

            if (title && time) {
                this.app.store.addTask({
                    title,
                    time: new Date(time).toISOString(),
                    type: priority,
                    isDaily
                });
                this.renderTasks();
                this.renderCalendar();
                this.renderStats();
                
                modal.classList.add('opacity-0');
                setTimeout(() => modal.classList.add('hidden'), 150);
            }
        });

        // Complete Active Prime Directive
        document.getElementById('btn-complete-prime')?.addEventListener('click', () => {
            const nextTask = this.app.store.getNextTask();
            if (nextTask) {
                this.app.store.completeTask(nextTask.id);
                this.playSlashEffect(i18n.currentLang === 'KR' ? '목표 완수!' : (i18n.currentLang === 'JP' ? '任務完了!' : 'MISSION COMPLETE'));
                this.renderTasks();
                this.renderStats();
            }
        });

        // Auto-Rescheduling Buttons
        document.getElementById('btn-delay-15m')?.addEventListener('click', () => {
            const nextTask = this.app.store.getNextTask();
            if (nextTask) {
                this.app.store.delayTask(nextTask.id, 15);
                this.renderTasks();
                this.renderStats();
            }
        });

        document.getElementById('btn-delay-1h')?.addEventListener('click', () => {
            const nextTask = this.app.store.getNextTask();
            if (nextTask) {
                this.app.store.delayTask(nextTask.id, 60);
                this.renderTasks();
                this.renderStats();
            }
        });

        document.getElementById('btn-delay-1d')?.addEventListener('click', () => {
            const nextTask = this.app.store.getNextTask();
            if (nextTask) {
                this.app.store.delayTask(nextTask.id, 1440);
                this.renderTasks();
                this.renderStats();
            }
        });

        // Custom Delay Modal
        const customModal = document.getElementById('delay-custom-modal');
        document.getElementById('btn-delay-custom')?.addEventListener('click', () => {
            customModal.classList.remove('hidden');
            setTimeout(() => customModal.classList.remove('opacity-0'), 10);
            document.getElementById('input-custom-minutes').focus();
        });

        document.getElementById('btn-cancel-custom-delay')?.addEventListener('click', () => {
            customModal.classList.add('opacity-0');
            setTimeout(() => customModal.classList.add('hidden'), 150);
        });

        document.getElementById('btn-confirm-custom-delay')?.addEventListener('click', () => {
            const mins = parseInt(document.getElementById('input-custom-minutes').value, 10);
            const nextTask = this.app.store.getNextTask();
            if (nextTask && mins > 0) {
                this.app.store.delayTask(nextTask.id, mins);
                this.renderTasks();
                this.renderStats();
                customModal.classList.add('opacity-0');
                setTimeout(() => customModal.classList.add('hidden'), 150);
            }
        });

        // Goals Edit Modals
        const goalModal = document.getElementById('edit-goal-modal');
        const goalTitle = document.getElementById('edit-goal-title');
        const goalInput = document.getElementById('input-goal-text');

        document.getElementById('btn-edit-short-goal')?.addEventListener('click', () => {
            this.editingGoalType = 'short';
            goalTitle.innerText = i18n.t('shortTermTitle');
            goalInput.value = this.app.store.getGoals().shortTerm;
            goalModal.classList.remove('hidden');
            setTimeout(() => goalModal.classList.remove('opacity-0'), 10);
            goalInput.focus();
        });

        document.getElementById('btn-edit-long-goal')?.addEventListener('click', () => {
            this.editingGoalType = 'long';
            goalTitle.innerText = i18n.t('longTermTitle');
            goalInput.value = this.app.store.getGoals().longTerm;
            goalModal.classList.remove('hidden');
            setTimeout(() => goalModal.classList.remove('opacity-0'), 10);
            goalInput.focus();
        });

        document.getElementById('btn-cancel-goal')?.addEventListener('click', () => {
            goalModal.classList.add('opacity-0');
            setTimeout(() => goalModal.classList.add('hidden'), 150);
        });

        document.getElementById('btn-save-goal')?.addEventListener('click', () => {
            const val = goalInput.value.trim();
            if (val) {
                const current = this.app.store.getGoals();
                if (this.editingGoalType === 'short') {
                    this.app.store.saveGoals(val, current.longTerm);
                } else {
                    this.app.store.saveGoals(current.shortTerm, val);
                }
                this.renderGoals();
                goalModal.classList.add('opacity-0');
                setTimeout(() => goalModal.classList.add('hidden'), 150);
            }
        });

        // JSON Backup Export / Import
        document.getElementById('btn-export-json')?.addEventListener('click', () => {
            const json = this.app.store.exportAllData();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chronos_backup_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        const fileInput = document.getElementById('file-import-json');
        document.getElementById('btn-import-json-trigger')?.addEventListener('click', () => {
            fileInput?.click();
        });

        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const success = this.app.store.importData(event.target.result);
                if (success) {
                    this.playSlashEffect(i18n.currentLang === 'KR' ? '백업 복원 완료' : 'BACKUP RESTORED');
                    this.renderTasks();
                    this.renderCalendar();
                    this.renderStats();
                    this.renderGoals();
                    this.renderLinks();
                } else {
                    alert('Invalid JSON backup file.');
                }
            };
            reader.readAsText(file);
        });

        // Network Category Filters
        document.querySelectorAll('#link-category-filter .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#link-category-filter .filter-btn').forEach(b => {
                    b.className = "px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-gray-900 text-gray-400 hover:text-white filter-btn";
                });
                btn.className = "px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-yellow-400 text-black filter-btn active";
                this.currentLinkCategory = btn.dataset.cat;
                this.renderLinks();
            });
        });

        // Add Network Link Modal
        const linkModal = document.getElementById('add-link-modal');
        document.getElementById('btn-add-link')?.addEventListener('click', () => {
            linkModal.classList.remove('hidden');
            setTimeout(() => linkModal.classList.remove('opacity-0'), 10);
            document.getElementById('input-link-title').value = '';
            document.getElementById('input-link-url').value = '';
            document.getElementById('input-link-title').focus();
        });

        document.getElementById('btn-cancel-link')?.addEventListener('click', () => {
            linkModal.classList.add('opacity-0');
            setTimeout(() => linkModal.classList.add('hidden'), 150);
        });

        document.getElementById('btn-save-link')?.addEventListener('click', () => {
            const title = document.getElementById('input-link-title').value.trim();
            const url = document.getElementById('input-link-url').value.trim();
            const cat = document.getElementById('input-link-cat').value;
            if (title && url) {
                this.app.store.addLink(title, cat, url);
                this.renderLinks();
                linkModal.classList.add('opacity-0');
                setTimeout(() => linkModal.classList.add('hidden'), 150);
            }
        });

        // Notification Permission Request
        document.getElementById('btn-request-notify')?.addEventListener('click', () => {
            this.requestNotificationPermission();
        });
    }

    /* ================= Instant Multilingual Applier ================= */
    applyTranslations() {
        const lang = i18n.currentLang;
        document.querySelectorAll('#lang-switcher .lang-btn').forEach(b => {
            if (b.dataset.lang === lang) b.classList.add('active');
            else b.classList.remove('active');
        });

        // Update Labels
        const setTxt = (id, key) => {
            const el = document.getElementById(id);
            if (el) el.innerText = i18n.t(key);
        };

        setTxt('system-status', 'sysReady');
        setTxt('label-prime-directive', 'primeDirective');
        setTxt('btn-complete-prime', 'btnComplete');
        setTxt('btn-delay-custom', 'btnCustom');
        setTxt('tab-sub-timeline', 'tabTimeline');
        setTxt('tab-sub-calendar', 'tabCalendar');
        setTxt('chip-all', 'chipAll');
        setTxt('chip-pending', 'chipPending');
        setTxt('chip-daily', 'chipDaily');
        setTxt('chip-cleared', 'chipCleared');
        setTxt('btn-add', 'btnDetailForm');
        setTxt('cal-filter-text', 'calFiltered');
        setTxt('btn-clear-date-filter', 'calViewAll');
        setTxt('label-intel-title', 'intelTitle');
        setTxt('label-intel-sub', 'intelSubtitle');
        setTxt('label-exec-rating', 'execRating');
        setTxt('label-eff-index', 'efficiencyIndex');
        setTxt('label-rate', 'rate');
        setTxt('label-delayed', 'delayed');
        setTxt('label-done', 'done');
        setTxt('label-short-term-title', 'shortTermTitle');
        setTxt('label-long-term-title', 'longTermTitle');
        setTxt('label-backup-title', 'backupTitle');
        setTxt('btn-export-json', 'btnExport');
        setTxt('btn-import-json-trigger', 'btnRestore');
        setTxt('label-net-title', 'netTitle');
        setTxt('btn-add-link', 'btnAddPortal');
        setTxt('nav-text-schedule', 'navSchedule');
        setTxt('nav-text-intel', 'navIntel');
        setTxt('nav-text-network', 'navNetwork');
        setTxt('modal-add-title', 'modalAddTitle');
        setTxt('label-modal-title', 'labelTitle');
        setTxt('label-modal-target', 'labelTarget');
        setTxt('label-modal-daily', 'labelRepeatDaily');
        setTxt('label-modal-priority', 'labelPriority');
        setTxt('modal-delay-title', 'modalRescheduleTitle');
        setTxt('modal-delay-sub', 'modalRescheduleSub');
        setTxt('modal-portal-title', 'modalPortalTitle');
        setTxt('btn-save-link', 'btnStoreLink');
        setTxt('edit-goal-title', 'modalGoalTitle');

        const quickInput = document.getElementById('input-quick-cmd');
        if (quickInput) quickInput.placeholder = i18n.t('quickPlaceholder');

        this.initNotificationState();
    }

    /* ================= Mobile Swipe Gestures ================= */
    bindGestures() {
        const area = document.getElementById('main-content');
        if (!area) return;

        area.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        area.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchEndX - this.touchStartX;
            const diffY = touchEndY - this.touchStartY;

            if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX < 0) {
                    if (this.currentTabIndex < this.tabs.length - 1) {
                        this.switchTabByIndex(this.currentTabIndex + 1, 'left');
                    }
                } else {
                    if (this.currentTabIndex > 0) {
                        this.switchTabByIndex(this.currentTabIndex - 1, 'right');
                    }
                }
            }
        }, { passive: true });
    }

    switchTabByIndex(index, direction = 'right') {
        if (index < 0 || index >= this.tabs.length) return;
        this.currentTabIndex = index;
        const targetViewId = this.tabs[index];

        document.querySelectorAll('.nav-btn').forEach(b => {
            const idx = parseInt(b.dataset.index, 10);
            const indicator = b.querySelector('.indicator');
            if (idx === index) {
                b.classList.add('active');
                indicator.classList.remove('opacity-0', 'scale-y-0');
                indicator.classList.add('opacity-100', 'scale-y-100');
            } else {
                b.classList.remove('active');
                indicator.classList.remove('opacity-100', 'scale-y-100');
                indicator.classList.add('opacity-0', 'scale-y-0');
            }
        });

        document.querySelectorAll('.swipe-dot').forEach(dot => {
            const idx = parseInt(dot.dataset.index, 10);
            if (idx === index) {
                dot.className = "swipe-dot active";
            } else {
                dot.className = "swipe-dot";
            }
        });

        document.querySelectorAll('.view-section').forEach(sec => {
            sec.classList.add('hidden');
            sec.classList.remove('animate-swipe-left', 'animate-swipe-right');
        });

        const activeSec = document.getElementById(targetViewId);
        activeSec.classList.remove('hidden');
        void activeSec.offsetWidth;

        if (direction === 'left') {
            activeSec.classList.add('animate-swipe-left');
        } else {
            activeSec.classList.add('animate-swipe-right');
        }

        if (targetViewId === 'view-info') {
            this.renderStats();
            this.renderGoals();
        } else if (targetViewId === 'view-urls') {
            this.renderLinks();
        }
    }

    /* ================= Persona Visual Effects (Snappy) ================= */
    playIntroAnimation() {
        const overlay = document.getElementById('date-transition');
        const text = document.getElementById('transition-text');
        if (!overlay || !text) return;

        const now = new Date();
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        text.innerText = `${days[now.getDay()]} ${now.getDate()}`;
        text.classList.add('animate-persona');

        setTimeout(() => {
            overlay.style.display = 'none';
        }, 750);
    }

    playSlashEffect(message) {
        const overlay = document.getElementById('date-transition');
        const text = document.getElementById('transition-text');
        if (!overlay || !text) return;

        overlay.style.display = 'flex';
        text.className = 'font-bebas text-6xl md:text-8xl tracking-wider text-emerald-400 transform scale-125';
        text.innerText = message;
        text.classList.remove('animate-persona');
        void text.offsetWidth;
        text.classList.add('animate-persona');

        if (navigator.vibrate) navigator.vibrate([40, 20, 40]);

        setTimeout(() => {
            overlay.style.display = 'none';
        }, 650);
    }

    /* ================= Rendering Tasks ================= */
    renderTasks() {
        const list = document.getElementById('task-list');
        if (!list) return;

        let tasks = this.app.store.getTasks();

        if (this.selectedDateFilter) {
            tasks = tasks.filter(t => {
                const d = new Date(t.time);
                return d.getFullYear() === this.selectedDateFilter.getFullYear() &&
                       d.getMonth() === this.selectedDateFilter.getMonth() &&
                       d.getDate() === this.selectedDateFilter.getDate();
            });
        }

        if (this.currentTaskFilter === 'PENDING') {
            tasks = tasks.filter(t => !t.completed);
        } else if (this.currentTaskFilter === 'DAILY') {
            tasks = tasks.filter(t => t.isDaily);
        } else if (this.currentTaskFilter === 'CLEARED') {
            tasks = tasks.filter(t => t.completed);
        }

        if (tasks.length === 0) {
            list.innerHTML = `
                <li class="p-6 text-center border border-dashed border-gray-900 rounded-lg">
                    <p class="font-bebas text-xl text-gray-700 tracking-wider">${i18n.t('noDirectives')}</p>
                    <p class="text-xs text-gray-600 mt-1 font-mono">${i18n.t('noDirectivesSub')}</p>
                </li>
            `;
            return;
        }

        const now = new Date();
        list.innerHTML = tasks.map(task => {
            const taskDate = new Date(task.time);
            const dateStr = taskDate.toLocaleString(i18n.currentLang === 'KR' ? 'ko-KR' : (i18n.currentLang === 'JP' ? 'ja-JP' : 'en-US'), {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
            });
            const diffMs = taskDate - now;
            const isPast = diffMs < 0 && !task.completed;

            let relativeBadge = '';
            if (task.completed) {
                relativeBadge = `<span class="text-[9px] font-mono text-emerald-400 font-bold">${i18n.t('tagCleared')}</span>`;
            } else if (isPast) {
                relativeBadge = `<span class="text-[9px] font-mono text-red-500 font-bold animate-pulse">${i18n.t('tagOverdue')}</span>`;
            } else {
                const hours = Math.floor(diffMs / 3600000);
                const mins = Math.floor((diffMs % 3600000) / 60000);
                if (hours > 24) {
                    relativeBadge = `<span class="text-[9px] font-mono text-gray-400 font-bold">${i18n.dict[i18n.currentLang].inDays(Math.floor(hours / 24))}</span>`;
                } else if (hours > 0) {
                    relativeBadge = `<span class="text-[9px] font-mono text-yellow-300 font-bold">${i18n.dict[i18n.currentLang].inHoursMins(hours, mins)}</span>`;
                } else {
                    relativeBadge = `<span class="text-[9px] font-mono text-red-400 font-bold animate-pulse">${i18n.dict[i18n.currentLang].inMins(mins)}</span>`;
                }
            }

            return `
            <li class="task-card-persona p-3 flex items-center justify-between gap-3 ${task.completed ? 'task-completed' : ''}">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <button data-action="toggle-complete" data-id="${task.id}" class="w-5 h-5 rounded border ${task.completed ? 'bg-emerald-600 border-emerald-500 text-black font-black' : 'border-gray-700 hover:border-red-500'} flex items-center justify-center shrink-0 transition-colors">
                        ${task.completed ? '✓' : ''}
                    </button>
                    
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span class="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">${dateStr}</span>
                            ${relativeBadge}
                            ${task.isDaily ? `<span class="text-[9px] font-mono bg-yellow-950/80 border border-yellow-700 text-yellow-300 px-1.5 rounded font-black">${i18n.t('tagDaily')}</span>` : ''}
                            ${task.delayCount > 0 ? `<span class="text-[9px] font-mono bg-red-950/80 border border-red-800 text-red-300 px-1 rounded">+${task.delayCount}D</span>` : ''}
                            ${task.type === 'critical' ? `<span class="text-[9px] font-mono text-red-400 font-bold">${i18n.t('tagCritical')}</span>` : ''}
                        </div>
                        <h4 class="task-title font-bold text-white text-sm truncate tracking-tight">${task.title}</h4>
                    </div>
                </div>

                <button data-action="delete-task" data-id="${task.id}" class="text-gray-600 hover:text-red-500 p-1.5 transition-colors shrink-0" title="Delete Directive">
                    <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </li>
        `}).join('');
    }

    toggleTaskComplete(id) {
        const tasks = this.app.store.getTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            if (task.completed) {
                this.app.store.uncompleteTask(id);
            } else {
                this.app.store.completeTask(id);
                this.playSlashEffect(i18n.currentLang === 'KR' ? '목표 달성!' : 'OBJECTIVE CLEARED');
            }
            this.renderTasks();
            this.renderStats();
            this.renderCalendar();
        }
    }

    /* ================= Countdown, Gauge & Real-Time Clock ================= */
    updateCountdown(nextTask) {
        const titleEl = document.getElementById('next-task-title');
        const timerEl = document.getElementById('countdown-timer');
        const delayActions = document.getElementById('delay-actions');
        const targetStamp = document.getElementById('target-timestamp');
        const liveClock = document.getElementById('live-clock');
        const badgeTimeLeft = document.getElementById('task-badge-time-left');
        const gaugeFill = document.getElementById('time-gauge-fill');
        const gaugePercent = document.getElementById('gauge-percent');
        const hourglass = document.getElementById('cyber-hourglass');

        const now = new Date();
        liveClock.innerText = now.toTimeString().slice(0, 8);

        if (!nextTask) {
            titleEl.innerText = i18n.t('noDirectives');
            timerEl.innerText = '00:00:00';
            timerEl.className = 'font-bebas fluid-timer-text text-gray-700 tracking-wider leading-none';
            targetStamp.innerText = i18n.t('targetNone');
            hourglass?.classList.remove('hourglass-urgent');
            if (badgeTimeLeft) badgeTimeLeft.innerText = 'STANDBY';
            if (gaugeFill) gaugeFill.style.width = '0%';
            if (gaugePercent) gaugePercent.innerText = `${i18n.t('resources')}: 0%`;
            delayActions.classList.add('hidden');
            return;
        }

        delayActions.classList.remove('hidden');
        titleEl.innerText = nextTask.title;
        targetStamp.innerText = `TARGET: ${new Date(nextTask.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;

        const target = new Date(nextTask.time);
        const diffMs = target - now;

        if (diffMs <= 0) {
            timerEl.innerText = '00:00:00';
            timerEl.className = 'font-bebas fluid-timer-text text-red-500 tracking-wider glow-red leading-none animate-pulse';
            hourglass?.classList.add('hourglass-urgent');
            if (badgeTimeLeft) {
                badgeTimeLeft.className = "text-[9px] font-mono uppercase bg-red-950/90 border border-red-700 text-red-300 px-1.5 py-0.5 rounded font-black animate-pulse";
                badgeTimeLeft.innerText = i18n.t('tagOverdue');
            }
            if (gaugeFill) gaugeFill.style.width = '100%';
            if (gaugePercent) gaugePercent.innerText = i18n.t('expired');

            if (!nextTask._alerted) {
                this.triggerAlert(nextTask.title);
                nextTask._alerted = true;
            }
            return;
        }

        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);

        timerEl.innerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (badgeTimeLeft) {
            badgeTimeLeft.className = "text-[9px] font-mono uppercase bg-yellow-950/80 border border-yellow-700 text-yellow-300 px-1.5 py-0.5 rounded font-black";
            badgeTimeLeft.innerText = i18n.dict[i18n.currentLang].inHoursMins(hours, minutes);
        }

        const totalWindowMs = 24 * 3600 * 1000;
        const remainingPct = Math.min(100, Math.max(5, Math.round((diffMs / totalWindowMs) * 100)));
        if (gaugeFill) gaugeFill.style.width = `${remainingPct}%`;
        if (gaugePercent) gaugePercent.innerText = `${i18n.t('resources')}: ${remainingPct}% ${i18n.t('remaining')}`;

        if (diffMs < 600000) {
            timerEl.className = 'font-bebas fluid-timer-text text-red-500 tracking-wider glow-red leading-none animate-timer-beat';
            hourglass?.classList.add('hourglass-urgent');
        } else {
            timerEl.className = 'font-bebas fluid-timer-text text-yellow-400 tracking-wider glow-yellow leading-none animate-timer-beat';
            hourglass?.classList.remove('hourglass-urgent');
        }
    }

    /* ================= Enhanced Mini Calendar ================= */
    renderCalendar() {
        const grid = document.getElementById('cal-grid-days');
        const monthTitle = document.getElementById('cal-month-title');
        if (!grid || !monthTitle) return;

        const year = this.calYear;
        const month = this.calMonth;
        const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
        monthTitle.innerText = `${monthNames[month]} ${year}`;

        const now = new Date();
        const firstDayIndex = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const tasks = this.app.store.getTasks();

        let html = '';
        for (let i = 0; i < firstDayIndex; i++) {
            html += `<div class="cal-cell opacity-20 pointer-events-none"></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
            const dayTasks = tasks.filter(t => {
                const td = new Date(t.time);
                return td.getFullYear() === year && td.getMonth() === month && td.getDate() === day;
            });

            const hasTask = dayTasks.length > 0;
            const hasCritical = dayTasks.some(t => t.type === 'critical');
            const isSelected = this.selectedDateFilter && 
                               this.selectedDateFilter.getFullYear() === year &&
                               this.selectedDateFilter.getMonth() === month &&
                               this.selectedDateFilter.getDate() === day;

            html += `
                <div class="cal-cell ${isToday ? 'today' : ''} ${hasTask ? 'has-task' : ''} ${isSelected ? 'selected' : ''}" onclick="app.ui.filterDate(${year}, ${month}, ${day})">
                    <span class="font-bold">${day}</span>
                    ${hasTask ? `
                        <div class="cal-dot-container">
                            <div class="cal-dot ${hasCritical ? 'dot-critical' : ''}"></div>
                            ${dayTasks.length > 1 ? `<span class="text-[8px] font-mono text-gray-400 leading-none">${dayTasks.length}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        grid.innerHTML = html;

        const filterBanner = document.getElementById('cal-filter-banner');
        const filterText = document.getElementById('cal-filter-text');
        if (this.selectedDateFilter) {
            filterBanner?.classList.remove('hidden');
            if (filterText) filterText.innerText = `${i18n.t('calFiltered')}: ${this.selectedDateFilter.toDateString().toUpperCase()}`;
        } else {
            filterBanner?.classList.add('hidden');
        }
    }

    filterDate(year, month, day) {
        if (this.selectedDateFilter && 
            this.selectedDateFilter.getFullYear() === year &&
            this.selectedDateFilter.getMonth() === month &&
            this.selectedDateFilter.getDate() === day) {
            this.selectedDateFilter = null;
        } else {
            this.selectedDateFilter = new Date(year, month, day);
        }
        this.renderCalendar();
        this.renderTasks();
    }

    /* ================= Intelligence & ENTJ Stats ================= */
    renderStats() {
        const stats = this.app.store.getStats();
        const rateEl = document.getElementById('stat-rate');
        const delayedEl = document.getElementById('stat-delayed');
        const completedEl = document.getElementById('stat-completed');
        const rankEl = document.getElementById('rank-stamp-badge');

        if (rateEl) rateEl.innerText = `${stats.completionRate}%`;
        if (delayedEl) delayedEl.innerText = stats.totalDelays;
        if (completedEl) completedEl.innerText = stats.completed;

        if (rankEl) {
            rankEl.className = `rank-stamp rank-${stats.grade.toLowerCase()}`;
            rankEl.innerText = `RANK ${stats.grade}`;
        }
    }

    renderGoals() {
        const goals = this.app.store.getGoals();
        const shortEl = document.getElementById('display-short-goal');
        const longEl = document.getElementById('display-long-goal');
        if (shortEl) shortEl.innerText = goals.shortTerm || i18n.t('targetNone');
        if (longEl) longEl.innerText = goals.longTerm || i18n.t('targetNone');
    }

    /* ================= Network Portals ================= */
    renderLinks() {
        const list = document.getElementById('link-list');
        if (!list) return;

        let links = this.app.store.getLinks();
        if (this.currentLinkCategory !== 'ALL') {
            links = links.filter(l => l.category === this.currentLinkCategory);
        }

        if (links.length === 0) {
            list.innerHTML = `
                <div class="p-6 text-center text-xs text-gray-600 font-mono border border-dashed border-gray-900 rounded">
                    ${i18n.t('noPortals')} [${this.currentLinkCategory}].
                </div>
            `;
            return;
        }

        list.innerHTML = links.map(link => `
            <div class="task-card-persona p-3 flex items-center justify-between border-l-4 border-yellow-500 group">
                <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="min-w-0 flex-1 block">
                    <span class="text-[9px] font-mono text-yellow-400 font-bold uppercase tracking-wider block mb-0.5">${link.category}</span>
                    <h4 class="font-bold text-white text-sm group-hover:text-yellow-300 transition-colors truncate">${link.title}</h4>
                    <span class="text-[11px] font-mono text-gray-500 block truncate">${link.url}</span>
                </a>
                <button class="text-gray-600 hover:text-red-500 p-2 transition-colors" onclick="app.store.deleteLink('${link.id}'); app.ui.renderLinks();">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        `).join('');
    }

    /* ================= Push Notification Logic ================= */
    initNotificationState() {
        const badge = document.getElementById('notify-badge');
        if (!badge) return;

        if (!('Notification' in window)) {
            badge.innerText = '🔔 PUSH: N/A';
            return;
        }

        if (Notification.permission === 'granted') {
            badge.innerText = i18n.t('pushOn');
            badge.parentElement.classList.add('text-emerald-400');
        } else {
            badge.innerText = i18n.t('pushOff');
            badge.parentElement.classList.remove('text-emerald-400');
        }
    }

    requestNotificationPermission() {
        if (!('Notification' in window)) {
            alert('Notifications not supported by this browser.');
            return;
        }

        Notification.requestPermission().then(permission => {
            this.initNotificationState();
            if (permission === 'granted') {
                new Notification('CHRONOS ENGAGED', {
                    body: 'Tactical notification protocol authorized.',
                    icon: 'icon.svg'
                });
            }
        });
    }

    triggerAlert(title) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⚡ CHRONOS // OBJECTIVE IMMINENT', {
                body: `Directive expired or requires immediate action: ${title}`,
                icon: 'icon.svg',
                requireInteraction: true
            });
        }
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    }
}
