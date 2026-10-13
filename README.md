# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## UPI Fee Payments

To enable UPI QR payments, sign in as an administrator and add the school's UPI ID and payment account name under **Admin > School Settings**. Alternatively, configure the backend environment:

```env
UPI_VPA=schoolfees@yourbank
UPI_PAYEE_NAME=Your School Name
STRIPE_CURRENCY=inr
```

Set the school fee currency to **INR** in the same settings screen. If `STRIPE_CURRENCY` is explicitly set on the backend, it takes precedence and must also be `inr` for UPI; otherwise checkout uses the saved school currency. Set `VITE_CURRENCY=INR` in the frontend environment so displayed amounts match. Fee amounts use the configured currency, so only use UPI when existing and new fee amounts are in INR. Stripe checkout remains available. UPI references stay pending until an administrator confirms receipt against the school's payment account.
