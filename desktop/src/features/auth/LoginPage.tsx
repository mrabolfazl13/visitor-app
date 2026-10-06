import { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { getBaseUrl, setBaseUrl } from '../../services/http';
import { isTauri } from '../../services/storage';
import { Button, Field, Input } from '../../components/ui';

export function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const pending = useAuthStore((state) => state.pending);
  const error = useAuthStore((state) => state.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showServer, setShowServer] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTauri) return;
    void getBaseUrl().then(setServerUrl);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (showServer && serverUrl.trim()) {
      try {
        await setBaseUrl(serverUrl);
        setServerError(null);
      } catch (caught) {
        setServerError(caught instanceof Error ? caught.message : 'آدرس سرور نامعتبر است');
        return;
      }
    }
    await login(email.trim(), password);
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <span className="brand-mark">B2B</span>
          <div>
            <h1>سامانه فروش سازمانی</h1>
            <p>مدیریت مشتریان، کالاها و سفارش‌ها</p>
          </div>
        </div>

        <form className="login-form" onSubmit={submit}>
          <Field label="ایمیل">
            <Input
              type="email"
              value={email}
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@b2bsales.com"
              required
            />
          </Field>

          <Field label="رمز عبور">
            <Input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>

          {error ? <p className="form-error">{error}</p> : null}
          {serverError ? <p className="form-error">{serverError}</p> : null}

          <Button type="submit" busy={pending} className="login-submit">
            ورود به سامانه
          </Button>

          {isTauri ? (
            <>
              <button type="button" className="link-btn" onClick={() => setShowServer((value) => !value)}>
                <Settings2 size={15} aria-hidden="true" />
                {showServer ? 'بستن تنظیمات سرور' : 'تنظیم آدرس سرور'}
              </button>
              {showServer ? (
                <Field label="آدرس پایه API" hint="مثال: https://visitor.absadeghi.ir/api/v1">
                  <Input value={serverUrl} onChange={(event) => setServerUrl(event.target.value)} dir="ltr" />
                </Field>
              ) : null}
            </>
          ) : null}
        </form>
      </div>
    </div>
  );
}
