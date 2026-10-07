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
        // Mock data insertion for first boot
        if (this.store.getTasks().length === 0) {
            const tmr = new Date();
            tmr.setHours(tmr.getHours() + 2); // Next task in 2 hours
            
            this.store.addTask({
                id: Date.now().toString(),
                title: 'Review Prototype System',
                time: tmr.toISOString(),
                type: 'critical'
            });
        }
        
        // Boot Sequence
        this.ui.playIntroAnimation();
        this.ui.renderTasks();
        this.startTimer();
    }

    startTimer() {
        if(this.timerInterval) clearInterval(this.timerInterval);
        
        // Ticks every second to update the massive countdown
        this.timerInterval = setInterval(() => {
            const nextTask = this.store.getNextTask();
            this.ui.updateCountdown(nextTask);
        }, 1000);
    }
}

// Ensure DOM is ready, then boot the system.
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChronosApp();
});
