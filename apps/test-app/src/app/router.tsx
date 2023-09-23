import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';
import { Layout } from './components/layout';
import { AuthRoute, NoAuthRoute } from './components/auth-route';
import { ContactsPage } from './pages/contacts-page/contacts-page';
import { IndexPage } from './pages/index-page';
import { LoginPage } from './pages/login-page/login-page';
import { RegisterPage } from './pages/register-page/register-page';
import { EditContactPage } from './pages/contacts-page/edit-contact-page';
import { ViewContactPage } from './pages/contacts-page/view-contact-page';
import { AccountSettingsPage } from './pages/account-settings-page/account-settings-page';
import { ContactStats } from './pages/contacts-page/contact-stats';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route
        path="/login"
        element={
          <NoAuthRoute>
            <LoginPage />
          </NoAuthRoute>
        }
      />
      <Route
        path="/register"
        element={
          <NoAuthRoute>
            <RegisterPage />
          </NoAuthRoute>
        }
      />
      <Route
        path="/account"
        element={
          <AuthRoute>
            <AccountSettingsPage />
          </AuthRoute>
        }
      />
      <Route
        path="/contacts"
        element={
          <AuthRoute>
            <ContactsPage />
          </AuthRoute>
        }
      >
        <Route index element={<ContactStats />} />
        <Route path="/contacts/add" element={<EditContactPage key="add" />} />
        <Route
          path="/contacts/edit/:contactId"
          element={<EditContactPage key="edit" />}
        />
        <Route path="/contacts/view/:contactId" element={<ViewContactPage />} />
      </Route>
      <Route index element={<IndexPage />} />
    </Route>,
  ),
);
