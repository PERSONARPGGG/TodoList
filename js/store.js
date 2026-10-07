/**
 * Store Module (Offline-First Data Layer)
 * Manages LocalStorage. Future versions will background-sync with Notion/Firebase from here.
 */
export class Store {
    constructor() {
        this.storageKey = 'chronos_objectives';
    }

    getTasks() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Storage read error", e);
            return [];
        }
    }

    addTask(task) {
        const tasks = this.getTasks();
        tasks.push(task);
        this._save(tasks);
    }

    deleteTask(id) {
        let tasks = this.getTasks();
        tasks = tasks.filter(t => t.id !== id);
        this._save(tasks);
    }

    getNextTask() {
        const tasks = this.getTasks();
        const now = new Date();
        // Return closest upcoming task
        return tasks.find(t => new Date(t.time) > now) || null;
    }

    _save(tasks) {
        // Always enforce chronological order on save
        tasks.sort((a, b) => new Date(a.time) - new Date(b.time));
        localStorage.setItem(this.storageKey, JSON.stringify(tasks));
    }
}
