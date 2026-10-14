# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the React app as a thin presentation layer built with React 19, Vite, React Router, and Bootstrap. Route-level components will render accessible loading, empty, success, and error states, while shared helpers in `octofit-tracker/frontend/src/api/client.ts` centralize the `/api` fetch logic and environment overrides.
- Logic tier decision: Use Express with TypeScript and an explicit service layer under `octofit-tracker/backend/src`. Route handlers stay focused on HTTP concerns (path, status codes, and payload shape), while services own validation, aggregation, and business rules so response behavior is consistent and easier to test.
- Data tier decision: Model the domain in Mongoose schemas and seed fixtures rather than handling raw Mongo documents in handlers. Validation belongs in schema constraints and stable demo records are loaded with upserts so rerunning the seed preserves data integrity and existing user/team relationships.
- Activity tracking approach: Store activities as records that include `user`, `team`, `type`, `minutes`, computed `points`, and `occurredAt`. The API will require valid existing user and team IDs and return a deliberate 4xx when IDs are malformed or missing instead of letting a cast error become a 500.
- Team management approach: Teams are created and listed as first-class documents with `name` and `mascot`, and the API rejects a missing team name with `400`. Team membership is treated as a stable reference to a seeded team roster so UI and leaderboard calculations can rely on consistent relationships.
- Leaderboard approach: Aggregate total points by team from recent activity records, sort descending by total points, and assign a 1-based rank to each team. The response shape stays consistent with `{ teamName, totalPoints, rank }` so the frontend can render scorecards without extra transformation logic.
- Workout suggestions approach: Resolve a user by email, inspect their recent fitness profile and activity history, and return a focused recommendation whose `focus` matches the user goal or recently logged activity. Missing users produce a deliberate 4xx, and the suggestion payload keeps the `focus`, `reason`, `duration`, and `difficulty` contract stable for the UI.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — validates the Mongoose schema rules, seed data contract, and workout suggestion shape. A failure here usually means the schema or fixture data does not match the required business rules or relationships.
- API command: `npm run test:api --prefix octofit-tracker/backend` — exercises the Express routes and HTTP contract. A failing API test indicates the route is returning the wrong status code, wrong payload structure, or missing input validation for invalid IDs and empty requests.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — proves the React UI renders the core capability screens with the required loading, empty, success, and error states. A failure indicates the user-facing behavior does not match the API contract or accessible UX expectations.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — catches TypeScript and compile-time issues in the logic and data layers before runtime. A failure here means the backend code does not type-check cleanly and should be fixed before the app is run.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — ensures the Vite app bundles without TypeScript or bundling errors. A failure here usually points to missing or incorrect imports, route definitions, or type mismatches in the presentation layer.
