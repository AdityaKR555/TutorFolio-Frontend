# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Platform admin workspace

The admin console is at `/admin`. Use **Platform administrator login** on `/login`
(or open `/login?mode=admin`). Email/password is followed by email OTP verification.
Admin sessions use separate session storage and a dedicated API client; tutor
sessions, API calls, layouts and pages remain separate.

Set `VITE_ADMIN_API_BASE_URL` to the admin backend URL when it differs from
`VITE_API_BASE_URL` (the existing tutor backend). If omitted, the admin client uses
`VITE_API_BASE_URL`. Restart/rebuild Vite after changing environment settings.
The admin backend must allow this frontend origin in its `CORS_ORIGINS` setting.

The console includes overview metrics, unverified tutor account creation, a read-only
data explorer, plans/features, themes, subscriptions and platform settings/catalogs.
Admin users must be provisioned in the backend's `adminaccounts` table. Saving or
removing catalog records calls the authenticated backend; referenced records and
unsupported operations remain blocked by the backend. No frontend-only role flag
grants access. The console validates the live admin session before loading data.

## Legacy image delivery

`VITE_MEDIA_PUBLIC_URL` is the HTTPS public media base; `VITE_MEDIA_LEGACY_BASE_URL`
is the exact old storage API origin plus bucket prefix. The tutor API client repairs
matching unsigned legacy URLs in API responses, including gallery, profile, batch
and achievement fields. Signed URLs and other hosts/buckets remain unchanged.
Restart Vite after changing these variables and rebuild/redeploy for production.
This compatibility fix does not modify database values or bucket permissions.
