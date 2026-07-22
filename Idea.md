You are a Senior Full Stack Developer specializing in React.js, FastAPI, PostgreSQL, Machine Learning, and system architecture.

I already have a working CropCare AI project. DO NOT modify, refactor, rename, or remove any existing functionality. Preserve all current UI, APIs, database models, business logic, and project structure.

Your task is to ADD new features only. The existing code must continue to work exactly as before.

========================
PROJECT STACK
========================

Frontend:
- React.js
- React Router
- Tailwind CSS
- Axios

Backend:
- FastAPI

Database:
- PostgreSQL

AI:
- PyTorch CNN model (.pth)

Current workflow:
1. Farmer uploads crop image.
2. Deep learning model predicts plant disease.
3. Prediction, image, and farmer details are sent to agricultural expert.
4. Expert replies with treatment.
5. Farmer receives expert response.

Do NOT change this workflow.

========================
FEATURE 1
Nearby Expert Assignment
========================

Add automatic expert assignment.

Requirements:

- Store latitude and longitude for every agricultural expert.
- Store farmer GPS location.
- Use Haversine distance formula.
- Automatically assign the nearest available expert.
- If the nearest expert is unavailable, assign the next nearest.
- If no expert is available, place the request in a pending queue.

Backend:
- Create new APIs only.
- Do not modify existing APIs.

Frontend:
- Show:
    Assigned Expert
    Distance
    Assignment Status

Do not modify existing pages.
Create new reusable React components if required.

========================
FEATURE 2
Offline AI Prediction
========================

The AI disease prediction must work without internet.

Requirements:

- Store the trained PyTorch model locally.
- Detect network availability.
- If internet exists:
      Run normal workflow.
- If offline:
      Run local AI prediction.
      Save request locally.
      Automatically upload request when internet returns.

Requirements:

- Queue unsent requests.
- Retry automatically.
- Show:
    Offline Prediction
    Pending Sync
    Synced Successfully

Do NOT remove the online prediction.

========================
FEATURE 3
Emergency Crop Alert
========================

Some diseases are dangerous.

Create a configurable list like:

Emergency Diseases:
- Late Blight
- Bacterial Wilt
- Rice Blast
- Citrus Canker
- Tomato Yellow Leaf Curl Virus

When AI predicts one of these:

- Create Emergency Alert.
- Mark Priority = HIGH.
- Notify assigned expert immediately.
- Move request to the top of the expert dashboard.
- Show a red Emergency badge.
- Record emergency timestamp.

Do not hardcode.
Store emergency diseases in configuration.

========================
DATABASE
========================

Create new tables only.

Suggested tables:

Experts

ExpertAvailability

EmergencyAlerts

OfflineQueue

AssignmentHistory

Do not change existing tables.

========================
BACKEND
========================

Create new routers.

Do not edit existing routes.

Create:

assignment_router.py

offline_router.py

emergency_router.py

Create new services if needed.

========================
FRONTEND
========================

Do not modify existing pages.

Only add:

- Expert Assignment Card
- Emergency Badge
- Offline Sync Status
- Pending Upload Screen

If necessary, create:

- New React components
- Custom React hooks
- Utility functions
- API service files

Reuse the existing design, styling, routing, and architecture.

========================
CODING RULES
========================

- Never modify existing code.
- Never rename files.
- Never remove APIs.
- Never change existing UI.
- Never change navigation.
- Never break compatibility.
- Only ADD new code.
- If existing code is required, extend it using wrappers, new services, custom hooks, or reusable React components.

========================
OUTPUT
========================

For every new feature provide:

1. Folder structure
2. New files
3. Code for each new file
4. API endpoints
5. Database schema
6. SQL migration
7. Frontend integration steps
8. Backend integration steps
9. Testing instructions

If any existing file requires a single import or registration, explicitly mention the exact line to add and nothing else.

Do not rewrite the project.
Do not refactor.
Do not optimize existing code.
Do not delete anything.

Treat the existing project as production software that must remain fully functional.