/**
 * Uploads photos direct-to-Cloudinary using the backend's signed params
 * (POST /uploads/signature) — the file never passes through the API.
 * When the backend has no Cloudinary keys it answers mock_mode, and we fall
 * back to letting the user paste image URLs so the flow still works end-to-end.
 *
 * Vanilla form of PhotoUploader.jsx: owns its element and its photo list, and
 * calls `onChange` so the surrounding form can read the current URLs.
 */
import axios from 'axios';
import { html, toHTML, on, wireImageFallbacks } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import api, { errMsg } from '../api/client.js';
import toast from '../lib/toast.js';

export function createPhotoUploader({
  photos = [],
  onChange,
  max = 5,
  label = 'Photos of the item',
} = {}) {
  const root = document.createElement('div');
  let current = [...photos];
  let uploading = false;
  let showUrlField = false;

  function commit(next) {
    current = next;
    onChange?.([...current]);
    paint();
  }

  function paint() {
    const thumbs = current.map(
      (url, i) => html`
        <div
          class="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
        >
          <img src="${url}" alt="Photo ${i + 1}" class="h-full w-full object-cover" data-fallback />
          <button
            type="button"
            data-remove="${i}"
            class="absolute right-0.5 top-0.5 rounded-full bg-slate-900/70 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
            aria-label="Remove photo"
          >
            ${icon('X', 'h-3.5 w-3.5')}
          </button>
        </div>
      `
    );

    root.innerHTML = toHTML(html`
      <span class="label">${label}</span>
      <div class="flex flex-wrap gap-3">
        ${thumbs}
        ${current.length < max &&
        html`
          <button
            type="button"
            data-pick
            ${uploading ? 'disabled' : ''}
            class="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-brand-400 hover:text-brand-500"
          >
            ${uploading ? icon('Loader2', 'h-5 w-5 animate-spin') : icon('ImagePlus', 'h-5 w-5')}
            <span class="text-[10px]">${uploading ? 'Uploading' : 'Add photo'}</span>
          </button>
        `}
      </div>
      <input data-file type="file" accept="image/*" multiple hidden />
      <div class="mt-2">
        ${!showUrlField && current.length < max
          ? html`
              <button
                type="button"
                data-show-url
                class="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-500"
              >
                ${icon('Link2', 'h-3.5 w-3.5')} or paste an image URL
              </button>
            `
          : ''}
        ${showUrlField && current.length < max
          ? html`
              <div class="mt-1 flex gap-2">
                <input data-url class="input" placeholder="https://example.com/photo.jpg" />
                <button type="button" data-add-url class="btn-secondary shrink-0">Add</button>
              </div>
            `
          : ''}
      </div>
    `);

    wireImageFallbacks(root);
  }

  async function handleFiles(files) {
    if (!files?.length) return;
    uploading = true;
    paint();
    try {
      const { data: sig } = await api.post('/uploads/signature');
      if (sig.mock_mode) {
        showUrlField = true;
        toast('Image hosting is not configured on the server — paste an image URL instead.', {
          icon: 'ℹ️',
        });
        return;
      }
      // Accumulate locally so each upload adds to the list rather than racing.
      let next = [...current];
      for (const file of Array.from(files).slice(0, max - current.length)) {
        const form = new FormData();
        form.append('file', file);
        form.append('api_key', sig.api_key);
        form.append('timestamp', sig.timestamp);
        form.append('folder', sig.folder);
        form.append('signature', sig.signature);
        const { data } = await axios.post(sig.upload_url, form);
        next = [...next, data.secure_url];
        current = next;
        onChange?.([...current]);
      }
    } catch (err) {
      toast.error(errMsg(err, 'Upload failed'));
    } finally {
      uploading = false;
      paint();
    }
  }

  function addUrl(value) {
    const url = value.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      toast.error('Enter a valid URL (https://…)');
      return;
    }
    commit([...current, url]);
  }

  on(root, 'click', '[data-pick]', () => root.querySelector('[data-file]').click());
  on(root, 'click', '[data-show-url]', () => {
    showUrlField = true;
    paint();
  });
  on(root, 'click', '[data-remove]', (_e, btn) => {
    const i = Number(btn.dataset.remove);
    commit(current.filter((_, j) => j !== i));
  });
  on(root, 'click', '[data-add-url]', () => addUrl(root.querySelector('[data-url]').value));
  on(root, 'keydown', '[data-url]', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addUrl(e.target.value);
    }
  });
  on(root, 'change', '[data-file]', (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  });

  paint();

  return {
    el: root,
    getPhotos: () => [...current],
    setPhotos: (next) => commit([...next]),
  };
}
