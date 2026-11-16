# SACHIN AI FLOW

A responsive AI creative studio inspired by the layout of the supplied Google Flow screenshot. It is an independent product, not affiliated with Google.

## Included
- Responsive web app (desktop + mobile)
- Installable Android PWA
- Gemini Omni Flash video generation (text-to-video and image-to-video)
- Gemini 3.1 Flash Image photo editing
- Project gallery (stored in this browser)
- Hindi voice preview using the device/browser speech synthesis engine
- MP4 / PNG download actions

## Requirements
- Node.js 20+
- Google AI Studio API key with access to the selected Gemini models and billing/quota enabled

## Run locally
1. Extract the ZIP.
2. Open a terminal in the project folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Put your key in `.env` as `GEMINI_API_KEY=...`.
6. Run `npm start`.
7. Open `http://localhost:3000`.

Never put the API key in `public/app.js` or any browser code.

## Android
Deploy this app over HTTPS, open the deployed URL in Chrome on Android, then use the browser menu → Install app / Add to Home screen. This installs the PWA. A signed native APK is not included; the same web app can later be wrapped with Capacitor if you need a Play Store APK.

## Deploy
Deploy to a Node.js host that supports Express and environment variables (for example Render, Railway, or a VPS). Set `GEMINI_API_KEY` in the host's secret/environment settings. Use persistent storage or a database before offering multi-user accounts.

## Important implementation notes
- Video model: `gemini-omni-1.1-flash` through the Gemini Interactions API. This is a preview model; availability and pricing are controlled by Google.
- Photo editing: `gemini-3.1-flash-image`.
- The app sends prompts and uploaded media to Google for processing.
- The initial version stores project previews in browser localStorage. This is intended for a personal prototype, not a multi-user production media library.
- Hindi voice preview uses the device's built-in speech synthesis. It is not a generated downloadable voice track.
- The video API requests inline video output and returns it to the browser for preview and download. Very large responses may require switching to Google-hosted URI delivery and adding server-side download/storage.

## Android APK wrapper (Capacitor)
The project now includes `capacitor.config.ts` and a GitHub Actions workflow at
`.github/workflows/android-apk.yml`. This workflow builds a debug APK after the
web app and its Express API have been deployed to HTTPS.

1. Push this project to a GitHub repository.
2. Deploy the Node server and set `GEMINI_API_KEY` in the hosting provider's secrets.
3. In GitHub repository Settings → Secrets and variables → Actions → Variables,
   add `APP_URL` with the deployed HTTPS URL (no trailing slash).
4. Open Actions → Build SACHIN AI FLOW Android APK → Run workflow.
5. Download `SACHIN-AI-FLOW-debug-apk` from the completed workflow run.

This produces a debug APK for testing. A Play Store release requires a separately
signed release build and signing credentials. The APK will not work until the
backend is deployed and `APP_URL` points to it.

## Beginner deployment using Render + GitHub
1. Upload this project folder to a new GitHub repository. Do not upload `.env` or your API key.
2. Open https://render.com and sign in with GitHub.
3. Choose New → Blueprint, select your repository, and let Render read `render.yaml`.
4. In the Render service Environment page, add `GEMINI_API_KEY` and paste the key into its private value field. Never put the key in GitHub, the browser app, or chat.
5. Deploy. Copy the live HTTPS service URL.
6. In GitHub repository Settings → Secrets and variables → Actions → Variables, add `APP_URL` with that HTTPS URL (no trailing slash).
7. Run the GitHub Actions workflow named “Build SACHIN AI FLOW Android APK”. Download its APK artifact when the workflow completes.

The Render free service may sleep when idle and can take time to wake up. Video/image generation can require paid Google API access and may incur charges. Check Google AI Studio usage and billing limits.
