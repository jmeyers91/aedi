import { useContext } from 'react';
import { Link, Outlet } from 'react-router-dom';
import style from './layout.module.css';
import { AuthContext } from '../../contexts/AuthContext';

export function Layout() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className={style.Layout}>
      <div className={style.Content}>
        <header>
          <Link className={style.LogoLink} to="/">
            Contact Manager
          </Link>
          {!!user && <button onClick={logout}>Logout</button>}
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
