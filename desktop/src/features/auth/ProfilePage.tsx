import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth';
import { useChangePassword } from '../../hooks/queries';
import { getBaseUrl } from '../../services/http';
import { isTauri } from '../../services/storage';
import { Button, Card, Field, Input } from '../../components/ui';
import { formatPersianDigits, fullName, roleLabel } from '../../utils/format';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [server, setServer] = useState<string>('');

  useEffect(() => {
    if (isTauri) void getBaseUrl().then(setServer);
  }, []);

  if (!user) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (next.length < 6) {
      setError('رمز جدید باید حداقل ۶ نویسه باشد');
      return;
    }
    if (next !== confirm) {
      setError('تکرار رمز جدید یکسان نیست');
      return;
    }
    setError(null);
    change.mutate(
      { current, next },
      {
        onSuccess: () => {
          setCurrent('');
          setNext('');
          setConfirm('');
        },
      },
    );
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>حساب کاربری</h1>
          <p className="page-sub">{user.roles.map(roleLabel).join(' · ')}</p>
        </div>
      </header>

      <div className="split-grid">
        <Card title="مشخصات کاربر">
          <ul className="info-list">
            <li><span>نام و نام خانوادگی</span><strong>{fullName(user)}</strong></li>
            <li><span>ایمیل</span><strong className="mono" dir="ltr">{user.email}</strong></li>
            <li><span>همراه</span><strong className="mono">{user.mobile ? formatPersianDigits(user.mobile) : '—'}</strong></li>
            <li><span>وضعیت</span><strong>{user.is_active ? 'فعال' : 'غیرفعال'}</strong></li>
            <li><span>شناسه کاربری</span><strong className="mono" dir="ltr">{user.id}</strong></li>
          </ul>
          {server ? (
            <p className="muted server-line">
              سرور فعال: <span className="mono" dir="ltr">{server}</span>
            </p>
          ) : null}
        </Card>

        <Card title="تغییر رمز عبور">
          <form className="form-grid" onSubmit={submit}>
            <Field label="رمز فعلی">
              <Input type="password" value={current} autoComplete="current-password" onChange={(e) => setCurrent(e.target.value)} required />
            </Field>
            <Field label="رمز جدید">
              <Input type="password" value={next} autoComplete="new-password" onChange={(e) => setNext(e.target.value)} required />
            </Field>
            <Field label="تکرار رمز جدید">
              <Input type="password" value={confirm} autoComplete="new-password" onChange={(e) => setConfirm(e.target.value)} required />
            </Field>
            {error ? <p className="form-error form-span">{error}</p> : null}
            <div className="form-actions form-span">
              <Button type="submit" busy={change.isPending}>ذخیره رمز جدید</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
