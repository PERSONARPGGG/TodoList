/**
 * Store — offline-first data facade.
 *
 * The UI talks only to this class; each domain lives in its own module:
 *   core/parser.js      natural-language quick entry (pure)
 *   core/recurrence.js  daily-routine time math (pure)
 *   data/tasks.js       tasks, ordering, rollover, stats
 *   data/links.js       network portals
 *   data/profile.js     goals + settings
 *   data/backup.js      JSON export / validated import
 *   data/storage.js     the only localStorage access point
 * STRICT ISOLATION: no DOM dependencies anywhere in this layer.
 */
import { APP_VERSION } from './config.js';
import { parseQuickInput } from './core/parser.js';
import { TaskRepository } from './data/tasks.js';
import { LinkRepository } from './data/links.js';
import { GoalRepository, SettingsRepository } from './data/profile.js';
import { exportAll, importAll } from './data/backup.js';

export { APP_VERSION };

export class Store {
    constructor() {
        this.repos = {
            tasks: new TaskRepository(),
            links: new LinkRepository(),
            goals: new GoalRepository(),
            settings: new SettingsRepository()
        };
        this.repos.goals.ensureDefaults();
        this.repos.links.ensureDefaults();
        this.repos.settings.ensureDefaults();
        this.repos.tasks.repairIds();
        this.repos.links.repairIds();
    }

    /* ---------- Parser ---------- */
    parseQuickInput(text, now = new Date()) { return parseQuickInput(text, now); }

    /* ---------- Tasks ---------- */
    getTasks(now = new Date()) { return this.repos.tasks.getAll(now); }
    addTask(task) { return this.repos.tasks.add(task); }
    updateTask(id, patch) { return this.repos.tasks.update(id, patch); }
    deleteTask(id) { this.repos.tasks.remove(id); }
    completeTask(id) { this.repos.tasks.complete(id); }
    uncompleteTask(id) { this.repos.tasks.uncomplete(id); }
    delayTask(id, minutes) { return this.repos.tasks.delay(id, minutes); }
    getNextTask() { return this.repos.tasks.next(); }
    getStats() { return this.repos.tasks.stats(); }

    /* ---------- Goals ---------- */
    getGoals() { return this.repos.goals.get(); }
    saveGoals(shortTerm, longTerm) { this.repos.goals.save(shortTerm, longTerm); }

    /* ---------- Links ---------- */
    getLinks() { return this.repos.links.getAll(); }
    addLink(title, category, url) { return this.repos.links.add(title, category, url); }
    deleteLink(id) { this.repos.links.remove(id); }

    /* ---------- Settings ---------- */
    getSettings() { return this.repos.settings.get(); }

    /* ---------- Backup ---------- */
    exportAllData() { return exportAll(this.repos); }
    importData(jsonString) { return importAll(this.repos, jsonString); }
}
