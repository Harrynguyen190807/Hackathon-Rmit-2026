# Hackathon-Rmit-2026

> **Team:** Suits (Co Ro Chuong Bich)  
> **Event:** RMIT Hackathon 2026  
> **Core Disciplines:** Resilient Multi-Agent Systems, Dual-Layer LLM Security Guardrails (OWASP Top 10 for LLMs), Low-Resource Vietnamese Logistics NLP, and Autonomous Agent Meta-Skills Hub

---

## 📌 Repository Overview

This repository contains engineering solutions and architectural playbooks developed by **Team Suits (Co Ro Chuong Bich)** for the RMIT Hackathon 2026, comprising two core modules:

1. 🛡️ **Resilient Agentic Orchestrator (RAO):** A production-grade multi-agent StateGraph engine equipped with dual-layer security guardrails (OWASP Top 10 for LLMs), specialized Vietnamese logistics NLP (slang and shorthand resolution), and strict Pydantic v2 data contracts.
2. 🚀 **Hackathon 2026 Skills Hub (`.agents/skills/`):** Full-stack playbooks & meta-skills adhering to Google Antigravity standards for rapid development, local ChromaDB RAG, cyber prompt defense, dark-mode real-time UI, and pitch orchestration.

---

## 🗂️ Project Directory Structure

```text
Hackathon-Rmit-2026/
├── 📁 .agents/skills/                  # [META-SKILLS HUB] Antigravity Playbooks & Meta-Skills
│   ├── hackathon-fastapi-backend/     # Async FastAPI, SSE streaming, CORS, crash-proof handlers
│   │   └── SKILL.md
│   ├── rag-chromadb-pipeline/         # Local ChromaDB, Vietnamese chunking, hybrid top-k, citations
│   │   └── SKILL.md
│   ├── cyber-prompt-guard/            # OWASP LLM defense, injection firewall, Canary tokens, PII masking
│   │   └── SKILL.md
│   ├── rapid-prototype-ui/            # Streamlit & Next.js 15 UI, SOC terminal logs, risk meter
│   │   └── SKILL.md
│   └── pitch-demo-orchestrator/       # 180s pitch script, Murphy's law backup, Mermaid architecture
│       └── SKILL.md
│
├── 📁 resilient_agentic_orchestrator/  # [CORE SYSTEM] Multi-Agent Security & NLP Engine (Python 3.11+)
│   ├── rao/
│   │   ├── schemas.py                 # Pydantic v2 Data Contracts (extra='forbid', strict=True)
│   │   ├── state.py                   # AgentState, DAG Plan, TraceEvent, Security Verdicts
│   │   ├── tools.py                   # ToolRegistry, Retry Logic, Mock ERP/WMS/TMS Backend
│   │   ├── orchestrator.py            # StateGraph Engine (5-Node Execution Pipeline)
│   │   ├── planner.py                 # Planner Agent (Task Decomposition DAG)
│   │   ├── security/                  # SanitizerGuard (PII Redaction) & InjectionFirewall
│   │   │   ├── firewall.py            # Dual-layer injection detection & quarantine
│   │   │   └── sanitizer.py           # Reversible PII vault & regex redactor
│   │   └── nlp/                       # Vietnamese Lexicon, Slang & Hybrid Retriever (BM25 + Dense)
│   │       ├── lexicon.py             # Logistics dictionary & administrative mapping
│   │       ├── retrieval.py           # BM25 + Dense hash subword RRF index
│   │       └── text.py                # Diacritic folding & zero-width stripper
│   ├── tests/
│   │   └── test_rao.py                # Automated Pytest Suite (TC-01, TC-02, TC-03 + Security)
│   ├── benchmark.py                   # Interactive CLI Benchmark Runner
│   ├── pyproject.toml                 # Dependencies & Build Configuration
│   └── README.md                      # Detailed Technical Documentation for RAO
│
├── 📁 scripts/                        # Utility scripts (e.g. symlink_skills)
├── .gitignore                         # Git exclusion rules
└── README.md                          # Repository Master Documentation
```

---

## 🚀 Projects & Modules Summary

