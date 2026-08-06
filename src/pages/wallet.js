import { html, toHTML, on } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import api, { errMsg } from '../api/client.js';
import { naira, formatDateTime } from '../lib/format.js';
import { Spinner, EmptyState, PageHeader, openModal } from '../components/ui.js';
import { getAuth } from '../state/auth.js';
import toast from '../lib/toast.js';

export default function Wallet(root) {
  const { user } = getAuth();
  const isTech = user.role === 'technician';

  let wallet = null;
  let profile = null;
  let banks = [];
  let cancelled = false;

  root.innerHTML = toHTML(Spinner());
  load();

  async function load() {
    const jobs = [
      api
        .get('/wallet')
        .then(({ data }) => (wallet = data))
        .catch(() => (wallet = { balance: 0, transactions: [] })),
    ];
    if (isTech) {
      jobs.push(
        api
          .get('/technicians/me')
          .then(({ data }) => (profile = data.profile))
          .catch(() => {})
      );
    }
    await Promise.all(jobs);
    if (!cancelled) paint();
  }

  async function openBankModal() {
    const modal = openModal({
      title: 'Verify bank account',
      content: html`
        <div class="space-y-4">
          <p class="text-sm text-slate-600">
            Your account name is resolved directly from the bank — payouts can only go to a verified
            account in your name.
          </p>
          <div>
            <label class="label" for="bank">Bank</label>
            <select id="bank" data-bank class="input">
              <option value="">${banks.length ? 'Select your bank…' : 'Loading banks…'}</option>
              ${banks.map((b) => html`<option value="${b.code}">${b.name}</option>`)}
            </select>
          </div>
          <div>
            <label class="label" for="acct">Account number</label>
            <input
              id="acct"
              data-account
              inputmode="numeric"
              maxlength="10"
              class="input"
              placeholder="0123456789"
            />
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" data-cancel class="btn-secondary">Cancel</button>
            <button type="button" data-confirm class="btn-primary">Verify account</button>
          </div>
        </div>
      `,
    });

    const select = modal.body.querySelector('[data-bank]');
    const account = modal.body.querySelector('[data-account]');

    account.addEventListener('input', () => {
      account.value = account.value.replace(/\D/g, '');
    });

    if (banks.length === 0) {
      try {
        const { data } = await api.get('/payments/banks');
        banks = data.banks;
        select.innerHTML = toHTML(html`
          <option value="">Select your bank…</option>
          ${banks.map((b) => html`<option value="${b.code}">${b.name}</option>`)}
        `);
      } catch (err) {
        toast.error(errMsg(err, 'Could not load banks'));
      }
    }

    modal.body.querySelector('[data-cancel]').addEventListener('click', () => modal.close());
    modal.body.querySelector('[data-confirm]').addEventListener('click', async (e) => {
      const bankCode = select.value;
      const accountNumber = account.value;
      if (!bankCode || !accountNumber)
        return toast.error('Select a bank and enter your account number');

      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Verifying…';
      modal.dismissable = false;
      try {
        const { data } = await api.post('/technicians/me/bank', {
          bank_code: bankCode,
          account_number: accountNumber,
        });
        toast.success(`Account verified: ${data.bank_account.account_name}`);
        modal.dismissable = true;
        modal.close();
        load();
      } catch (err) {
        toast.error(errMsg(err, 'Bank verification failed'));
        modal.dismissable = true;
        btn.disabled = false;
        btn.textContent = 'Verify account';
      }
    });
  }

  function openWithdrawModal() {
    const modal = openModal({
      title: 'Withdraw earnings',
      content: html`
        <div class="space-y-4">
          <p class="text-sm text-slate-600">
            Available: <span class="font-semibold">${naira(wallet.balance)}</span> →
            ${profile?.account_name} (${profile?.bank_code} ****${profile?.account_number?.slice(-4)})
          </p>
          <div>
            <label class="label" for="wamount">Amount (₦)</label>
            <input
              id="wamount"
              data-amount
              type="number"
              min="1"
              max="${wallet.balance}"
              class="input"
              placeholder="e.g. 10000"
            />
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" data-cancel class="btn-secondary">Cancel</button>
            <button type="button" data-confirm class="btn-success">Withdraw</button>
          </div>
        </div>
      `,
    });

    modal.body.querySelector('[data-cancel]').addEventListener('click', () => modal.close());
    modal.body.querySelector('[data-confirm]').addEventListener('click', async (e) => {
      const n = Number(modal.body.querySelector('[data-amount]').value);
      if (!n || n <= 0) return toast.error('Enter a valid amount');

      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Processing…';
      modal.dismissable = false;
      try {
        const { data } = await api.post('/wallet/withdraw', { amount: n });
        toast.success(`Withdrawal processed — new balance ${naira(data.balance)}`);
        modal.dismissable = true;
        modal.close();
        load();
      } catch (err) {
        toast.error(errMsg(err, 'Withdrawal failed'));
        modal.dismissable = true;
        btn.disabled = false;
        btn.textContent = 'Withdraw';
      }
    });
  }

  function paint() {
    const hasBank = Boolean(profile?.account_number);

    root.innerHTML = toHTML(html`
      <div class="mx-auto max-w-2xl">
        ${PageHeader({
          title: 'Wallet',
          subtitle: isTech ? 'Your repair earnings and payouts.' : 'Your wallet activity.',
        })}

        <div
          class="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-hover p-5 text-white shadow-sm sm:p-6"
        >
          <p class="flex items-center gap-2 text-sm text-brand-50">
            ${icon('Wallet', 'h-4 w-4')} Available balance
          </p>
          <p class="mt-1 break-words text-3xl font-extrabold sm:text-4xl">${naira(wallet.balance)}</p>
          ${isTech &&
          html`
            <div class="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-withdraw-or-bank
                class="btn bg-white text-brand-500 hover:bg-brand-surface focus:ring-white"
              >
                ${icon('Banknote', 'h-4 w-4')} Withdraw to bank
              </button>
              ${hasBank
                ? html`
                    <span class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-brand-50">
                      ${icon('BadgeCheck', 'h-4 w-4 shrink-0')} ${profile.account_name} ·
                      ****${profile.account_number.slice(-4)}
                      <button
                        type="button"
                        data-bank
                        class="underline decoration-brand-50 underline-offset-2 hover:text-white"
                      >
                        change
                      </button>
                    </span>
                  `
                : html`
                    <button
                      type="button"
                      data-bank
                      class="flex items-center gap-1.5 text-sm text-brand-50 underline decoration-brand-50 underline-offset-2 hover:text-white"
                    >
                      ${icon('Landmark', 'h-4 w-4')} Verify your bank account first
                    </button>
                  `}
            </div>
          `}
        </div>

        <h2 class="mb-3 mt-8 font-semibold text-slate-900">Transactions</h2>
        ${wallet.transactions.length === 0
          ? EmptyState({
              title: 'No transactions yet',
              hint: isTech
                ? 'Earnings land here automatically when customers pay for completed repairs.'
                : 'Wallet activity will appear here.',
            })
          : html`
              <div class="card divide-y divide-slate-100">
                ${wallet.transactions.map(
                  (t) => html`
                    <div class="flex items-center gap-3 p-4">
                      ${t.type === 'credit'
                        ? icon('ArrowDownCircle', 'h-6 w-6 shrink-0 text-emerald-500')
                        : icon('ArrowUpCircle', 'h-6 w-6 shrink-0 text-red-400')}
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-medium text-slate-800">${t.description}</p>
                        <p class="text-xs text-slate-400">${formatDateTime(t.created_at)}</p>
                      </div>
                      <span
                        class="shrink-0 font-semibold ${t.type === 'credit'
                          ? 'text-emerald-600'
                          : 'text-red-500'}"
                        >${t.type === 'credit' ? '+' : '−'}${naira(t.amount)}</span
                      >
                    </div>
                  `
                )}
              </div>
            `}
      </div>
    `);
  }

  const offs = [
    on(root, 'click', '[data-withdraw-or-bank]', () =>
      profile?.account_number ? openWithdrawModal() : openBankModal()
    ),
    on(root, 'click', '[data-bank]', () => openBankModal()),
  ];

  return () => {
    cancelled = true;
    for (const off of offs) off();
  };
}
