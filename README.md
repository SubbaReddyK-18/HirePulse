# ⚡ HirePulse — Career & Job Recruitment Portal

[![HTML5](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JS%20(ES6+)-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Axios](https://img.shields.io/badge/Networking-Axios%20HTTP-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com)
[![JSON-Server](https://img.shields.io/badge/Backend-JSON--Server%20(REST%20API)-02569B?style=for-the-badge&logo=json&logoColor=white)](https://github.com/typicode/json-server)
[![License: ISC](https://img.shields.io/badge/License-ISC-007ACC?style=for-the-badge)](LICENSE)

**HirePulse** is a responsive, full-featured web application designed to connect ambitious job seekers with recruiters in a centralized environment. Built on fundamental web standards (Vanilla JavaScript ES6+, HTML5, CSS3, Axios, and a JSON Server REST backend), HirePulse demonstrates scalable client-side architecture, Role-Based Access Control (RBAC), and persistent data flows without framework dependencies.

---

## 📌 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features & Modules](#-key-features--modules)
- [System Architecture & Workflow](#-system-architecture--workflow)
- [Technology Stack](#-technology-stack)
- [Directory Structure](#-directory-structure)
- [Quick Start Guide](#-quick-start-guide)
- [Demo Credentials](#-demo-credentials)
- [REST API Endpoints](#-rest-api-endpoints)
- [Key Engineering Highlights](#-key-engineering-highlights)

---

## 🎯 Project Overview

In traditional recruitment portals, candidates struggle with cluttered interfaces and opaque application tracking, while recruiters lack lightweight tools to manage job lifecycles and evaluate incoming talent. 

**HirePulse solves this by providing:**
- A **Candidate Workspace** with real-time job exploration, multi-criteria filtering, and one-click PDF resume submission (< 10MB).
- A **Recruiter Command Center** for end-to-end job publishing, editing, deletion with cascading applicant cleanup, and live status pipeline updates.
- A **Modular Service Architecture** powered by Axios and standard REST conventions.

---

## ✨ Key Features & Modules

### 1. 🔐 Authentication & Role-Based Access Control (RBAC)
- **Dual-Role Onboarding:** Register as either a **Candidate** or a **Recruiter**.
- **Session Management:** Secure browser session persistence via `localStorage` (`hirepulse_session`).
- **Route Guarding:** Centralized client-side route access control (`data-access="public|guest|candidate|recruiter"`) that automatically redirects unauthorized visitors.

### 2. 🔍 Job Discovery & Advanced Filtering Engine
- **Instant Search:** Case-insensitive search matching job titles, company names, and comma-separated technical skills.
- **Non-Overlapping Experience Filters:** Distinct brackets (`0-1 years`, `1-3 years`, `3-5 years`, `5+ years`).
- **Location Filtering & Live Counters:** Dynamically updates results count and empty-state placeholders.

### 3. 📄 Candidate Portal & PDF Resume Submission
- **Job Details View:** High-level overview of company, compensation (INR currency formatted), requirements, and date posted.
- **Interactive PDF Resume Upload:** Native file selector with strict validation (PDF only, maximum file size 10MB).
- **Application Status Tracking:** Live tracking across all hiring stages: `Applied` ➔ `Under Review` ➔ `Shortlisted` ➔ `Interview` ➔ `Selected` ➔ `Rejected`.

### 4. 💼 Recruiter Management Suite
- **Job Lifecycle (CRUD):** Publish new openings, modify salary/requirements, and delete expired postings.
- **Cascade Deletion:** Automatically cleans up associated candidate applications whenever a job is removed.
- **Applicant Evaluation Dashboard:** Review candidate profiles, download submitted PDF resumes, and update application statuses with instant synchronization.

---

## 🏗️ System Architecture & Workflow

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                     │
│  Semantic HTML5  •  CSS3 Design System  •  Dynamic DOM JS   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Service Layer                        │
│   jobService  •  applicationService  •  userService  • auth │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Axios HTTP Client)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Persistence Layer                       │
│    JSON-Server (REST API :3000)  •  db.json Database File   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Overview (DFD Level 0)
- **Candidate:** Discovers Jobs ➔ Submits Application with PDF Resume ➔ Tracks Status in Dashboard.
- **Recruiter:** Creates Job Postings ➔ Evaluates Applicants ➔ Updates Application Status (Applied / Interview / Selected).
- **REST Engine (`db.json`):** Serves `/users`, `/jobs`, and `/applications` over standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).

---

## 💻 Technology Stack

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Frontend** | HTML5, Modern CSS3, JavaScript (ES6+) | Structure, responsive UI tokens, and dynamic DOM manipulation |
| **Build & Tooling** | ESBuild (Distribution Bundles in `js/dist/`) | Bundling for high-performance universal browser execution (`http://` & `file://`) |
| **Networking** | Axios (`apiConfig.js`) | Centralized REST client with timeout handling and error wrappers |
| **Mock Database** | JSON Server (`db.json`) | Full REST API server supporting CRUD, sorting, and relational queries |
| **Authentication** | LocalStorage Session Layer | Client-side role persistence and route guard verification |

---

## 📁 Directory Structure

```
BATCH PROJECT/
├── assets/
│   ├── logo.svg                     # Official HirePulse HP Monogram Logo
│   └── ...
├── css/
│   ├── layout.css                   # Grid, Navbar, Profile Badges & Global Layouts
│   ├── style.css                    # Component Styles, Buttons, Cards, File Upload UI
│   └── dashboard.css                # Recruiter & Candidate Workspace Tables / Metrics
├── js/
│   ├── service/
│   │   ├── apiConfig.js             # Centralized Axios instance configuration
│   │   ├── jobService.js            # Job CRUD & cascade deletion logic
│   │   ├── applicationService.js    # Application tracking & status update APIs
│   │   └── userService.js           # User registration and lookup endpoints
│   ├── exception/
│   │   ├── apiException.js          # Unified API error handling & network guards
│   │   └── validationException.js   # Form & PDF file validation boundaries
│   ├── auth.js                      # RBAC session authentication utilities
│   ├── main.js                      # Navigation bar, layout lifecycle & route guards
│   ├── home.js                      # Featured jobs & landing page counters
│   ├── jobs.js                      # Search and filtering engine
│   ├── jobDetails.js                # Job requirements view & PDF application upload
│   ├── candidateDashboard.js        # Candidate metrics & recent application status
│   ├── myApplications.js            # Candidate application history with PDF links
│   ├── recruiterDashboard.js        # Recruiter job management table & actions
│   ├── applicants.js                # Recruiter applicant review & status dropdowns
│   ├── createJob.js                 # Job publishing handler
│   ├── editJob.js                   # Job update handler
│   ├── utils.js                     # Formatting, currency, date & query param helpers
│   └── dist/                        # High-performance bundled distribution scripts
├── views/
│   ├── index.html                   # Landing page
│   ├── jobs.html                    # Job exploration page
│   ├── job-details.html             # Job details & application page
│   ├── login.html                   # Authentication login portal
│   ├── register.html                # Account registration page
│   ├── candidate-dashboard.html     # Candidate workspace
│   ├── my-applications.html         # Application status tracker
│   ├── recruiter-dashboard.html     # Recruiter workspace
│   ├── applicants.html              # Applicant evaluation screen
│   ├── create-job.html              # Publish new opening
│   └── edit-job.html                # Update existing opening
├── db.json                          # Mock database (Users, Jobs, Applications)
├── package.json                     # Project manifest & npm scripts
├── run_project.bat                  # 1-Click Launch Script for Windows
├── serve.json                       # Web server configuration (prevents parameter drop)
└── README.md                        # Documentation
```

---

## 🚀 Quick Start Guide

### Option 1: 1-Click Launch (Recommended)
Simply double-click **`run_project.bat`** in the project folder. It will start both the Mock Database server and the Frontend web server, automatically opening your browser to:
👉 **`http://localhost:5500/views/index.html`**

---

### Option 2: Manual Terminal Commands

#### Step 1: Start the Backend Database Server
Open a terminal in the root folder and run:
```powershell
npx -y json-server db.json --port 3000
```
> *API server runs at: `http://localhost:3000`*

#### Step 2: Start the Frontend Web Server
Open a second terminal in the root folder and run:
```powershell
npx -y serve . -p 5500
```
> *Frontend app runs at: `http://localhost:5500/views/index.html`*

---

## 🔑 Demo Credentials

Use these pre-configured accounts for testing and live evaluation:

| Role | Email | Password | Access & Features to Showcase |
| :--- | :--- | :--- | :--- |
| **Candidate** | `priya.sharma@gmail.com` | `password123` | Search jobs, upload PDF resume (<10MB), apply, and track status in *My Applications*. |
| **Recruiter** | `ananya@techverse.com` | `recruiter123` | Post new roles, edit/delete postings, view applicants, download candidate resumes, and update statuses. |
| **Recruiter** | `vikram@cloudcraft.com` | `recruiter123` | Manage DevOps & Cloud postings and review technical applicants. |

---

## 📡 REST API Endpoints

HirePulse adheres to standard RESTful principles:

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/users` | `GET` | Retrieve list of registered users |
| `/users` | `POST` | Register a new candidate or recruiter account |
| `/jobs` | `GET` | Fetch all open job listings |
| `/jobs/:id` | `GET` | Fetch details of a single job opening |
| `/jobs` | `POST` | Create a new job listing (Recruiter only) |
| `/jobs/:id` | `PUT` | Update an existing job listing |
| `/jobs/:id` | `DELETE`| Remove a job listing (triggers cascade delete on applications) |
| `/applications` | `GET` | Retrieve applications (filterable by `userId` or `jobId`) |
| `/applications` | `POST` | Submit a new application with Base64 PDF resume payload |
| `/applications/:id`| `PATCH`| Update candidate hiring status (`Interview`, `Selected`, etc.) |

---

## 💡 Key Engineering Highlights

1. **Client-Side PDF Handling:** Implemented file parsing using `FileReader.readAsDataURL()`, enabling candidates to upload authentic `.pdf` documents (<10MB) and recruiters to download them directly from the browser.
2. **Cascade Data Integrity:** When a recruiter removes a job opening, composite service logic ensures all associated applicant records are cleaned up atomically.
3. **Session-Resilient Parameter Persistence:** Custom `getQueryParam()` with `sessionStorage` fallback guarantees that URL query parameters (`?id=...`, `?jobId=...`) are never lost during server redirects or manual browser refreshes.
4. **Zero-Dependency Core:** Built using modular vanilla JavaScript, making the codebase fast, lightweight, and easy to review without framework bloat.

---

## 📄 License
This project is licensed under the [ISC License](LICENSE).
Developed by the **HirePulse Team** as part of the Web Development / MERN Foundations Curriculum.
