/**
 * Network tab: category filter, portal list, add-portal modal.
 */
import { i18n } from '../i18n.js';
import { escapeHTML, safeUrl } from '../utils.js';
import { $, delegate } from './dom.js';

const FILTER_OFF = 'px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-gray-900 text-gray-400 hover:text-white filter-btn';
const FILTER_ON = 'px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-yellow-400 text-black filter-btn active';

export class LinksView {
    /** @param {import('../ui.js').UI} ui */
    constructor(ui) {
        this.ui = ui;
        this.editingLinkId = null;
    }

    get store() {
        return this.ui.store;
    }

    bind() {
        document.querySelectorAll('#link-category-filter .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#link-category-filter .filter-btn').forEach(b => { b.className = FILTER_OFF; });
                btn.className = FILTER_ON;
                this.ui.state.linkCategory = btn.dataset.cat;
                this.render();
            });
        });

        delegate($('link-list'), '[data-action="delete-link"]', (btn) => {
            this.store.deleteLink(btn.dataset.id);
            this.render();
        });
        delegate($('link-list'), '[data-action="edit-link"]', (btn) => {
            const link = this.store.getLinks().find(item => item.id === btn.dataset.id);
            if (!link) return;
            this.editingLinkId = link.id;
            $('input-link-title').value = link.title;
            $('input-link-url').value = link.url === '#' ? '' : link.url;
            $('input-link-cat').value = link.category;
            this.ui.modals.open($('add-link-modal'), $('input-link-title'));
        });

        const modal = $('add-link-modal');
        $('btn-add-link')?.addEventListener('click', () => {
            this.editingLinkId = null;
            $('input-link-title').value = '';
            $('input-link-url').value = '';
            this.ui.modals.open(modal, $('input-link-title'));
        });
        $('btn-cancel-link')?.addEventListener('click', () => this.ui.modals.close(modal));
        $('btn-save-link')?.addEventListener('click', () => {
            const title = $('input-link-title').value.trim();
            const url = $('input-link-url').value.trim();
            if (!title || !url) return;
            const category = $('input-link-cat').value.trim();
            if (this.editingLinkId) this.store.updateLink(this.editingLinkId, { title, category, url });
            else this.store.addLink(title, category, url);
            this.editingLinkId = null;
            this.render();
            this.ui.modals.close(modal);
        });
    }

    render() {
        const list = $('link-list');
        if (!list) return;

        const category = this.ui.state.linkCategory;
        const links = this.store.getLinks().filter(l => category === 'ALL' || l.category === category);

        if (links.length === 0) {
            list.innerHTML = `
                <div class="p-6 text-center text-xs text-gray-600 font-mono border border-dashed border-gray-900 rounded">
                    ${escapeHTML(i18n.t('noPortals'))} [${escapeHTML(category)}].
                </div>
            `;
            return;
        }

        const deleteLabel = escapeHTML(i18n.t('deleteTitle'));
        list.innerHTML = links.map(link => {
            const href = escapeHTML(safeUrl(link.url));
            return `
            <div class="task-card-persona p-3 flex items-center justify-between border-l-4 border-yellow-500 group">
                <a href="${href}" target="_blank" rel="noopener noreferrer" class="min-w-0 flex-1 block">
                    <span class="text-[9px] font-mono text-yellow-400 font-bold uppercase tracking-wider block mb-0.5">${escapeHTML(link.category)}</span>
                    <h4 class="font-bold text-white text-sm group-hover:text-yellow-300 transition-colors truncate">${escapeHTML(link.title)}</h4>
                    <span class="text-[11px] font-mono text-gray-500 block truncate">${href}</span>
                </a>
                <div class="flex shrink-0 items-center">
                <button data-action="edit-link" data-id="${escapeHTML(link.id)}" aria-label="Edit ${escapeHTML(link.title)}" class="text-gray-600 hover:text-yellow-300 p-2 transition-colors">✎</button>
                <button data-action="delete-link" data-id="${escapeHTML(link.id)}" aria-label="${deleteLabel}: ${escapeHTML(link.title)}" class="text-gray-600 hover:text-red-500 p-2 transition-colors">
                    <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                </div>
            </div>
        `;
        }).join('');
    }
}
