MY AI WORLD - GROQ TEST BUILD

Files:
- index.html: website with real Groq chat calls
- netlify.toml: Netlify Functions folder configuration
- netlify/functions/chat.mjs: server-side chat API (the key is not in this file)

Important:
1. In Netlify project Environment variables add GROQ_API_KEY with your Groq secret.
2. Set scope to Functions (or Any scope if that's the option on your plan).
3. Upload this ZIP as a new deploy to the existing Netlify site.
4. After deploy, open the website and test a character chat.

Never paste the Groq key into index.html or share it.
This is a prototype; chats and user-created characters are still stored locally in the browser.
