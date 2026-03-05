# AI Job-Hunting Agent Setup - Walkthrough

## Summary

Successfully set up a fully functional AI job-hunting assistant using **OpenClaw v2026.1.29** with **Gemini 3 Pro Preview** as the LLM.

## What Was Completed

### OpenClaw Installation
- Installed via official curl script
- Node.js updated to v22.22.0
- Gateway service running on `http://127.0.0.1:18789/`
- systemd service enabled with lingering

### Configuration
| Item | Value |
|------|-------|
| OpenClaw Version | 2026.1.29 |
| LLM Model | `google/gemini-3-pro-preview` |
| Gateway Port | 18789 (loopback only) |
| Auth | Token-based |

### Job-Hunting Skills Created

Six skill modules in `~/.openclaw/skills/jobhunt/`:

| Skill | Command | Function |
|-------|---------|----------|
| Resume | `/resume` | Generate tailored, ATS-optimized resumes |
| Cover Letter | `/cover` | Create personalized cover letters |
| Interview Prep | `/interview` | Tech questions, STAR coaching, mock interviews |
| Job Search | `/jobs` | Automated job search with daily digests |
| Company Research | `/research` | Company analysis for interview prep |
| Tracker | `/track` | Application status tracking |

### Directory Structure

```
~/job-hunt/
├── applications/      # Generated resumes, cover letters
├── research/          # Company research notes
├── interview-notes/   # Interview prep notes
├── trackers/          # Application tracking data
└── memory/            # Session memory

~/.jobhunt-agent/memory/
└── profile.json       # Your skills & preferences template
```

### CLI Wrapper

A `jobhunt` command wrapper at `~/.local/bin/jobhunt`:

```bash
jobhunt resume https://linkedin.com/jobs/...  # Generate resume
jobhunt cover [job_url]                        # Create cover letter
jobhunt interview tech Microsoft               # Interview prep
jobhunt research Google                        # Research company
jobhunt jobs                                   # Search for jobs
jobhunt track add "Company" "Role"             # Track application
jobhunt chat                                   # Interactive mode
```

## Next Steps

1. **Fill in your profile** at `~/.jobhunt-agent/memory/profile.json`
2. **Start the agent** with `jobhunt chat` or via dashboard at `http://127.0.0.1:18789/`
3. **Try generating a resume**: `jobhunt resume`

## Verification

```bash
$ openclaw status    # Gateway running, 1 agent active
$ jobhunt help       # CLI working ✓
```
