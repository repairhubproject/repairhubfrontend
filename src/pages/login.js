import { html, toHTML } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { login } from '../state/auth.js';
import { errMsg } from '../api/client.js';
import toast from '../lib/toast.js';

export default function Login(root, ctx) {
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
          <h1 class="text-xl font-bold sm:text-2xl">Welcome Back!!</h1>
          <p class="text-sm text-slate-700 sm:text-base">Login to continue</p>
        </div>

        <form data-form class="flex flex-col gap-5">
          <div>
            <label class="sr-only" for="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autocomplete="email"
              placeholder="Enter your email"
              class="input rounded-2xl border-black py-4 placeholder:text-slate-600"
            />
          </div>

          <div>
            <label class="sr-only" for="password">Password</label>
            <div class="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                autocomplete="current-password"
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
          </div>

          <button
            type="submit"
            data-submit
            class="btn-primary w-full rounded-md py-4 text-base font-medium"
          >
            Login
          </button>
        </form>

        <div class="my-8 flex items-center">
          <div class="h-px flex-1 bg-slate-300"></div>
          <span class="px-4 text-sm text-slate-700">Or continue with</span>
          <div class="h-px flex-1 bg-slate-300"></div>
        </div>

        <div class="space-y-3">
          <button type="button" data-social class="btn-secondary w-full rounded-2xl border-black py-4">
            <img src="/icons8-google-48.png" alt="" class="h-6 w-6" />
            Continue with Google
          </button>
          <button type="button" data-social class="btn-secondary w-full rounded-2xl border-black py-4">
            Continue with Apple
          </button>
        </div>

        <p class="mt-6 text-center text-sm text-slate-800 sm:text-base">
          Don&apos;t have an account?
          <a href="/register" class="font-medium text-brand-500 hover:underline">Create Account</a>
        </p>
      </div>
    </div>
  `);

  const form = root.querySelector('[data-form]');
  const submit = root.querySelector('[data-submit]');
  const passwordField = root.querySelector('#password');
  const toggle = root.querySelector('[data-toggle-password]');

  toggle.addEventListener('click', () => {
    showPassword = !showPassword;
    passwordField.type = showPassword ? 'text' : 'password';
    toggle.innerHTML = toHTML(icon(showPassword ? 'EyeOff' : 'Eye', 'h-5 w-5'));
    toggle.setAttribute('aria-label', showPassword ? 'Hide password' : 'Show password');
  });

  for (const btn of root.querySelectorAll('[data-social]')) {
    btn.addEventListener('click', () =>
      toast('Social sign-in is not enabled on the API yet — use your email and password.', {
        icon: 'ℹ️',
      })
    );
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    submit.disabled = true;
    submit.textContent = 'Logging in…';

    const data = new FormData(form);
    try {
      const user = await login(String(data.get('email')).trim(), String(data.get('password')));
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      // Navigating re-resolves the shell, which is now the authenticated one.
      ctx.navigate(ctx.query.get('from') || '/dashboard', { replace: true });
    } catch (err) {
      toast.error(errMsg(err, 'Could not log you in'));
      busy = false;
      submit.disabled = false;
      submit.textContent = 'Login';
    }
  });
}
