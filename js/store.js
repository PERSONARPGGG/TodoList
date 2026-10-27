/**
 * Store Module (Offline-First Data Layer)
 * Manages LocalStorage for Tasks, Productivity Stats, Goals, Network Links, and Settings.
 * STRICT ISOLATION: UI never mutates state directly.
 */
export class Store {
    constructor() {
        this.tasksKey = 'chronos_objectives';
        this.goalsKey = 'chronos_goals';
        this.linksKey = 'chronos_links';
        this.settingsKey = 'chronos_settings';
        this.initDefaults();
    }

    initDefaults() {
        // Default Goals if empty
        if (!localStorage.getItem(this.goalsKey)) {
            const defaultGoals = {
                shortTerm: 'Deploy Chronos PWA & Establish Daily Routine',
                longTerm: 'Automate 100% of Daily AI Engineering Workflows'
            };
            localStorage.setItem(this.goalsKey, JSON.stringify(defaultGoals));
        }

        // Default Links if empty
        if (!localStorage.getItem(this.linksKey)) {
            const defaultLinks = [
                { id: '1', title: 'Chronos GitHub Repo', category: 'DEV', url: 'https://github.com/PERSONARPGGG/TodoList.git' },
                { id: '2', title: 'ETF Portfolio Tracker', category: 'FINANCE', url: 'https://finance.yahoo.com' },
                { id: '3', title: 'Gemini AI Studio', category: 'AI', url: 'https://aistudio.google.com' },
                { id: '4', title: 'Notion Workspace', category: 'OPS', url: 'https://notion.so' }
            ];
            localStorage.setItem(this.linksKey, JSON.stringify(defaultLinks));
        }

        // Default Settings
        if (!localStorage.getItem(this.settingsKey)) {
            const defaultSettings = {
                notificationsEnabled: false,
                notifyBeforeMinutes: 10,
                soundEnabled: true
            };
            localStorage.setItem(this.settingsKey, JSON.stringify(defaultSettings));
        }
    }

    /* ================= Task Management ================= */
    getTasks() {
        try {
            const data = localStorage.getItem(this.tasksKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Storage read error", e);
            return [];
        }
    }

    addTask(task) {
        const tasks = this.getTasks();
        const newTask = {
            id: task.id || Date.now().toString(),
            title: task.title,
            time: task.time,
            type: task.type || 'normal',
            completed: false,
            completedAt: null,
            delayCount: 0
        };
        tasks.push(newTask);
        this._saveTasks(tasks);
        return newTask;
    }

    deleteTask(id) {
        let tasks = this.getTasks();
        tasks = tasks.filter(t => t.id !== id);
        this._saveTasks(tasks);
    }

    completeTask(id) {
        const tasks = this.getTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = true;
            task.completedAt = new Date().toISOString();
            this._saveTasks(tasks);
        }
    }

    uncompleteTask(id) {
        const tasks = this.getTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = false;
            task.completedAt = null;
            this._saveTasks(tasks);
        }
    }

    updateTaskTime(id, newTime) {
        const tasks = this.getTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.time = newTime;
            task.delayCount = (task.delayCount || 0) + 1;
            this._saveTasks(tasks);
        }
    }

    delayTask(id, minutes) {
        const tasks = this.getTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            const baseTime = new Date(task.time) > new Date() ? new Date(task.time) : new Date();
            const newTime = new Date(baseTime.getTime() + minutes * 60 * 1000).toISOString();
            task.time = newTime;
            task.delayCount = (task.delayCount || 0) + 1;
            this._saveTasks(tasks);
            return newTime;
        }
        return null;
    }

    getNextTask() {
        const tasks = this.getTasks();
        // Pending tasks only
        const pendingTasks = tasks.filter(t => !t.completed);
        if (pendingTasks.length === 0) return null;
        
        // Find overdue or next closest
        return pendingTasks[0];
    }

    _saveTasks(tasks) {
        // Enforce chronological sorting: incomplete first by time, then completed
        tasks.sort((a, b) => {
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;
            return new Date(a.time) - new Date(b.time);
        });
        localStorage.setItem(this.tasksKey, JSON.stringify(tasks));
    }

    /* ================= Productivity Stats ================= */
    getStats() {
        const tasks = this.getTasks();
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const totalDelays = tasks.reduce((sum, t) => sum + (t.delayCount || 0), 0);
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 100;

        // ENTJ Grade Calculation
        let grade = 'S';
        if (completionRate < 60 || totalDelays > 5) grade = 'C';
        else if (completionRate < 80 || totalDelays > 2) grade = 'B';
        else if (completionRate < 95 || totalDelays > 0) grade = 'A';

        return {
            total,
            completed,
            pending,
            totalDelays,
            completionRate,
            grade
        };
    }

    /* ================= Goals Management ================= */
    getGoals() {
        try {
            return JSON.parse(localStorage.getItem(this.goalsKey));
        } catch {
            return { shortTerm: '', longTerm: '' };
        }
    }

    saveGoals(shortTerm, longTerm) {
        const goals = { shortTerm, longTerm };
        localStorage.setItem(this.goalsKey, JSON.stringify(goals));
    }

    /* ================= Network Links ================= */
    getLinks() {
        try {
            return JSON.parse(localStorage.getItem(this.linksKey)) || [];
        } catch {
            return [];
        }
    }

    addLink(title, category, url) {
        const links = this.getLinks();
        links.push({
            id: Date.now().toString(),
            title,
            category: (category || 'GENERAL').toUpperCase(),
            url: url.startsWith('http') ? url : `https://${url}`
        });
        localStorage.setItem(this.linksKey, JSON.stringify(links));
    }

    deleteLink(id) {
        let links = this.getLinks();
        links = links.filter(l => l.id !== id);
        localStorage.setItem(this.linksKey, JSON.stringify(links));
    }

    /* ================= Settings ================= */
    getSettings() {
        try {
            return JSON.parse(localStorage.getItem(this.settingsKey)) || {};
        } catch {
            return {};
        }
    }

    saveSettings(settings) {
        localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    }
}
