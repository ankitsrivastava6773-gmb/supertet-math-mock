# 📱 SuperTET Math Mock Test 2026 — Web App Quickstart

> **Online Testing & Diagnostic Simulator for Janhvi (SuperTET 2026 Aspirant)**

---

## 🚀 How to Run the App Locally

### 1. Start Development Server
```powershell
cd c:\Users\piyus\janhvi\supertet\math-mock-webapp
npm run dev
```

The app will start at:
- **Laptop / PC**: [http://localhost:3000](http://localhost:3000)
- **Phone on same Wi-Fi**: Open `http://<your-ip>:3000` (e.g., `http://192.168.1.15:3000`)

---

## ✨ Features Implemented

1. **Bilingual Toggle (🇮🇳 हिन्दी / 🇬🇧 English)**:
   - Instant live toggle across questions, options, timer, and explanations.

2. **Exam Modes**:
   - **Full Mock Test**: 20 Questions, 20-Minute Countdown Timer, (+3 / -1) Negative Marking.
   - **Quick Sprint**: 10 Questions, 10-Minute Timer.
   - **Topic Drill**: Untimed practice on specific topics (Profit & Loss, Geometry, Numbers, Indices, Statistics).

3. **Real Exam Simulator Mechanics**:
   - Live Countdown Timer with visual amber/red warning in the last 3 minutes.
   - Interactive **Question Palette** showing Answered (🟢), Current (🔵), and Unvisited (⚪) states.
   - Option selection with immediate visual indicator.
   - Clear choice and Skip buttons.
   - Auto-submit when time expires.

4. **Deep Analytics & Negative Marking Audit**:
   - Net Score vs Maximum Marks (`Marks = 3 × Correct - 1 × Wrong`).
   - Accuracy percentage.
   - **Negative Marking Alert**: Shows exact marks lost to guessing and calculates the score if skipped.
   - Average time spent per question.
   - Topic-wise breakdown with Mastery Badges (`Mastered ✅`, `Needs Practice 🟡`, `Weak Area ⚠️`).

5. **3-Layer Solution & Misconception Review**:
   - **Layer 1**: Step-by-step mathematical derivation in Hindi and English.
   - **Layer 2 (Cognitive Diagnosis)**: When an incorrect option is chosen, the system identifies the exact cognitive trap (e.g. *Selling Price vs Cost Price base confusion*, *treating 1 as a prime number*, *forgetting division by 2 in trapezium formula*).
   - **Layer 3 (Remedial Action)**: One-click button to immediately practice that weak topic again.
