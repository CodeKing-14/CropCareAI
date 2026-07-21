# CROPCARE AI DEVELOPMENT INSTRUCTIONS

## General Instructions

* Work step by step. Do not skip any task.
* Before implementing a feature, inspect the existing codebase to determine whether it already exists.
* Reuse existing code whenever possible instead of rewriting working components.
* Keep the code simple, clean, readable, maintainable, and production-ready.
* Do not modify existing working functionality unless required.
* If a required dependency is missing, install and configure it.
* After each completed feature, verify the relevant functionality by running the application or available tests. If verification cannot be performed, clearly state what remains unverified.
* Maintain consistent coding standards throughout the project.

---

# FRONTEND DEVELOPMENT (React.js)

Create a modern, responsive, and farmer-friendly **React.js web application**.

Use:

* React.js
* React Router
* Axios
* Tailwind CSS
* Framer Motion (for animations)
* React Icons

The application should contain six pages.

## 1. Splash Screen

* Display CropCare AI branding.
* Use an agriculture-themed illustration.
* Show for 3–4 seconds.
* Automatically navigate to the Language Selection page.
* Include smooth fade and scale animations.

---

## 2. Language Selection

Supported languages:

* English
* Tamil
* Hindi
* Telugu
* Malayalam
* Marathi

Requirements:

* Allow the user to select only one language.
* Store the selected language.
* Automatically navigate to the Role Selection page.

---

## 3. Role Selection

Allow the user to choose one role:

* Farmer
* Agriculture Expert

Store the selected role and navigate to the Login page.

---

## 4. Login Page

Both Farmer and Agriculture Expert should use the same login interface.

Features:

* Mobile number input
* Generate OTP
* Verify OTP
* Login using OTP

Store Farmer and Agriculture Expert details in separate backend tables.

Design the page to be clean, responsive, and easy to use for first-time users.

---

## 5. AI Chat Page

Features:

* Chat interface
* Upload plant image
* Drag-and-drop image upload
* Voice recording button
* Speech-to-text integration
* Send message
* Display disease prediction
* Display confidence score
* Display AI response
* Display medicine recommendation
* Display treatment steps
* Display precautions

The UI should remain simple and easy to understand.

---

## 6. Agriculture Expert Chat

Allow communication between Farmers and Agriculture Experts.

Features:

* Text messaging
* Image sharing
* Voice recording
* Simple conversation layout

---

## UI Requirements

* Modern responsive design
* Tailwind CSS
* Material-inspired cards
* Rounded corners
* Soft shadows
* Smooth page transitions
* Framer Motion animations
* Responsive on desktop, tablet, and mobile browsers
* Large buttons and clear typography
* Farmer-friendly interface

---

# BACKEND DEVELOPMENT

Do not remove or rewrite existing working functionality.

Extend the backend only where required.

## Faster-Whisper

Configure Faster-Whisper correctly.

Verify:

* Audio upload
* Audio transcription
* Supported audio formats
* Language detection
* Returned text

If GPU is available, use GPU.

Otherwise use CPU.

---

## Database

Create two tables:

Farmer

AgricultureExpert

Store:

* Mobile Number
* OTP verification status
* Login timestamp
* Preferred language
* Role

Do not modify existing prediction tables.

---

## Prediction

Verify that:

* Uploaded image reaches the backend.
* CNN model loads successfully.
* Prediction executes correctly.
* Disease name is returned.
* Confidence score is returned.

---

## Speech-to-Text

Verify:

* Audio upload endpoint.
* Faster-Whisper transcription.
* Transcribed text is returned to the frontend.
* The recognized text automatically appears inside the chat input.

Support:

* English
* Tamil
* Hindi
* Telugu
* Malayalam
* Marathi

If automatic language detection is insufficient, allow the frontend to specify the expected language.

---

# APPLICATION FLOW

Farmer Login

↓

AI Chat Page

↓

Upload Plant Image

↓

CNN Disease Detection

↓

Return Disease + Confidence

↓

Send Disease and User Query to RAG (future integration)

↓

Generate Recommendation

↓

Display Medicine

↓

Display Precautions

↓

Display Recovery Advice

---

Voice Flow

User clicks the microphone button

↓

Record Audio

↓

Upload Audio

↓

Faster-Whisper

↓

Speech-to-Text

↓

Populate Chat Input

↓

Send to RAG

↓

Display AI Response

---

# FRONTEND + BACKEND INTEGRATION

Connect every React.js page with the corresponding FastAPI endpoint.

Verify API connectivity for:

* Login
* OTP
* Prediction
* Speech-to-text
* Chat
* Prediction History

Implement loading indicators, proper error handling, and responsive user feedback.

---

# FINAL REVIEW

Review the complete application.

For every feature:

* Confirm whether it is implemented.
* Confirm whether it has been verified.
* If verification cannot be performed, explain why and provide the exact manual verification steps.

Finally, generate a checklist containing:

* Completed features
* Pending features
* Verified features
* Unverified features
* Known issues
* Recommended future improvements
