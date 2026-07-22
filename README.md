# Bartlett's Staff Evaluations — Setup Guide

This is your evaluation app as a normal website project instead of a Claude
artifact. You own it completely: it lives in your own GitHub account, your
own Firebase account, and nobody can turn it off but you.

This guide assumes you've never done any of this before. Follow it top to
bottom, in order, and don't skip steps. It'll take about 30–45 minutes the
first time. After that, making future changes takes 2 minutes.

---

## What you'll end up with

- A free GitHub account holding your app's code (like a filing cabinet for it)
- A free Firebase account holding your shared data (the "server" all managers write to)
- A free EmailJS account that sends a real email to all 9 managers the moment you send a survey
- A live web address like `https://yourname.github.io/bartletts-evals/` that
  you send to your 9 managers and use on the office computer

---

## Part 1 — Install the tools you need (one-time, ~10 minutes)

You need two free programs installed on your computer:

1. **Node.js** — lets your computer run and build the app.
   Go to https://nodejs.org, download the button that says **LTS**, run the
   installer, click Next through everything, accepting defaults.

2. **Git** — lets your computer talk to GitHub.
   Go to https://git-scm.com/downloads, download for your operating system,
   run the installer, click Next through everything, accepting defaults.

To check both installed correctly:
- **Windows:** open the Start menu, type `cmd`, press Enter.
- **Mac:** open Spotlight (Cmd+Space), type `terminal`, press Enter.

In the black/white window that opens, type each of these and press Enter:

```
node -v
git --version
```

Each should print a version number (like `v20.11.0`). If you see an error
instead, the install didn't finish — reinstall and try again.

---

## Part 2 — Create your GitHub account & repository (~5 minutes)

1. Go to https://github.com and click **Sign up**. Use your work email.
2. Once logged in, click the **+** icon top-right → **New repository**.
3. Name it `bartletts-evals` (all lowercase, no spaces).
4. Set it to **Public** (GitHub Pages' free tier requires this — it's fine,
   nobody can find or use your app without the exact link, and your actual
   data lives in Firebase, not in this public code).
5. Do **not** check "Add a README" — leave everything else default.
6. Click **Create repository**. Keep this browser tab open.

---

## Part 3 — Create your Firebase project (~10 minutes)

This is the free database that stores every evaluation, so all managers'
phones and the office computer see the same data.

1. Go to https://console.firebase.google.com and sign in with any Google account.
2. Click **Create a project** (or **Add project**).
3. Name it `bartletts-evals` → click **Continue**.
4. Turn off "Enable Google Analytics for this project" (not needed) → **Create project** → wait ~30 seconds → **Continue**.
5. On the project's main page, click the **web icon** (`</>`) to add a web app.
6. Nickname it `bartletts-evals-web` → click **Register app**.
7. Firebase now shows a code block that looks like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "bartletts-evals.firebaseapp.com",
     projectId: "bartletts-evals",
     storageBucket: "bartletts-evals.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

   **Keep this tab open** — you'll copy these exact values into the project
   in Part 4. Click **Continue to console** when ready.

8. In the left sidebar, click **Build → Firestore Database**.
9. Click **Create database**.
10. Choose a location close to you (any US option is fine) → **Next**.
11. Choose **Start in test mode** → **Create**.

    > Test mode means anyone with the link can read/write data for 30 days.
    > That's fine for now — before day 30, come back to this same screen,
    > click the **Rules** tab, and paste this instead, then click **Publish**:
    >
    > ```
    > rules_version = '2';
    > service cloud.firestore {
    >   match /databases/{database}/documents {
    >     match /appData/{document=**} {
    >       allow read, write: if true;
    >     }
    >   }
    > }
    > ```
    >
    > This keeps it open to anyone with your app's link (which is what you
    > want — your managers aren't logging in), without the 30-day expiration.

---

## Part 3b — Create your EmailJS account (~10 minutes)

This is what actually sends the email to all 9 managers the moment you hit
"Send Survey."

1. Go to https://www.emailjs.com and click **Sign Up** (free plan is fine —
   200 emails/month, plenty for this).
2. Once logged in, go to **Email Services** (left sidebar) → **Add New Service**.
3. Pick **Gmail** (or whatever email provider you use) → follow the prompts
   to connect your account → note the **Service ID** it gives you (looks
   like `service_abc1234`).
