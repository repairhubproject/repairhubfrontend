import { html, toHTML, on } from '../../lib/dom.js';
import { icon } from '../../lib/icons.js';
import api, { errMsg } from '../../api/client.js';
import { createPhotoUploader } from '../../components/photo-uploader.js';
import { Spinner, PageHeader } from '../../components/ui.js';
import toast from '../../lib/toast.js';

const STATUS_BANNERS = {
  pending: {
    cls: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: 'Clock',
    text: 'Your profile is awaiting admin verification. You can keep editing meanwhile.',
  },
  approved: {
    cls: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: 'BadgeCheck',
    text: 'You are verified! Customers can find you and you can quote on requests.',
  },
  rejected: {
    cls: 'border-red-200 bg-red-50 text-red-800',
    icon: 'AlertTriangle',
    text: 'Your verification was rejected. Update your details and ID document, then contact support.',
  },
};

export default function TechProfileForm(root, ctx) {
  let categories = [];
  let profile = undefined; // undefined = loading, null = new
  let idDoc = [];
  let coords = null;
  let busy = false;
  let cancelled = false;

  const form = {
    bio: '',
    skills: '',
    address: '',
    service_radius_km: 20,
    base_fee: '',
    is_available: true,
    category_ids: [],
  };

  root.innerHTML = toHTML(Spinner());

  Promise.all([
    api
      .get('/categories')
      .then(({ data }) => (categories = data.categories))
      .catch(() => {}),
    api
      .get('/technicians/me')
      .then(({ data }) => {
        const p = data.profile;
        profile = p;
        Object.assign(form, {
          bio: p.bio || '',
          skills: p.skills || '',
          address: p.address || '',
          service_radius_km: p.service_radius_km ?? 20,
          base_fee: p.base_fee != null ? String(Number(p.base_fee)) : '',
          is_available: p.is_available,
          category_ids: p.categories.map((c) => c.id),
        });
        if (p.id_document_url) idDoc = [p.id_document_url];
      })
      .catch(() => (profile = null)), // 400 = no profile yet
  ]).then(() => {
    if (!cancelled) paint();
  });

  function paint() {
    const banner = STATUS_BANNERS[profile?.verification_status];

    root.innerHTML = toHTML(html`
      <div class="mx-auto max-w-2xl">
        ${PageHeader({
          title: profile ? 'Service profile' : 'Set up your service profile',
          subtitle: 'This is what customers see when comparing technicians.',
        })}
        ${banner &&
        html`
          <div class="mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${banner.cls}">
            ${icon(banner.icon, 'mt-0.5 h-5 w-5 shrink-0')}
            <p>${banner.text}</p>
          </div>
        `}

        <form data-form class="card space-y-5 p-5 sm:p-8">
          <div>
            <span class="label">Service categories</span>
            <div class="flex flex-wrap gap-2">
              ${categories.map(
                (c) => html`
                  <button
                    type="button"
                    data-category="${c.id}"
                    class="rounded-full px-3 py-1.5 text-sm font-medium transition ${form.category_ids.includes(
                      c.id
                    )
                      ? 'bg-brand-500 text-white'
                      : 'bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50'}"
                  >
                    ${c.name}
                  </button>
                `
              )}
            </div>
          </div>

          <div>
            <label class="label" for="bio">About you</label>
            <textarea
              id="bio"
              data-bio
              rows="3"
              class="input"
              placeholder="e.g. Phone repair specialist with 5 years of experience. Same-day fixes for most screen and battery issues."
            >${form.bio}</textarea>
          </div>

          <div>
            <label class="label" for="skills">Skills</label>
            <input
              id="skills"
              data-skills
              class="input"
              placeholder="e.g. screen replacement, battery, water damage recovery"
              value="${form.skills}"
            />
            <p class="mt-1 text-xs text-slate-500">Comma-separated — customers can search these.</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="label" for="address">Workshop / base address</label>
              <div class="flex gap-2">
                <input
                  id="address"
                  data-address
                  class="input"
                  placeholder="e.g. Ikeja, Lagos"
                  value="${form.address}"
                />
                <button type="button" data-gps title="Use GPS" class="btn-secondary shrink-0 px-3">
                  ${icon('LocateFixed', 'h-4 w-4')}
                </button>
              </div>
            </div>
            <div>
              <label class="label" for="radius">Service radius (km)</label>
              <input
                id="radius"
                data-radius
                type="number"
                min="1"
                max="200"
                class="input"
                value="${form.service_radius_km}"
              />
            </div>
          </div>

          <div>
            <label class="label" for="fee"
              >Base call-out fee (₦) <span class="font-normal text-slate-400">(optional)</span></label
            >
            <input
              id="fee"
              data-fee
              type="number"
              min="0"
              class="input"
              placeholder="e.g. 2000"
              value="${form.base_fee}"
            />
          </div>

          <div data-uploader></div>

          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              data-available
              class="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
              ${form.is_available ? 'checked' : ''}
            />
            I&apos;m currently available for new jobs
          </label>

          <button type="submit" data-submit class="btn-primary w-full py-3.5">
            ${profile ? 'Save changes' : 'Create profile & request verification'}
          </button>
        </form>
      </div>
    `);

    const uploader = createPhotoUploader({
      photos: idDoc,
      onChange: (next) => (idDoc = next),
      max: 1,
      label: "ID document (NIN slip, driver's licence, or voter's card) — required for verification",
    });
    root.querySelector('[data-uploader]').replaceWith(uploader.el);

    const gpsBtn = root.querySelector('[data-gps]');
    const addressField = root.querySelector('[data-address]');

    gpsBtn.addEventListener('click', () => {
      if (!navigator.geolocation) return toast.error('Geolocation not supported');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          coords = { lat, lng };
          toast.success('Workshop location set from GPS');
          gpsBtn.classList.add('border-emerald-300', 'bg-emerald-50', 'text-emerald-700');
          try {
            const { data } = await api.get('/geo/reverse', { params: { lat, lng } });
            if (data.location?.display_name) {
              form.address = data.location.display_name;
              addressField.value = form.address;
            }
          } catch {
            /* coords are still attached */
          }
        },
        () => toast.error('Could not get location — your address will be geocoded instead')
      );
    });

    root.querySelector('[data-form]').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (busy) return;
      if (form.category_ids.length === 0)
        return toast.error('Pick at least one service category');

      const read = (sel) => root.querySelector(sel).value;
      const submit = root.querySelector('[data-submit]');
      const original = submit.textContent;

      busy = true;
      submit.disabled = true;
      submit.textContent = 'Saving…';
      try {
        const baseFee = read('[data-fee]');
        await api.put('/technicians/me', {
          bio: read('[data-bio]').trim() || undefined,
          skills: read('[data-skills]').trim() || undefined,
          address: read('[data-address]').trim() || undefined,
          service_radius_km: Number(read('[data-radius]')) || undefined,
          base_fee: baseFee === '' ? undefined : Number(baseFee),
          is_available: root.querySelector('[data-available]').checked,
          category_ids: form.category_ids,
          id_document_url: idDoc[0],
          ...(coords || {}),
        });
        toast.success(profile ? 'Profile updated' : 'Profile created — awaiting admin verification');
        ctx.navigate('/dashboard');
      } catch (err) {
        toast.error(errMsg(err, 'Could not save profile'));
        busy = false;
        submit.disabled = false;
        submit.textContent = original;
      }
    });
  }

  const off = on(root, 'click', '[data-category]', (_e, btn) => {
    const id = Number(btn.dataset.category);
    const on_ = form.category_ids.includes(id);
    form.category_ids = on_
      ? form.category_ids.filter((c) => c !== id)
      : [...form.category_ids, id];
    btn.className = `rounded-full px-3 py-1.5 text-sm font-medium transition ${
      on_
        ? 'bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50'
        : 'bg-brand-500 text-white'
    }`;
  });

  return () => {
    cancelled = true;
    off();
  };
}