### 1. 🛡️ Resilient Agentic Orchestrator (RAO)
* **Directory:** [`resilient_agentic_orchestrator/`](./resilient_agentic_orchestrator/)
* **Key Features:**
  * **Deterministic 5-Node StateGraph:** `[Input] -> [Guardrail Pre-Check] -> [Planner/Router] -> [Tool Execution] -> [Response Synthesis] -> [Guardrail Post-Check]`.
  * **Dual-Layer Security Guardrails:**
    * *SanitizerGuard:* Anonymizes phone numbers, national IDs, personal names, API keys, and JWT tokens into an isolated vault.
    * *InjectionFirewall:* Multi-view regex and heuristic classification neutralizing direct and indirect prompt injection attempts while shielding internal system prompts.
  * **Localized Vietnamese Logistics NLP:** Accurately parses regional shorthand (`ktra`, `NCC`, `SL`, `đh`), colloquial particles (`tui`, `nha sếp`, `nghen`), administrative abbreviations (`Q.7`, `TP.HCM`), and compound durations (`2 tiếng rưỡi` $\rightarrow$ 150 minutes).
  * **Hybrid Retrieval:** Reciprocal Rank Fusion (RRF) integrating BM25 keyword matching with dense subword hashing.
  * **Strict Pydantic v2 Contracts:** Zero-hallucination execution via `extra="forbid"` and `strict=True`.
* **Execution Commands:**
  ```bash
  cd resilient_agentic_orchestrator
  source .venv/bin/activate
  pytest -v                      # Run automated test suite (8/8 tests pass, 100%)
  python benchmark.py            # Run benchmark runner across TC-01, TC-02, and TC-03
  ```

---

### 2. 🚀 Hackathon 2026 Skills Hub (`.agents/skills/`)
* **Directory:** [`.agents/skills/`](./.agents/skills/)
* **Overview:** Standardized meta-skills adhering to Google Antigravity specifications, built for instant 24h-48h hackathon deployment:

| Skill Identifier | Detailed Playbook | Core Focus |
| :--- | :--- | :--- |
| **`hackathon-fastapi-backend`** | [`SKILL.md`](./.agents/skills/hackathon-fastapi-backend/SKILL.md) | Async FastAPI, multi-port CORS, SSE streaming, dependency injection, crash-proof handlers. |
| **`rag-chromadb-pipeline`** | [`SKILL.md`](./.agents/skills/rag-chromadb-pipeline/SKILL.md) | Local ChromaDB, Vietnamese sentence-sliding chunker, hybrid top-k retrieval, citations & anti-hallucination. |
| **`cyber-prompt-guard`** | [`SKILL.md`](./.agents/skills/cyber-prompt-guard/SKILL.md) | OWASP LLM defense, Canary tokens, delimiter isolation, Vietnamese PII redaction, sliding-window rate limiter. |
| **`rapid-prototype-ui`** | [`SKILL.md`](./.agents/skills/rapid-prototype-ui/SKILL.md) | Dark-mode Streamlit & Next.js 15 UI, KPI cards, real-time SOC log console, mock failover switch. |
| **`pitch-demo-orchestrator`** | [`SKILL.md`](./.agents/skills/pitch-demo-orchestrator/SKILL.md) | 180-second golden path pitch script, Murphy's Law offline backup protocol, Mermaid architecture diagram. |

* **Porting to other projects:**
  ```bash
  cp -r .agents/skills/* /path/to/any-new-project/.agents/skills/
  ```

---

## 🛠️ Technology Stack

| Domain | Technologies & Libraries |
| :--- | :--- |
| **Meta-Skills & Agent Architecture** | Google Antigravity, YAML Frontmatter, Fast-inference Prompt Engineering |
| **Agentic Orchestration & Security** | Python 3.11+, Pydantic v2, StateGraph Engine, Multi-View Regex, Subword Hashing, BM25 |
| **Testing & CI/CD** | Pytest 9.1+, Git, GitHub Actions |
| **Execution Environment** | Ubuntu 26.04 LTS on WSL 2 / Windows 11 |

---

*Authored by Team Suits (Co Ro Chuong Bich) — RMIT Hackathon 2026.*