4. Go to **Email Templates** → **Create New Template**. Set the "To" field
   to `{{to_email}}`, and in the body, write something like:

   ```
   Subject: Evaluation needed for {{employee_name}}

   Hi {{to_name}},

   {{employee_name}} ({{role_name}}) is due for an evaluation.
   Please fill it out by {{deadline}} so we have it ready for Tuesday's meeting.

   Fill it out here: {{app_url}}

   Thanks!
   ```

   Save it, and note the **Template ID** (looks like `template_xyz789`).
5. Go to **Account → General** → copy your **Public Key**.
6. Open `src/notifications.js` in your project folder and paste all three
   values in, plus your real GitHub Pages link once you have it from Part 6:

   ```js
   const EMAILJS_SERVICE_ID = "service_abc1234";
   const EMAILJS_TEMPLATE_ID = "template_xyz789";
   const EMAILJS_PUBLIC_KEY = "your_public_key_here";
   const APP_URL = "https://your-username.github.io/bartletts-evals/";
   ```

7. Save the file.

> **Note:** you can come back and update `APP_URL` after Part 6, once you
> know your actual live link — just edit the file and run `npm run deploy`
> again (see "Making changes later" at the bottom of this guide).

---

## Part 4 — Get the project files ready on your computer (~10 minutes)

1. Download the project files Claude gave you (the `.zip` file) and unzip it
   — you'll get a folder called `bartletts-repo`.
2. Open that folder, then open `src/firebase.js` in any text editor (Notepad,
   TextEdit, or VS Code if you have it).
3. Replace the placeholder values with the real ones from Part 3, Step 7.
   It should look like this when you're done (using your own real values):

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "bartletts-evals.firebaseapp.com",
     projectId: "bartletts-evals",
     storageBucket: "bartletts-evals.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123",
   };
   ```

4. Save the file.

---

## Part 5 — Test it on your own computer (~5 minutes)

1. Open your terminal (Command Prompt on Windows, Terminal on Mac) again.
2. Navigate into the folder. For example, if you unzipped it to your
   Downloads folder:

   ```
   cd Downloads/bartletts-repo
   ```

3. Install the project's pieces (only needed once):

   ```
   npm install
   ```

   This takes a minute or two and prints a lot of text — that's normal.

4. Start it up:

   ```
   npm run dev
   ```

5. It'll print a web address like `http://localhost:5173`. Open that in your
   browser — you should see the app, exactly like it looked in Claude.
6. Try adding an employee and submitting a test evaluation. If it works,
   your Firebase connection is set up correctly. Press `Ctrl+C` in the
   terminal to stop the test server when you're done.

---

## Part 6 — Publish it to GitHub Pages (~10 minutes)

1. Back in the terminal, still inside the `bartletts-repo` folder, connect
   it to the GitHub repository you made in Part 2 (replace `YOUR-USERNAME`
   with your actual GitHub username):

   ```
   git init
   git add .
   git commit -m "First version"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/bartletts-evals.git
   git push -u origin main
   ```

   GitHub may open a browser window asking you to log in — do that, then
   come back to the terminal.

2. Now build and publish the live site:

   ```
   npm run deploy
   ```

   This creates a `gh-pages` branch in your repo with the built site.

3. On GitHub, go to your repository → **Settings** → **Pages** (left sidebar).
4. Under "Branch," choose `gh-pages` and `/ (root)`, then click **Save**.
5. Wait about 1–2 minutes, then refresh that Pages settings screen — it'll
   show your live link, something like:

   ```
   https://YOUR-USERNAME.github.io/bartletts-evals/
   ```

That link is what you send to your 9 managers and open on the office
computer. Everyone uses this exact same link.

---

## Making changes later

Whenever you want a change (new role, new wording, anything):

1. Ask Claude to make the change and give you the updated `App.jsx` file.
2. Replace `src/App.jsx` in your folder with the new one.
3. In the terminal, inside the project folder, run:

   ```
   npm run deploy
   ```

That's it — the live link updates in about a minute.

---

## Troubleshooting

- **"npm: command not found"** → Node.js isn't installed correctly; redo Part 1.
- **App loads but nothing saves** → double check `src/firebase.js` has your
  real values, not the placeholder text, and that you published the Firestore
  rules in Part 3.
- **GitHub Pages shows a blank page** → make sure `vite.config.js` still has
  `base: "./"` — don't remove that line.
- **Surveys create fine but managers never get an email** → double check
  `src/notifications.js` has your real EmailJS Service ID, Template ID, and
  Public Key (not the placeholder text), and that your email template's "To"
  field is set to `{{to_email}}` exactly.
- **Anything else** → copy the exact error text and ask Claude to help debug it.
