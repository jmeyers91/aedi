import { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BlockButton } from '../../components/block-button';
import { InputGroup } from '../../components/input-group';
import { useRegister } from '../../hooks/auth-hooks';
import { FormError } from '../../components/error-components';

export function RegisterPage() {
  const register = useRegister();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const passwordConfirmed = formData.get('passwordConfirmed') as string;

    register.mutate({ username, password, passwordConfirmed });
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center gap-8">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-8 w-96 max-w-full"
      >
        <h3 className="font-bold">Register</h3>
        <InputGroup name="username" label="Username" type="text" />
        <InputGroup name="password" label="Password" type="password" />
        <InputGroup
          name="passwordConfirmed"
          label="Password confirmed"
          type="password"
        />

        <FormError error={register.error} />
        <BlockButton type="submit">Register</BlockButton>
      </form>
      <Link to="/login" className="hover:text-sky-500 transition-colors">
        Back
      </Link>
    </div>
  );
}
