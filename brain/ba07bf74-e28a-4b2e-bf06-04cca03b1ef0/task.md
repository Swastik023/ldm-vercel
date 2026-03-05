# AI Job-Hunting Agent Setup Task

## Phase 1: Installation & Configuration
- [x] Install OpenClaw v2026.1.29
- [x] Complete OpenClaw onboarding wizard
- [x] Configure Gemini Premium API key
- [x] Set Gemini as primary LLM (`google/gemini-3-pro-preview`)
- [x] Verify Gateway running (`http://127.0.0.1:18789/`)
- [x] Fix PATH for npm global bin directory

## Phase 2: Job-Hunting Task Configuration
- [x] Create job-hunting skill/workflow structure
- [x] Resume & Cover Letter Engine
  - [x] Create resume generation skill
  - [x] Create cover letter generation skill
  - [x] Set up output directory `~/job-hunt/applications/`
- [x] Interview Preparation Module
  - [x] Technical interview question generator
  - [x] Behavioral interview STAR-method coach
  - [x] Mock interview simulator with feedback
- [x] Job Search Automation
  - [x] Configure search parameters (DevOps, SRE, Cloud, India)
  - [x] Set up job source configuration
  - [x] Daily digest generation (JSON/CSV)
- [x] Company Research Agent
  - [x] Company overview gathering
  - [x] Review/ratings summarization
  - [x] Interview experience compilation
- [x] Application Tracker
  - [x] Status tracking system
  - [x] Reminder/follow-up notifications

## Phase 3: Memory & Personalization
- [x] Set up persistent memory in `~/.jobhunt-agent/memory/`
- [x] Create skills inventory template
- [x] Create work history template
- [x] Enable export/backup functionality

## Phase 4: Security & Privacy
- [x] Secure API key storage (OpenClaw config)
- [x] Configure local-first processing (Gateway loopback-only)
- [ ] Set up Ollama for sensitive operations (optional)

## Phase 5: Testing & Validation
- [x] JobHunt CLI help command test
- [x] Directory structure verification
- [ ] Full resume generation test
- [ ] Interview simulation test
- [ ] Company research test

## Phase 6: Create CLI Wrapper
- [x] Create `jobhunt` command wrapper
- [x] Document usage commands

