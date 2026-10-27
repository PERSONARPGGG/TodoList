import { Store } from './store.js';
import { UI } from './ui.js';

/**
 * Main Application Orchestrator
 * STRICT MODULARITY: Logic is isolated here, Data in store.js, View in ui.js.
 */
class ChronosApp {
    constructor() {
        this.store = new Store();
        this.ui = new UI(this);
        
        this.timerInterval = null;
        this.init();
    }

    init() {
        // Mock data insertion for first boot if store is completely empty
        if (this.store.getTasks().length === 0) {
            const tmr = new Date();
            tmr.setHours(tmr.getHours() + 2); // Next task in 2 hours
            
            this.store.addTask({
                title: 'Review Tactical Architecture & PWA Cache',
                time: tmr.toISOString(),
                type: 'critical'
            });

            const later = new Date();
            later.setHours(later.getHours() + 6);
            this.store.addTask({
                title: 'Verify ENTJ Productivity Protocol',
                time: later.toISOString(),
                type: 'normal'
            });
        }
        
        // Boot Sequence
        this.ui.playIntroAnimation();
        this.ui.renderTasks();
        this.ui.renderCalendar();
        this.ui.renderStats();
        this.ui.renderGoals();
        this.ui.renderLinks();
        this.startTimer();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        // Immediate first tick
        const nextTask = this.store.getNextTask();
        this.ui.updateCountdown(nextTask);

        // Ticks every second to update countdown & real-time clock
        this.timerInterval = setInterval(() => {
            const task = this.store.getNextTask();
            this.ui.updateCountdown(task);
        }, 1000);
    }
}

// Ensure DOM is ready, then boot the system.
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChronosApp();
});
