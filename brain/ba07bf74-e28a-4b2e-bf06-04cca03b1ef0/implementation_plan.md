# AI Job-Hunting Agent Implementation Plan

## Overview

Build a locally-running AI job-hunting assistant using **OpenClaw** as the agent framework, powered by **Gemini Premium** API. The system will automate resume tailoring, interview preparation, job searching, company research, and application tracking.

> [!IMPORTANT]
> **Prerequisite**: The OpenClaw installer is currently waiting for your confirmation in the terminal. You need to:
> 1. Select **"Yes"** to accept the security warning
> 2. Complete the onboarding wizard prompts
> 3. Provide your Gemini API key when prompted

---

## User Review Required

### Decisions Needed

1. **Experience Level**: What is your years of experience for job search filters?
2. **Salary Range**: Do you have a preferred salary range to filter jobs?
3. **Resume Source**: Do you have an existing resume I should use as a base template, or should I create a new one from scratch?
4. **Messaging Channel**: Which platform do you want to interact with the agent through?
   - Terminal/CLI only
   - WhatsApp
   - Telegram
   - Discord

> [!WARNING]
> The OpenClaw installation requires completing the interactive onboarding in your terminal before I can proceed with configuration. Please complete the wizard first.

---

## Proposed Changes

### Phase 1: Complete Installation

#### [NEW] Fix PATH Configuration
Add npm global bin to your shell profile:

```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="/home/swastik/.npm-global/bin:$PATH"
```

#### Complete OpenClaw Onboarding
In your terminal running the installer:
1. Arrow key to select **Yes** on security warning
2. Press Enter to continue
3. Follow wizard prompts for:
   - Gateway configuration
   - API key setup (Gemini)
   - Workspace selection

---

### Phase 2: API Integration

#### [NEW] `~/.openclaw/openclaw.json`
Configure Gemini as primary LLM provider:

```json
{
  "llm": {
    "provider": "google",
    "model": "gemini-2.0-flash",
    "apiKey": "${GEMINI_API_KEY}"
  },
  "workspace": "/home/swastik/.jobhunt-agent"
}
```

#### [NEW] `~/.jobhunt-agent/.env`
Secure API key storage:

```bash
GEMINI_API_KEY=your_api_key_here
```

---

### Phase 3: Job-Hunting Skills

OpenClaw uses "skills" - markdown instruction files that define agent capabilities. We'll create custom skills for each job-hunting function.

#### [NEW] `~/.openclaw/skills/job-hunting/resume-generator/SKILL.md`
- Takes job description URL/text as input
- Analyzes job requirements and extracts keywords
- Generates ATS-optimized resume with keyword match score
- Saves to `~/job-hunt/applications/{company}/{date}/resume.pdf`

#### [NEW] `~/.openclaw/skills/job-hunting/cover-letter/SKILL.md`
- Generates personalized cover letters with company-specific hooks
- References matched skills from resume
- Saves alongside resume in same directory

#### [NEW] `~/.openclaw/skills/job-hunting/interview-prep/SKILL.md`
- **Technical mode**: Role-specific coding/system design questions
- **Behavioral mode**: STAR-method coaching, HR question practice
- **Mock interview**: Timed sessions with scoring and feedback
- Logs all Q&A history for review

#### [NEW] `~/.openclaw/skills/job-hunting/job-search/SKILL.md`
- Configured for: DevOps, SRE, Cloud Engineer, Platform Engineer
- Location: India (remote-friendly)
- Sources: LinkedIn, Naukri, Indeed, Instahyre, AngelList
- Outputs daily digest in JSON/CSV format

#### [NEW] `~/.openclaw/skills/job-hunting/company-research/SKILL.md`
- Gathers company overview, tech stack, funding
- Summarizes Glassdoor ratings and reviews
- Compiles interview experiences
- Outputs markdown brief

#### [NEW] `~/.openclaw/skills/job-hunting/tracker/SKILL.md`
- Tracks application status: Applied → Phone Screen → Interview → Offer/Rejected
- Daily summary of pending follow-ups
- Reminds for applications needing follow-up (7+ days)

---

### Phase 4: Memory & Personalization

#### [NEW] `~/.jobhunt-agent/memory/`
Directory structure for persistent storage:

```
~/.jobhunt-agent/memory/
├── profile.yaml       # Skills, certifications, preferences
├── work-history.yaml  # Roles, responsibilities, achievements
├── projects.yaml      # Key projects with impact metrics
├── applications.yaml  # Application history and status
├── interviews.yaml    # Questions, answers, lessons learned
└── companies.yaml     # Researched companies cache
```

---

### Phase 5: CLI Wrapper

#### [NEW] `/media/swastik/focus/my lab/jobhunt`
Bash wrapper script for convenient commands:

```bash
#!/bin/bash
# jobhunt - AI Job Hunting Agent CLI

case "$1" in
  start)      openclaw gateway ;;
  digest)     openclaw run --skill job-search --mode digest ;;
  research)   openclaw run --skill company-research --company "$2" ;;
  # ... more commands
esac
```

---

## Verification Plan

### Automated Tests

#### 1. Installation Verification
```bash
# Check OpenClaw is installed and accessible
openclaw --version
# Expected: Version 2026.1.29 or similar

# Check API connectivity
openclaw test-api --provider google
# Expected: "API connection successful"
```

#### 2. Skill Loading Test
```bash
# Verify skills are detected
openclaw skills list
# Expected: All job-hunting skills listed
```

### Manual Tests

#### 1. Resume Generation Test
```
> "Generate a tailored resume for this job posting: [paste DevOps job URL]"
Expected: 
- Resume saved to ~/job-hunt/applications/{company}/{date}/
- Keyword match score displayed
- ATS-friendly format
```

#### 2. Company Research Test
```
> "Research Razorpay as a potential employer"
Expected:
- Company brief markdown generated
- Shows ratings, tech stack, interview tips
```

#### 3. Mock Interview Test
```
> "Conduct a 15-minute mock technical interview for a Senior DevOps role"
Expected:
- 5-7 technical questions
- Follow-up questions based on answers
- Feedback and scoring at end
```

---

## Next Steps After Approval

1. Wait for you to complete OpenClaw onboarding in terminal
2. Configure Gemini API integration
3. Create skill files for each job-hunting module
4. Set up memory structure
5. Create CLI wrapper script
6. Test each module
