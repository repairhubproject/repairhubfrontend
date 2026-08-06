import { html, toHTML } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import api from '../api/client.js';
import { RatingStars } from '../components/ui.js';

const STEPS = [
  {
    icon: 'ClipboardList',
    title: 'Describe the problem',
    text: 'Post what needs fixing, add photos and your location. It takes a minute.',
  },
  {
    icon: 'Handshake',
    title: 'Compare quotations',
    text: 'Verified technicians nearby send prices and timelines. Pick on trust, not just price.',
  },
  {
    icon: 'Wrench',
    title: 'Track and pay securely',
    text: 'Follow the repair live, pay only when it is done, and get a warranty on the work.',
  },
];

const TRUST = [
  {
    icon: 'ShieldCheck',
    title: 'Verified technicians',
    text: 'Every technician is ID-checked and approved by our team before they can quote.',
  },
  {
    icon: 'Wallet',
    title: 'Protected payments',
    text: 'You pay through RepairHub after the repair is marked complete — never before.',
  },
  {
    icon: 'Star',
    title: 'Warranties included',
    text: 'Technicians issue a digital warranty on completed repairs, tracked in your account.',
  },
];

export default function Landing(root) {
  root.innerHTML = toHTML(html`
    <div>
      <!-- Hero — Figma frame 464:153 -->
      <section class="mx-auto w-[95%] max-w-6xl pb-10 pt-10">
        <p
          class="mx-auto w-fit rounded-md bg-brand-surface px-6 py-1.5 text-center text-sm font-semibold text-brand-500 sm:text-base"
        >
          Nigeria&apos;s #1 Appliance Repair Platform
        </p>

        <div class="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6">
          <div>
            <h1
              class="text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl xl:text-[3.4rem]"
            >
              Reliable Repairs.<br />Verified Technicians.<br />Zero Stress.
            </h1>
            <p class="mt-5 max-w-lg text-base text-slate-600 sm:text-lg">
              Connect with trusted technicians near you for fast, affordable, and professional home
              appliance repairs.
            </p>
            <div class="mt-8 flex flex-wrap gap-4">
              <a href="/register" class="btn-primary px-8 py-4 text-base font-bold sm:text-lg"
                >Book a Technician</a
              >
              <a href="/register" class="btn-outline px-8 py-4 text-base font-bold sm:text-lg"
                >Become a Technician</a
              >
            </div>
          </div>

          <!-- Single hero asset, exported from the board (node 480:198) and
               trimmed to its content bounds so it scales without dead margin. -->
          <img
            src="/hero-repairhub.png"
            alt="A RepairHub technician with tools beside the RepairHub mobile app"
            width="1096"
            height="797"
            class="h-auto w-full max-w-[640px] justify-self-center object-contain lg:max-w-none"
          />
        </div>

        <!-- Trust stats — measured from the API; hidden until they load, so the
             page never shows a placeholder figure. -->
        <dl data-stats hidden class="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 sm:mt-16 lg:grid-cols-4"></dl>
      </section>

      <!-- Categories -->
      <section data-categories hidden class="mx-auto w-[95%] max-w-6xl py-16">
        <h2 class="text-2xl font-bold text-slate-900">What can we fix for you?</h2>
        <p class="mt-1 text-slate-500">Browse technicians by the kind of repair you need.</p>
        <div data-category-grid class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"></div>
      </section>

      <!-- How it works -->
      <section class="bg-white py-16">
        <div class="mx-auto w-[95%] max-w-6xl">
          <h2 class="text-2xl font-bold text-slate-900">How RepairHub works</h2>
          <div class="mt-8 grid gap-6 md:grid-cols-3">
            ${STEPS.map(
              (step, i) => html`
                <div class="card p-6">
                  <span
                    class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-surface text-brand-500"
                    >${icon(step.icon, 'h-5 w-5')}</span
                  >
                  <p class="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Step ${i + 1}
                  </p>
                  <h3 class="mt-1 text-lg font-semibold text-slate-900">${step.title}</h3>
                  <p class="mt-1.5 text-sm text-slate-600">${step.text}</p>
                </div>
              `
            )}
          </div>
        </div>
      </section>

      <!-- Featured technicians -->
      <section data-techs hidden class="mx-auto w-[95%] max-w-6xl py-16">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <h2 class="text-2xl font-bold text-slate-900">Technicians near you</h2>
          <a href="/technicians" class="text-sm font-medium text-brand-500 hover:underline"
            >See all technicians →</a
          >
        </div>
        <div data-tech-grid class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"></div>
      </section>

      <!-- Trust -->
      <section class="bg-white py-16">
        <div class="mx-auto grid w-[95%] max-w-6xl gap-6 md:grid-cols-3">
          ${TRUST.map(
            (t) => html`
              <div>
                ${icon(t.icon, 'h-7 w-7 text-brand-500')}
                <h3 class="mt-3 font-semibold text-slate-900">${t.title}</h3>
                <p class="mt-1 text-sm text-slate-600">${t.text}</p>
              </div>
            `
          )}
        </div>
      </section>

      <!-- CTA -->
      <section class="mx-auto w-[95%] max-w-6xl py-16">
        <div class="rounded-3xl bg-brand-500 px-6 py-12 text-center text-white sm:px-12">
          <h2 class="text-2xl font-bold sm:text-3xl">Are you a repair technician?</h2>
          <p class="mx-auto mt-2 max-w-2xl text-brand-50">
            Get verified, receive repair requests in your area, quote on jobs and withdraw your
            earnings straight to your bank account.
          </p>
          <a
            href="/register"
            class="btn mt-6 bg-white px-7 py-3.5 text-base font-semibold text-brand-500 hover:bg-brand-surface focus:ring-white"
            >Join as a technician</a
          >
        </div>
      </section>
    </div>
  `);

  const categoriesSection = root.querySelector('[data-categories]');
  const categoryGrid = root.querySelector('[data-category-grid]');
  const techsSection = root.querySelector('[data-techs]');
  const techGrid = root.querySelector('[data-tech-grid]');
  const statsList = root.querySelector('[data-stats]');

  api
    .get('/categories')
    .then(({ data }) => {
      if (!data.categories.length) return;
      categoryGrid.innerHTML = toHTML(
        data.categories.map(
          (c) => html`
            <a
              href="/technicians?category=${c.slug}"
              class="card-raised flex items-center gap-3 px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-brand-500"
                >${icon('Wrench', 'h-4 w-4')}</span
              >
              <span class="truncate text-sm font-medium text-slate-800">${c.name}</span>
            </a>
          `
        )
      );
      categoriesSection.hidden = false;
    })
    .catch(() => {});

  api
    .get('/technicians')
    .then(({ data }) => {
      const techs = data.technicians.slice(0, 3);
      if (!techs.length) return;
      techGrid.innerHTML = toHTML(
        techs.map(
          (t) => html`
            <a
              href="/technicians/${t.id}"
              class="card p-5 transition hover:border-brand-pill hover:shadow-md"
            >
              <p class="font-semibold text-slate-900">${t.name}</p>
              ${RatingStars({ value: t.rating_avg, count: t.rating_count })}
              ${t.bio && html`<p class="mt-2 line-clamp-2 text-sm text-slate-600">${t.bio}</p>`}
              <p class="mt-3 text-sm text-slate-500">${t.address || 'Nigeria'}</p>
            </a>
          `
        )
      );
      techsSection.hidden = false;
    })
    .catch(() => {});

  // Headline figures are measured from the API, not asserted. The nationwide
  // radius override stops the counts shrinking to whatever is near the
  // visitor's IP, which is what the default search does.
  Promise.all([
    api.get('/technicians', { params: { radius_km: 100000 } }),
    api.get('/categories'),
  ])
    .then(([t, c]) => {
      const list = t.data.technicians || [];
      const reviews = list.reduce((n, x) => n + (Number(x.rating_count) || 0), 0);
      const weighted = list.reduce(
        (n, x) => n + (Number(x.rating_avg) || 0) * (Number(x.rating_count) || 0),
        0
      );
      const rating = reviews > 0 ? (weighted / reviews).toFixed(1) : null;

      const cards = [
        { icon: '⭐', value: rating ?? 'New', label: rating ? 'Customer Rating' : 'Awaiting First Rating' },
        { icon: '✓', value: list.length, label: 'Verified Techs' },
        { icon: '✓', value: reviews, label: reviews === 1 ? 'Rated Repair' : 'Rated Repairs' },
        { icon: '✓', value: (c.data.categories || []).length, label: 'Service Categories' },
      ];

      statsList.innerHTML = toHTML(
        cards.map(
          (s) => html`
            <div>
              <dd class="flex items-center gap-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                <span aria-hidden="true">${s.icon}</span>${s.value}
              </dd>
              <dt class="mt-1 text-base text-brand-500 sm:text-lg">${s.label}</dt>
            </div>
          `
        )
      );
      statsList.hidden = false;
    })
    .catch(() => {});
}
