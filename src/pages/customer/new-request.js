/**
 * "Create Repair Request" — Figma frames 970:411 (details) and 973:494 (photos).
 * The board splits this into two steps behind a Continue button.
 *
 * The API accepts { category_id, title, description, photos, address, lat, lng }.
 * Brand/Model have no catalogue endpoint, so they are free text and compose the
 * required `title`; the serial number has no column and is folded into the
 * description rather than dropped.
 */
import { html, toHTML } from '../../lib/dom.js';
import { icon } from '../../lib/icons.js';
import api, { errMsg } from '../../api/client.js';
import { createPhotoUploader } from '../../components/photo-uploader.js';
import toast from '../../lib/toast.js';

export default function NewRequest(root, ctx) {
  let step = 1;
  let categories = [];
  let photos = [];
  let coords = null;
  let busy = false;
  let cancelled = false;

  const form = {
    category_id: '',
    brand: '',
    model: '',
    serial: '',
    description: '',
    address: '',
  };

  const categoryName = () =>
    categories.find((c) => String(c.id) === String(form.category_id))?.name || '';
  const title = () =>
    [form.brand.trim(), form.model.trim()].filter(Boolean).join(' ') || categoryName();

  root.innerHTML = toHTML(html`
    <div>
      <a
        href="/requests"
        class="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-500"
      >
        ${icon('ArrowLeft', 'h-4 w-4')} My requests
      </a>

      <div class="rounded-3xl bg-gradient-to-br from-brand-500 via-[#3264C4] to-[#8FC3FF] p-6 sm:p-12">
        <div
          class="mx-auto max-w-md rounded-2xl bg-gradient-to-b from-white to-brand-surface p-6 shadow-lg sm:p-8"
        >
          <!-- Full lockup — the artwork already carries the "REPAIR HUB"
               wordmark, so no text label goes beneath it. -->
          <img
            src="/logo-4.png"
            alt="RepairHub"
            width="211"
            height="181"
            class="mx-auto h-20 w-auto object-contain"
          />
          <h1 class="mt-4 text-center text-lg font-semibold text-slate-900">Create Repair Request</h1>

          <!-- Step indicator -->
          <div class="mt-5 flex items-center gap-2" aria-hidden="true">
            <span data-step="1" class="h-1.5 flex-1 rounded-full bg-brand-500"></span>
            <span data-step="2" class="h-1.5 flex-1 rounded-full bg-slate-200"></span>
          </div>

          <div data-step-body></div>
        </div>
      </div>
    </div>
  `);

  const stepBody = root.querySelector('[data-step-body]');

  api
    .get('/categories')
    .then(({ data }) => {
      if (cancelled) return;
      categories = data.categories;
      if (step === 1) paintStep1();
    })
    .catch(() => {});

  function paintIndicator() {
    root.querySelector('[data-step="2"]').className = `h-1.5 flex-1 rounded-full ${
      step >= 2 ? 'bg-brand-500' : 'bg-slate-200'
    }`;
  }

  /** Keep typed values when the step re-renders after categories arrive. */
  function readStep1() {
    const get = (sel) => stepBody.querySelector(sel)?.value;
    form.category_id = get('[data-category]') ?? form.category_id;
    form.serial = get('[data-serial]') ?? form.serial;
    form.brand = get('[data-brand]') ?? form.brand;
    form.model = get('[data-model]') ?? form.model;
    form.description = get('[data-description]') ?? form.description;
  }

  function paintStep1() {
    readStep1();
    stepBody.innerHTML = toHTML(html`
      <form data-form class="mt-6 space-y-4">
        <div>
          <label class="label" for="type">Select Type</label>
          <select id="type" data-category required class="input">
            <option value="">Select a category…</option>
            ${categories.map(
              (c) => html`<option value="${c.id}" ${String(c.id) === String(form.category_id) ? 'selected' : ''}>
                ${c.name}
              </option>`
            )}
          </select>
        </div>

        <div>
          <label class="label" for="serial"
            >Device serial Number <span class="font-normal text-slate-400">(optional)</span></label
          >
          <div class="relative">
            <input
              id="serial"
              data-serial
              class="input pr-11"
              placeholder="Enter serial number"
              value="${form.serial}"
            />
            ${icon('ScanLine', 'absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400')}
          </div>
        </div>

        <div>
          <label class="label" for="brand">Brand</label>
          <input id="brand" data-brand class="input" placeholder="e.g. Samsung" value="${form.brand}" />
        </div>

        <div>
          <label class="label" for="model">Model</label>
          <input id="model" data-model class="input" placeholder="e.g. Galaxy S20" value="${form.model}" />
        </div>

        <div>
          <label class="label" for="description">What needs to be repaired</label>
          <textarea
            id="description"
            data-description
            rows="3"
            required
            class="input"
            placeholder="e.g. Screen isn't working"
          >${form.description}</textarea>
        </div>

        <button type="submit" class="btn-primary w-full rounded-full py-3.5">Continue</button>
      </form>
    `);

    stepBody.querySelector('[data-form]').addEventListener('submit', (e) => {
      e.preventDefault();
      readStep1();
      if (!form.category_id) return toast.error('Select what type of device needs repair');
      if (!title()) return toast.error('Enter the brand or model of the device');
      if (!form.description.trim()) return toast.error('Describe what needs to be repaired');
      step = 2;
      paintIndicator();
      paintStep2();
    });
  }

  function paintStep2() {
    stepBody.innerHTML = toHTML(html`
      <div class="mt-6 space-y-5">
        <div data-uploader></div>

        <div>
          <label class="label" for="address">Your location</label>
          <div class="flex flex-col gap-2">
            <input
              id="address"
              data-address
              class="input"
              placeholder="e.g. Yaba, Lagos"
              value="${form.address}"
            />
            <button type="button" data-gps class="btn-secondary">
              ${icon('LocateFixed', 'h-4 w-4')} <span data-gps-label>Use GPS</span>
            </button>
          </div>
          <p class="mt-1.5 text-xs text-slate-500">
            Used to match you with technicians who serve your area. Leave blank to use your
            approximate location automatically.
          </p>
        </div>

        <div class="rounded-xl bg-white/70 p-3 text-sm">
          <p class="font-medium text-slate-900">${title()}</p>
          <p class="text-slate-500">${categoryName()}</p>
        </div>

        <div class="flex gap-2">
          <button type="button" data-back class="btn-secondary flex-1 rounded-full">Back</button>
          <button type="button" data-post class="btn-primary flex-1 rounded-full">Post request</button>
        </div>
      </div>
    `);

    const uploader = createPhotoUploader({
      photos,
      onChange: (next) => (photos = next),
      label: 'Add photos of the device',
    });
    stepBody.querySelector('[data-uploader]').replaceWith(uploader.el);

    const addressField = stepBody.querySelector('[data-address]');
    const gpsBtn = stepBody.querySelector('[data-gps]');

    addressField.addEventListener('input', () => (form.address = addressField.value));

    gpsBtn.addEventListener('click', () => {
      if (!navigator.geolocation) return toast.error('Geolocation not supported');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          coords = { lat, lng };
          toast.success('Precise location attached');
          gpsBtn.classList.add('border-emerald-300', 'bg-emerald-50', 'text-emerald-700');
          gpsBtn.querySelector('[data-gps-label]').textContent = 'Location attached';
          try {
            const { data } = await api.get('/geo/reverse', { params: { lat, lng } });
            if (data.location?.display_name) {
              form.address = data.location.display_name;
              addressField.value = form.address;
            }
          } catch {
            /* coords are still attached — the address text is a nicety */
          }
        },
        () => toast.error('Could not get location — enter your address instead')
      );
    });

    stepBody.querySelector('[data-back]').addEventListener('click', () => {
      if (busy) return;
      step = 1;
      paintIndicator();
      paintStep1();
    });

    stepBody.querySelector('[data-post]').addEventListener('click', async (e) => {
      if (busy) return;
      busy = true;
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Posting…';
      try {
        const description = [
          form.description.trim(),
          form.serial.trim() && `Serial number: ${form.serial.trim()}`,
        ]
          .filter(Boolean)
          .join('\n\n');

        const { data } = await api.post('/requests', {
          category_id: Number(form.category_id),
          title: title(),
          description,
          address: form.address.trim() || undefined,
          photos,
          ...(coords || {}),
        });
        toast.success('Request posted — nearby technicians have been notified!');
        ctx.navigate(`/requests/${data.request.id}`);
      } catch (err) {
        toast.error(errMsg(err, 'Could not create request'));
        busy = false;
        btn.disabled = false;
        btn.textContent = 'Post request';
      }
    });
  }

  paintStep1();

  return () => {
    cancelled = true;
  };
}
