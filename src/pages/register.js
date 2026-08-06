import { html, toHTML, on } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { register } from '../state/auth.js';
import { errMsg } from '../api/client.js';
import toast from '../lib/toast.js';

const ROLES = [
  {
    value: 'customer',
    icon: 'User',
    title: 'I need a repair',
    hint: 'Post a job, compare quotes, track the fix.',
  },
  {
    value: 'technician',
    icon: 'Wrench',
    title: 'I repair things',
    hint: 'Get verified, quote on jobs, get paid.',
  },
];

export default function Register(root, ctx) {
  let role = 'customer';
  let showPassword = false;
  let busy = false;

  root.innerHTML = toHTML(html`
    <div
      class="min-h-[calc(100vh-72px)] bg-[url('/Rectangle-bg.png')] bg-cover bg-center bg-no-repeat py-8"
    >
      <div class="mx-auto w-[95%] max-w-lg rounded-3xl bg-white px-4 pb-8 sm:px-8">
        <div class="mb-6">
          <!-- Full lockup (mark + wordmark); sized on its own 211×181 aspect
               rather than forced into a square. -->
          <img
            src="/logo-4.png"
            alt="RepairHub"
            width="211"
            height="181"
            class="mx-auto -mt-4 h-32 w-auto object-contain"
          />
          <h1 class="text-xl font-bold sm:text-2xl">Create your account</h1>
          <p class="text-sm text-slate-700 sm:text-base">Join RepairHub in under a minute</p>
        </div>

        <form data-form class="flex flex-col gap-5">
          <div>
            <span class="label">I am here to…</span>
            <div class="grid grid-cols-2 gap-3">
              ${ROLES.map(
                (r) => html`
                  <button type="button" data-role="${r.value}" class="rounded-2xl border p-3 text-left transition">
                    ${icon(r.icon, 'h-5 w-5')}
                    <p class="mt-1.5 text-sm font-medium text-slate-900">${r.title}</p>
                    <p class="text-xs text-slate-500">${r.hint}</p>
                  </button>
                `
              )}
            </div>
          </div>

          <input
            type="text"
            name="name"
            required
            autocomplete="name"
            placeholder="Full name"
            class="input rounded-2xl border-black py-4 placeholder:text-slate-600"
          />

          <input
            type="email"
            name="email"
            required
            autocomplete="email"
            placeholder="Enter your email"
            class="input rounded-2xl border-black py-4 placeholder:text-slate-600"
          />

          <input
            type="tel"
            name="phone"
            autocomplete="tel"
            placeholder="Phone number (optional)"
            class="input rounded-2xl border-black py-4 placeholder:text-slate-600"
          />

          <div>
            <div class="relative">
              <input
                type="password"
                name="password"
                required
                minlength="8"
                autocomplete="new-password"
                placeholder="Password"
                class="input rounded-2xl border-black py-4 pr-12 placeholder:text-slate-600"
              />
              <button
                type="button"
                data-toggle-password
                class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700"
                aria-label="Show password"
              >
                ${icon('Eye', 'h-5 w-5')}
              </button>
            </div>
            <p data-pw-hint class="mt-1.5 text-xs text-slate-500">
              Password must be at least 8 characters
            </p>
          </div>

          <button
            type="submit"
            data-submit
            class="btn-primary w-full rounded-md py-4 text-base font-medium"
          >
            Create Account
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-slate-800 sm:text-base">
          Already have an account?
          <a href="/login" class="font-medium text-brand-500 hover:underline">Login</a>
        </p>
      </div>
    </div>
  `);

  const form = root.querySelector('[data-form]');
  const submit = root.querySelector('[data-submit]');
  const passwordField = form.querySelector('[name="password"]');
  const toggle = root.querySelector('[data-toggle-password]');
  const pwHint = root.querySelector('[data-pw-hint]');

  const SELECTED = ['border-brand-500', 'bg-brand-surface', 'ring-2', 'ring-brand-500/20'];
  const UNSELECTED = ['border-slate-300', 'hover:border-brand-400'];

  function paintRoles() {
    for (const btn of root.querySelectorAll('[data-role]')) {
      const active = btn.dataset.role === role;
      btn.classList.remove(...SELECTED, ...UNSELECTED);
      btn.classList.add(...(active ? SELECTED : UNSELECTED));
      const svg = btn.querySelector('svg');
      svg.classList.toggle('text-brand-500', active);
      svg.classList.toggle('text-slate-400', !active);
    }
  }
  paintRoles();

  on(root, 'click', '[data-role]', (_e, btn) => {
    role = btn.dataset.role;
    paintRoles();
  });

  toggle.addEventListener('click', () => {
    showPassword = !showPassword;
    passwordField.type = showPassword ? 'text' : 'password';
    toggle.innerHTML = toHTML(icon(showPassword ? 'EyeOff' : 'Eye', 'h-5 w-5'));
    toggle.setAttribute('aria-label', showPassword ? 'Hide password' : 'Show password');
  });

  passwordField.addEventListener('input', () => {
    const tooShort = passwordField.value.length > 0 && passwordField.value.length < 8;
    pwHint.classList.toggle('text-red-600', tooShort);
    pwHint.classList.toggle('text-slate-500', !tooShort);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;

    const data = new FormData(form);
    const password = String(data.get('password'));
    if (password.length < 8) return toast.error('Password must be at least 8 characters');

    busy = true;
    submit.disabled = true;
    submit.textContent = 'Creating account…';
    try {
      const user = await register({
        name: String(data.get('name')).trim(),
        email: String(data.get('email')).trim(),
        phone: String(data.get('phone')).trim() || undefined,
        password,
        role,
      });
      toast.success('Account created — welcome to RepairHub!');
      // A new technician has no service profile yet, and can do nothing until
      // one exists, so send them straight to the form.
      ctx.navigate(user.role === 'technician' ? '/tech/profile' : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(errMsg(err, 'Could not create your account'));
      busy = false;
      submit.disabled = false;
      submit.textContent = 'Create Account';
    }
  });
}
