import { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BlockButton } from '../../components/block-button';
import { InputGroup } from '../../components/input-group';
import { useLogin } from '../../hooks/auth-hooks';
import { FormError } from '../../components/error-components';

export function LoginPage() {
  const login = useLogin();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    login.mutate({ username, password });
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center gap-8">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-8 w-96 max-w-full"
      >
        <h3 className="font-bold">Login</h3>
        <InputGroup name="username" label="Username" type="text" />
        <InputGroup name="password" label="Password" type="password" />

        <FormError error={login.error} />
        <BlockButton type="submit">Login</BlockButton>
      </form>
      <Link to="/register" className="hover:text-sky-500 transition-colors">
        Register
      </Link>
    </div>
  );
}
