/** Settings screen: notification preferences, daily briefing and local backup tools. */
import { i18n } from '../i18n.js';
import { isValidBriefingTime } from '../core/briefing.js';
import { $, setText } from './dom.js';
import { requestPermission } from './notifications.js';
import { APP_VERSION } from '../config.js';

export class SettingsView {
    constructor(ui) {
        this.ui = ui;
    }

    get store() { return this.ui.store; }

    bind() {
        $('btn-save-settings')?.addEventListener('click', () => this.save());
        $('btn-settings-notify')?.addEventListener('click', () => requestPermission(message => this.ui.showAlert(message)));

        $('btn-export-json')?.addEventListener('click', () => {
            const blob = new Blob([this.store.exportAllData()], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `chronos_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });

        const fileInput = $('file-import-json');
        $('btn-import-json-trigger')?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', event => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                if (!this.store.importData(e.target.result)) {
                    this.ui.showAlert(i18n.t('importInvalid'));
                    return;
                }
                this.ui.alerts.reset();
                this.ui.renderAll();
                this.ui.playSlashEffect(i18n.t('fxRestored'));
            };
            reader.readAsText(file);
            fileInput.value = '';
        });
    }

    render() {
        const settings = this.store.getSettings();
        const enabled = $('input-daily-briefing');
        const time = $('input-briefing-time');
        const lead = $('input-notify-before');
        if (enabled) enabled.checked = !!settings.dailyBriefingEnabled;
        if (time) time.value = settings.dailyBriefingTime || '08:00';
        if (lead) lead.value = String(settings.notifyBeforeMinutes ?? 10);
        setText('settings-version', `v${APP_VERSION}`);
    }

    save() {
        const time = $('input-briefing-time')?.value || '08:00';
        const lead = Number($('input-notify-before')?.value);
        if (!isValidBriefingTime(time) || !Number.isFinite(lead) || lead < 0 || lead > 1440) {
            this.ui.showAlert(i18n.t('settingsInvalid'));
            return false;
        }
        this.store.saveSettings({
            dailyBriefingEnabled: !!$('input-daily-briefing')?.checked,
            dailyBriefingTime: time,
            notifyBeforeMinutes: Math.floor(lead)
        });
        this.ui.playSlashEffect(i18n.t('settingsSaved'));
        return true;
    }
}
