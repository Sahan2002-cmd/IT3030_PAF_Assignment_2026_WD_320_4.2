# Smart Campus Frontend

## Run locally

Start the backend first:

```powershell
cd Backend_Smart_Campus
.\gradlew.bat bootRun
```

Then start the frontend:

```powershell
cd Frontend_Smart_Campus
npm install
npm run dev
```

## API connection

- In local development, Vite proxies `/api`, `/oauth2`, `/login/oauth2`, and `/health` to `http://localhost:8080`.
- If you deploy the frontend separately, create a `.env` file and set:

```bash
VITE_API_URL=http://localhost:8080
```

- The resources page uses the live backend endpoint at `/api/resources`.
