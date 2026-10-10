# Hackathon-Rmit-2026

> **Team:** Suits (Co Ro Chuong Bich)  
> **Event:** RMIT Hackathon 2026  
> **Core Disciplines:** Multi-Agent Systems, Computational Fluid Dynamics (CFD), and High-Performance Modern C++20

---

## 📌 Repository Overview

This repository contains engineering solutions developed by **Team Suits (Co Ro Chuong Bich)** for the RMIT Hackathon 2026, encompassing three core subprojects:

1. 🛡️ **Resilient Agentic Orchestrator (RAO):** A production-grade multi-agent StateGraph engine equipped with dual-layer security guardrails (OWASP Top 10 for LLMs), specialized Vietnamese logistics NLP (slang and shorthand resolution), and strict Pydantic v2 data contracts.
2. 🔢 **Universal Number Classifier & Analyzer:** A versatile, high-performance mathematical classification and number-theoretic analysis system engineered in modern **C++20**.
3. 🚴 **FEniCS CFD Cycling Aerodynamics & Power Simulation:** A finite element fluid dynamics solver computing the incompressible **Navier-Stokes equations** via **FEniCS** to evaluate aerodynamic drag and mechanical power (Watts) for an elite carbon road cyclist ascending a 5% slope at 40 km/h.

---

## 🗂️ Project Directory Structure

```text
Hackathon-Rmit-2026/
├── 📁 resilient_agentic_orchestrator/  # [PROJECT 1] Multi-Agent Security & NLP Engine (Python 3.11+)
│   ├── rao/
│   │   ├── schemas.py                 # Pydantic v2 Data Contracts (extra='forbid', strict=True)
│   │   ├── state.py                   # AgentState, DAG Plan, TraceEvent, Security Verdicts
│   │   ├── tools.py                   # ToolRegistry, Retry Logic, Mock ERP/WMS/TMS Backend
│   │   ├── orchestrator.py            # StateGraph Engine (5-Node Execution Pipeline)
│   │   ├── planner.py                 # Planner Agent (Task Decomposition DAG)
│   │   ├── security/                  # SanitizerGuard (PII Redaction) & InjectionFirewall
│   │   └── nlp/                       # Vietnamese Logistics Lexicon, Slang & Hybrid Retriever (BM25 + Dense)
│   ├── tests/test_rao.py              # Automated Pytest Suite (TC-01, TC-02, TC-03)
│   ├── benchmark.py                   # Interactive CLI Benchmark Runner
│   ├── pyproject.toml                 # Dependencies & Build Configuration
│   └── README.md                      # Comprehensive Technical Documentation for RAO
│
├── 📁 universal_number_classifier/     # [PROJECT 2] C++20 Number Classifier & Analyzer
│   ├── include/                       # Header Files (Common types, Parser, Number Theory, Geometry)
│   ├── src/                           # Algorithm Implementations & CLI Entry Point
│   ├── tests/                         # Automated Unit Tests (100% pass)
│   ├── build.sh                       # One-click Build Script (g++ C++20)
│   ├── Makefile                       # Standard Makefile
│   └── README.md                      # Detailed C++ Subproject Documentation
│
├── 📁 cycling_aero_simulation/         # [PROJECT 3] FEniCS CFD Aerodynamics & Road Dynamics
│   ├── simulate_cycling_aero.py       # Navier-Stokes Solver & Power Calculation Script
│   ├── output/                        # Analysis Plots & ParaView Visualization Datasets (.pvd, .vtu)
│   └── README.md                      # Theoretical Mechanics & Simulation Findings
│
├── 📁 Hung-practice/                   # Member experimentation workspace
├── .gitignore                         # Git exclusion rules
└── README.md                          # Repository Master Documentation
```

---

## 🚀 Subprojects Summary

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
  .venv/bin/pytest -v            # Run automated test suite (8/8 tests pass, 100%)
  .venv/bin/python benchmark.py   # Run benchmark runner across TC-01, TC-02, and TC-03
  ```

---

### 2. 🔢 Universal Number Classifier & Analyzer (C++20)
* **Directory:** [`universal_number_classifier/`](./universal_number_classifier/)
* **Key Features:**
  * **Mathematical Set Membership:** Complex numbers $\mathbb{C}$, Real numbers $\mathbb{R}$, Rational numbers $\mathbb{Q}$, Irrational numbers $\mathbb{R}\setminus\mathbb{Q}$, Integers $\mathbb{Z}$, Natural numbers $\mathbb{N}, \mathbb{N}^*$.
  * **Comprehensive Number Theory:** Primality testing, prime factorization, divisor enumeration, perfect/abundant/deficient classification, perfect squares/cubes, powers of 2, Fibonacci numbers, Armstrong numbers, triangular numbers, and happy numbers.
* **Execution Commands:**
  ```bash
  cd universal_number_classifier
  ./build.sh && ./bin/test_classifier
  ./bin/number_classifier 997
  ```

---

### 3. 🚴 FEniCS CFD Cycling Aerodynamics & Power Simulation
* **Directory:** [`cycling_aero_simulation/`](./cycling_aero_simulation/)
* **Key Features:**
  * Solves steady incompressible **Navier-Stokes equations** using Taylor-Hood ($P_2 - P_1$) mixed finite elements and the MUMPS parallel direct solver.
  * Evaluates physical road dynamics power required to maintain 40 km/h with 3 km/h headwind on a 5% slope: **761.88 WATTS** (10.58 W/kg).
  * Exports 3D vector flow field and pressure data for **ParaView** (`velocity.pvd`, `pressure.pvd`).
* **Execution Commands:**
  ```bash
  cd cycling_aero_simulation
  python3 simulate_cycling_aero.py
  ```

---

## 🛠️ Technology Stack

| Domain | Technologies & Libraries |
| :--- | :--- |
| **Agentic Orchestration & Security** | Python 3.11+, Pydantic v2, StateGraph Engine, Multi-View Regex, Subword Hashing, BM25 |
| **Systems & High-Performance Computing** | C++20, g++ 15.2, Makefile |
| **Scientific Computing & CFD** | FEniCS 2019.2, mshr, PETSc, MUMPS, ParaView 6.1.1 |
| **Testing & CI/CD** | Pytest, Git, GitHub Actions |
| **Execution Environment** | Ubuntu 26.04 LTS on WSL 2 (Windows Subsystem for Linux) |

---

*Authored by Team Suits (Co Ro Chuong Bich) — RMIT Hackathon 2026.*
