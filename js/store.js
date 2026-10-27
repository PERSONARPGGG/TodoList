/**
 * Store Module (Offline-First Data Layer)
 * Manages Tasks, Daily Routines, Productivity Stats, Goals, Network Links, and Settings.
 * STRICT ISOLATION: No DOM dependencies.
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
                dailyBriefingTime: '08:00'
            };
            localStorage.setItem(this.settingsKey, JSON.stringify(defaultSettings));
        }
    }

    /* ================= NLP Fast Parser ================= */
    /**
     * Parses natural language input (Korean/English) into task title, target ISO time, and isDaily flag.
     * Examples:
     * - "매일 08:00 아침 브리핑" -> { title: "아침 브리핑", isDaily: true, time: ... }
     * - "30분 뒤 코드 검토" -> { title: "코드 검토", isDaily: false, time: +30m }
     * - "내일 14:00 회의" -> { title: "회의", isDaily: false, time: tomorrow 14:00 }
     */
    parseQuickInput(text) {
        let cleanText = text.trim();
        let isDaily = false;
        let targetTime = new Date();
        let matchedTime = false;

        // Check Daily keyword
        if (/(매일|daily|everyday)/i.test(cleanText)) {
            isDaily = true;
            cleanText = cleanText.replace(/(매일|daily|everyday)/gi, '').trim();
        }

        // Check relative minutes: "+30m", "30분 뒤", "30분후"
        const relMinMatch = cleanText.match(/(\d+)\s*(분\s*(뒤|후)|m|min)/i);
        if (relMinMatch) {
            const mins = parseInt(relMinMatch[1], 10);
            targetTime = new Date(Date.now() + mins * 60 * 1000);
            cleanText = cleanText.replace(relMinMatch[0], '').trim();
            matchedTime = true;
        }

        // Check relative hours: "+2h", "2시간 뒤", "2시간후"
        const relHourMatch = cleanText.match(/(\d+)\s*(시간\s*(뒤|후)|h|hour|hours)/i);
        if (!matchedTime && relHourMatch) {
            const hours = parseInt(relHourMatch[1], 10);
            targetTime = new Date(Date.now() + hours * 3600 * 1000);
            cleanText = cleanText.replace(relHourMatch[0], '').trim();
            matchedTime = true;
        }

        // Check "내일" / "tomorrow"
        let isTomorrow = false;
        if (/(내일|tomorrow)/i.test(cleanText)) {
            isTomorrow = true;
            cleanText = cleanText.replace(/(내일|tomorrow)/gi, '').trim();
        }

        // Check specific time: "08:00", "8시", "오후 3시", "15:30"
        const specificTimeMatch = cleanText.match(/(오전|오후)?\s*(\d{1,2})(?::(\d{2})|시(?:\s*(\d{2})분)?)?/i);
        if (!matchedTime && specificTimeMatch && specificTimeMatch[2]) {
            let hour = parseInt(specificTimeMatch[2], 10);
            const minute = parseInt(specificTimeMatch[3] || specificTimeMatch[4] || '0', 10);
            const meridiem = specificTimeMatch[1];

            if (meridiem === '오후' && hour < 12) hour += 12;
            if (meridiem === '오전' && hour === 12) hour = 0;

            if (isTomorrow) {
                targetTime.setDate(targetTime.getDate() + 1);
            }
            targetTime.setHours(hour, minute, 0, 0);

            // If time is already past today and not marked tomorrow or daily, push to tomorrow
            if (targetTime < new Date() && !isTomorrow) {
                targetTime.setDate(targetTime.getDate() + 1);
            }

            cleanText = cleanText.replace(specificTimeMatch[0], '').trim();
            matchedTime = true;
        } else if (isTomorrow && !matchedTime) {
            targetTime.setDate(targetTime.getDate() + 1);
            targetTime.setHours(9, 0, 0, 0); // default 9am
        } else if (isDaily && !matchedTime) {
            targetTime.setHours(8, 0, 0, 0); // default daily 8am
            if (targetTime < new Date()) targetTime.setDate(targetTime.getDate() + 1);
        }

        // If no time was matched at all, default to 1 hour from now
        if (!matchedTime && !isTomorrow && !isDaily) {
            targetTime = new Date(Date.now() + 3600 * 1000);
        }

        return {
            title: cleanText || 'Quick Objective',
            time: targetTime.toISOString(),
            isDaily
        };
    }

    /* ================= Task Management ================= */
    getTasks() {
        try {
            const data = localStorage.getItem(this.tasksKey);
            let tasks = data ? JSON.parse(data) : [];
            
            // Check Daily Routines that need auto-resetting for today
            const now = new Date();
            let changed = false;
            tasks.forEach(task => {
                if (task.isDaily && task.completed && task.completedAt) {
                    const compDate = new Date(task.completedAt);
                    // If completed on a previous day, auto-reset for today
                    if (compDate.getDate() !== now.getDate() || compDate.getMonth() !== now.getMonth()) {
                        task.completed = false;
                        task.completedAt = null;
                        const originalTime = new Date(task.time);
                        const nextRun = new Date();
                        nextRun.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);
                        if (nextRun < now) nextRun.setDate(nextRun.getDate() + 1);
                        task.time = nextRun.toISOString();
                        changed = true;
                    }
                }
            });
            if (changed) this._saveTasks(tasks);
            return tasks;
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
            isDaily: !!task.isDaily,
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
            
            // If it's a daily task, calculate next day's run time
            if (task.isDaily) {
                const curTime = new Date(task.time);
                const nextDay = new Date();
                nextDay.setDate(nextDay.getDate() + 1);
                nextDay.setHours(curTime.getHours(), curTime.getMinutes(), 0, 0);
                task.nextDailyRun = nextDay.toISOString();
            }
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
        const pendingTasks = tasks.filter(t => !t.completed);
        if (pendingTasks.length === 0) return null;
        return pendingTasks[0];
    }

    _saveTasks(tasks) {
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
        localStorage.setItem(this.goalsKey, JSON.stringify({ shortTerm, longTerm }));
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

    /* ================= JSON Backup & Restore ================= */
    exportAllData() {
        const payload = {
            version: '0.3.0',
            exportedAt: new Date().toISOString(),
            tasks: this.getTasks(),
            goals: this.getGoals(),
            links: this.getLinks(),
            settings: JSON.parse(localStorage.getItem(this.settingsKey) || '{}')
        };
        return JSON.stringify(payload, null, 2);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.tasks) localStorage.setItem(this.tasksKey, JSON.stringify(data.tasks));
            if (data.goals) localStorage.setItem(this.goalsKey, JSON.stringify(data.goals));
            if (data.links) localStorage.setItem(this.linksKey, JSON.stringify(data.links));
            if (data.settings) localStorage.setItem(this.settingsKey, JSON.stringify(data.settings));
            return true;
        } catch (e) {
            console.error("Backup parse error", e);
            return false;
        }
    }
}
