<<<<<<< HEAD
# AcadLink

AcadLink is a student-to-student academic problem-solving platform. It is built as a Vite/React single-page app with Vercel serverless API routes and MongoDB Atlas persistence.

## Local setup

Requirements: Node.js 20 or later and npm.

```powershell
npm install
Copy-Item .env.example .env
```

Set the required values in `.env` before using API features:

- `MONGODB_URI`: MongoDB Atlas connection string for the application database.
- `JWT_SECRET`: a private random value of at least 32 characters. Generate one with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`: Cloudinary credentials for image uploads.

Keep `.env` private; it is ignored by Git. Do not put production credentials in frontend code or commit them.

### Configure MongoDB Atlas for local development

1. Create a MongoDB Atlas account and a free cluster, then create a database user with a strong password. This database user is separate from your Atlas website login.
2. In **Network Access**, add your current development machine's public IP address. Avoid `0.0.0.0/0` except as a short-lived troubleshooting measure; remove it afterward.
3. In **Connect → Drivers**, copy the Node.js connection string. Replace the password placeholder and choose a database name, for example:

   ```text
   mongodb+srv://<database-user>:<url-encoded-password>@<cluster-host>/acadlink?retryWrites=true&w=majority
   ```

   URL-encode special characters in the database password.
4. Put the connection string into the local `.env` as `MONGODB_URI`. Generate a separate JWT secret and put it in `JWT_SECRET`:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```

   `JWT_SECRET` must be at least 32 characters. Never reuse the example placeholder or commit `.env`.

Cloudinary variables are only needed for the app's existing image-upload feature; they are not required to register or log in. Registration can take an optional HTTP(S) profile image URL.

### Run and test authentication

The Vite development server runs the frontend only, so it cannot handle `/api/auth/...` requests. Start the Vercel development server from the project root so it loads `.env` and runs the serverless API routes:

```powershell
npx vercel dev
```

If the CLI asks, sign in and link this project to a Vercel project; you can also install the CLI globally with `npm install --global vercel`. Open the local URL it prints (usually `http://localhost:3000`), then:

1. Choose **Join AcadLink**, complete the registration form, and submit. A successful registration creates the account, hashes the password with bcrypt, sets an HttpOnly JWT cookie, and signs you in.
2. Use **Log out**, then go to **Log in** and sign in with the same email and password.
3. Refresh the page; the current-user endpoint should restore the signed-in navigation from the cookie.
4. Try an existing protected page such as **Ask a question** or **Profile** while signed out; it should redirect to login. Public feed/profile viewing remains available.
5. To exercise validation, submit mismatched passwords, an invalid email, or a duplicate email; the form should display an error and should not create an invalid account.

The project uses same-origin relative `/api/...` requests, so no frontend API URL needs to be configured.

## Vercel deployment

The current API has 25 entry points. Deploy this route structure on Vercel Pro or Enterprise; Vercel Hobby currently allows at most 12 Functions per deployment for frameworks where each API file maps to one Function. See [Vercel Functions created per deployment](https://vercel.com/docs/functions/runtimes#functions-created-per-deployment). Consolidating routes to target Hobby would require a separate routing refactor.

1. Import the project into Vercel and keep the Vite framework/build defaults (`npm run build`, output directory `dist`).
2. Add `MONGODB_URI` and a unique `JWT_SECRET` as Vercel environment variables for each relevant environment.
3. Add the three Cloudinary variables to enable image uploads.
4. Configure MongoDB Atlas network access for the deployment environment and grant the database user only the access this application needs.
5. Deploy. Vercel serves the `api/` handlers as serverless functions and `vercel.json` rewrites client-side routes to the SPA.

After connecting Atlas, promote the initial administrator from a trusted terminal:

```powershell
npm run admin:promote -- admin@example.edu
```

The command requires `MONGODB_URI` in that terminal's environment. Admin role changes are stored in MongoDB; a role supplied by a browser request is never trusted.

## Available scripts

```powershell
npm run dev
npm run build
npm test -- --test-reporter=dot
npm run admin:promote -- admin@example.edu
```

## Project layout

- `src/`: React app, routes, reusable UI, and styles.
- `api/`: Vercel serverless API entry points.
- `server/`: shared API validation, authorization, database, and service helpers.
- `models/`: Mongoose models.
- `tests/`: Node.js unit and API tests.
- `scripts/`: operational scripts, including initial admin promotion.

Authentication uses Vercel-compatible API handlers in `api/auth/`, shared validation/session helpers in `server/`, and the Mongoose `User` model in `models/`. Password hashes and account roles are excluded from ordinary user serialization; the JWT is stored in an HttpOnly, SameSite=Lax cookie and is Secure in production.

New sessions and image uploads use AcadLink identifiers. Existing sessions and stored private-chat image references remain supported during the transition; signing out clears both session-cookie names.

## Current scope and verification

The application includes profiles, problem posts, public solutions and reactions, approval-gated private conversations, Cloudinary image handling, notifications, and admin moderation/account suspension. Private conversation APIs re-check membership and approved-solution access on the server.

Run `npm test -- --test-reporter=dot` and `npm run build` before deployment. Live database and image-upload flows require valid Atlas and Cloudinary credentials; these external integrations are not exercised by the local unit tests.
=======
# MejorProject
>>>>>>> 4092ce939a7d181d48a2085547910a4706fc4e37
