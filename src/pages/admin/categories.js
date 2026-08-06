import { html, toHTML, on } from '../../lib/dom.js';
import { icon } from '../../lib/icons.js';
import api, { errMsg } from '../../api/client.js';
import { Spinner, EmptyState, PageHeader, openModal } from '../../components/ui.js';
import toast from '../../lib/toast.js';

export default function Categories(root) {
  let categories = null;
  let cancelled = false;

  root.innerHTML = toHTML(Spinner());
  load();

  function load() {
    api
      .get('/categories')
      .then(({ data }) => (categories = data.categories))
      .catch(() => (categories = []))
      .finally(() => {
        if (!cancelled) paint();
      });
  }

  function openCreateModal() {
    const modal = openModal({
      title: 'New service category',
      content: html`
        <div class="space-y-4">
          <div>
            <label class="label" for="cname">Category name</label>
            <input id="cname" data-name class="input" placeholder="e.g. Solar Systems" />
            <p class="mt-1 text-xs text-slate-500">The URL slug is derived from the name.</p>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" data-cancel class="btn-secondary">Cancel</button>
            <button type="button" data-confirm class="btn-primary">Create category</button>
          </div>
        </div>
      `,
    });

    const nameField = modal.body.querySelector('[data-name]');
    const confirm = modal.body.querySelector('[data-confirm]');

    async function create() {
      const name = nameField.value.trim();
      if (!name) return toast.error('Enter a category name');

      confirm.disabled = true;
      confirm.textContent = 'Creating…';
      modal.dismissable = false;
      try {
        await api.post('/categories', { name });
        toast.success('Category created');
        modal.dismissable = true;
        modal.close();
        load();
      } catch (err) {
        toast.error(errMsg(err, 'Could not create category'));
        modal.dismissable = true;
        confirm.disabled = false;
        confirm.textContent = 'Create category';
      }
    }

    modal.body.querySelector('[data-cancel]').addEventListener('click', () => modal.close());
    confirm.addEventListener('click', create);
    nameField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') create();
    });
    nameField.focus();
  }

  function paint() {
    root.innerHTML = toHTML(html`
      <div>
        ${PageHeader({
          title: 'Service categories',
          subtitle: 'Categories technicians pick from, and customers file requests against.',
          action: html`<button type="button" data-new class="btn-primary">
            ${icon('Plus', 'h-4 w-4')} New category
          </button>`,
        })}
        ${categories.length === 0
          ? EmptyState({ iconName: 'Tag', title: 'No categories yet' })
          : html`
              <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                ${categories.map(
                  (c) => html`
                    <div class="card flex items-center gap-3 p-4">
                      <span
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-surface text-brand-500"
                        >${icon('Tag', 'h-4 w-4')}</span
                      >
                      <div class="min-w-0">
                        <p class="truncate font-medium text-slate-900">${c.name}</p>
                        <p class="truncate text-xs text-slate-500">${c.slug}</p>
                      </div>
                    </div>
                  `
                )}
              </div>
            `}
      </div>
    `);
  }

  const off = on(root, 'click', '[data-new]', () => openCreateModal());

  return () => {
    cancelled = true;
    off();
  };
}
