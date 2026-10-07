/**
 * UI Module
 * Handles all DOM manipulation, animations, and View updates.
 * STRICT ISOLATION: Never accesses LocalStorage directly; asks App/Store.
 */
export class UI {
    constructor(app) {
        this.app = app;
        this.bindEvents();
    }

    bindEvents() {
        // Tab Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn));
        });

        // Add Modal Toggles
        const modal = document.getElementById('add-modal');
        document.getElementById('btn-add').addEventListener('click', () => {
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.remove('opacity-0'), 10);
            
            // Default time to now + 1 hour
            const tzoffset = (new Date()).getTimezoneOffset() * 60000; 
            const localISOTime = (new Date(Date.now() - tzoffset + 3600000)).toISOString().slice(0, 16);
            document.getElementById('input-time').value = localISOTime;
            document.getElementById('input-task').focus();
        });

        document.getElementById('btn-cancel').addEventListener('click', () => {
            modal.classList.add('opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 200);
        });

        // Save logic
        document.getElementById('btn-save').addEventListener('click', () => {
            const title = document.getElementById('input-task').value;
            const time = document.getElementById('input-time').value;
            if (title && time) {
                this.app.store.addTask({
                    id: Date.now().toString(),
                    title,
                    time: new Date(time).toISOString(),
                    type: 'normal' // TODO: dynamic priority
                });
                this.renderTasks();
                document.getElementById('input-task').value = '';
                
                modal.classList.add('opacity-0');
                setTimeout(() => modal.classList.add('hidden'), 200);
            }
        });
    }

    switchTab(btn) {
        // Reset all tabs
        document.querySelectorAll('.nav-btn').forEach(b => {
            b.classList.remove('active');
            b.querySelector('.indicator').classList.remove('opacity-100', 'scale-y-100');
            b.querySelector('.indicator').classList.add('opacity-0', 'scale-y-0');
        });
        
        const target = btn.dataset.target;
        btn.classList.add('active');
        btn.querySelector('.indicator').classList.remove('opacity-0', 'scale-y-0');
        btn.querySelector('.indicator').classList.add('opacity-100', 'scale-y-100');

        // Swap Content Views
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
        const targetView = document.getElementById(target);
        targetView.classList.remove('hidden');
        
        // Retrigger animation
        targetView.classList.remove('animate-fade-in');
        void targetView.offsetWidth; // trigger reflow
        targetView.classList.add('animate-fade-in');
    }

    playIntroAnimation() {
        const overlay = document.getElementById('date-transition');
        const text = document.getElementById('transition-text');
        
        const now = new Date();
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        text.innerText = `${days[now.getDay()]} ${now.getDate()}`;
        
        text.classList.add('animate-persona');
        
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 1500); // Wait for animation to finish
    }

    renderTasks() {
        const list = document.getElementById('task-list');
        const tasks = this.app.store.getTasks();
        
        list.innerHTML = tasks.map(task => {
            const dateStr = new Date(task.time).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
            });
            const isPast = new Date(task.time) < new Date();
            
            return `
            <li class="task-card bg-gray-900 p-4 rounded flex flex-col justify-center group cursor-pointer border-l-4 ${isPast ? 'border-gray-800 opacity-50' : 'border-gray-600'}">
                <div class="flex justify-between items-center w-full">
                    <div>
                        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">${dateStr}</p>
                        <h4 class="font-bold text-white group-hover:text-red-400 transition-colors text-sm">${task.title}</h4>
                    </div>
                    <button class="text-gray-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100" onclick="app.store.deleteTask('${task.id}'); app.ui.renderTasks();">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </li>
        `}).join('');
    }

    updateCountdown(nextTask) {
        const titleEl = document.getElementById('next-task-title');
        const timerEl = document.getElementById('countdown-timer');

        if (!nextTask) {
            titleEl.innerText = 'STANDBY';
            timerEl.innerText = '00:00:00';
            timerEl.className = 'font-bebas text-7xl text-gray-700 tracking-wider';
            return;
        }

        titleEl.innerText = nextTask.title;
        
        const now = new Date();
        const target = new Date(nextTask.time);
        const diffMs = Math.max(0, target - now);

        // Styling based on urgency
        if (diffMs <= 0) {
            timerEl.innerText = '00:00:00';
            timerEl.className = 'font-bebas text-7xl text-red-500 tracking-wider shadow-none';
            // Here we could trigger the push notification logic
            return;
        } else if (diffMs < 3600000) { // Less than 1 hour
            timerEl.className = 'font-bebas text-7xl text-red-400 tracking-wider animate-pulse';
        } else {
            timerEl.className = 'font-bebas text-7xl text-yellow-400 tracking-wider shadow-yellow';
        }

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        timerEl.innerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}
