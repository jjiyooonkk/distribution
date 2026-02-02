# Intelligent Personnel Distribution System - Implementation Plan

## 1. Project Initialization & Setup
- [x] Initialize Next.js App (TypeScript, App Router, No Tailwind)
- [x] Set up directory structure (components, lib, hooks, types)
- [x] Configure global styles (CSS Variables for premium aesthetics)
- [x] Install necessary dependencies (`xlsx`, `framer-motion` for animations, `@dnd-kit/core` for drag-drop, `lucide-react` for icons)

## 2. Core Design System & Layout
- [ ] Create `globals.css` with HSL color variables (Vibrant, Dark Mode support)
- [ ] Create reusable UI components:
    - `Button` (Premium feel, hover effects)
    - `Card` (Glassmorphism)
    - `Input/Select`
    - `Layout` (Sidebar/Header)

## 3. Feature: Project Configuration (Input)
- [x] **Team Config UI**: Dynamic form to set unit names and counts (e.g., "1~8 Team, 10 people each").
- [x] **Data Import**:
    - File Upload Component (Drag & drop zone).
    - Parse CSV/Excel using `xlsx`.
    - Data Preview Table.
- [x] **AI Semantic Mapping**:
    - Interface to map columns (Name, Gender, ID) to system fields.
    - (Mock logic initially) Auto-detect column headers.

## 4. Feature: Distribution Logic & Constraints
- [x] **Distribution Engine**:
    - Core algorithm: Random shuffle with constraints.
    - Balance logic: Gender ratio, Year distribution.
    - **History Constraints**:
        - Max 2 visits to the same location (exception: 'Anseong').
        - Consecutive visit avoidance: If last was 'Hoil' or 'Boseong', cannot be placed there again immediately.
- [ ] **Constraint Prompt Interface**:
    - Chat-like input for natural language rules.
    - Parser logic (Regex or LLM stub) to convert "Must have 1 driver" to code constraint.

## 5. Feature: Review & Dashboard (Review & Edit)
- [ ] **Interactive Board**:
    - KanBan-style board showing teams.
    - Drag-and-drop to move personnel (`@dnd-kit`).
- [ ] **Stats Dashboard**:
    - Real-time charts (Gender ratio per team).
    - Violation alerts (red flags if constraints unmet).

## 6. Feature: Finalization & Notification
- [x] **Approval Workflow**:
    - "Simulate" vs "Confirm" vs "Approve" states.
    - Report generation (Markdown/PDF view).
- [x] **Telegram Integration**:
    - Setup API route for sending messages.
    - Fallback/Preview mode (Show what would be sent).

## 7. Feature: LLM Agent Integration (Personnel Distribution Architect)
- [x] **Agent Interface**:
    - Chat/Command input component in the Distribution Board.
    - Display for "Reasoning" and "Assignment Rationales".
- [x] **Agent Logic (Backend)**:
    - API Route (`/api/agent/route`) to handle natural language requests.
    - System Prompt implementation based on user definition.
    - Structured output parsing (JSON -> Constraints).
- [ ] **Dynamic Constraint Engine**:
    - Map natural language "A and B separate" to algorithmic constraints.
    - Map "Drivers per team" to counter-based constraints.

## 7. Refinement & Polish
- [ ] Add micro-animations (Framer Motion).
- [ ] specialized SEO tags.
- [ ] Documentation.
