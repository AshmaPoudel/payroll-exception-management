# Payroll Exception Management System

An end-to-end operational system designed to replace manual email-based 
payroll issue resolution with AI-assisted ticket classification, SLA-governed 
routing, and a live operations dashboard.

Built as an independent portfolio project demonstrating operational system 
design, AI-assisted automation, and live data visualisation relevant to 
global payroll operations at scale.

---

## Live Demo

| Asset | Link |
|-------|------|
| 🎯 Interactive Dashboard | [Open Dashboard](https://claude.ai/public/artifacts/97496e38-412e-4d77-bf99-1d80da0c133e) |
| 📊 Live Command Center | [Open Looker Studio](https://datastudio.google.com/reporting/d6774274-3f24-4161-9839-1fa755a2fed4/page/LdXyF) |
| 🌐 Project Summary Page | [Open Portfolio](https://payroll-exception-management.netlify.app/) |

---

## Problem Statement

Global payroll issues are resolved through manual email chains with no SLA 
ownership, inconsistent escalation paths, and zero visibility for affected 
employees or managers. This creates compliance risk and erodes trust.

**Key pain points identified:**
- No SLA ownership — issues sit unresolved with no timer or accountability
- Duplicate ticket submissions consuming analyst capacity
- Delayed escalation dependent on personal relationships
- No visibility dashboard for operations managers
- Manual tracking in spreadsheets — reporting always out of date

---

## What This System Does

### 1. AI Intake Tool
Reads free-text payroll issue descriptions and automatically classifies 
severity, category, SLA target, and assigned owner — replacing manual 
triage entirely.

### 2. Exception Routing Logic
Priority Matrix with four severity tiers, SLA targets, and automatic 
escalation rules governing every ticket from submission to resolution.

### 3. Live Operations Dashboard
Connected to Google Sheets, updates in real time when tickets are added 
or resolved. Built in both React (interactive artifact) and Looker Studio 
(live data connection).

### 4. System Design Flowchart
Full routing logic diagram showing AI-handled steps, system-automated 
steps, and human-owned checkpoints — built in Whimsical.

---

## Priority Matrix

| Severity | Example Issue | SLA Target | Assigned To | Escalation |
|----------|--------------|------------|-------------|------------|
| 🔴 Critical | Salary not received | 4 hours | Sr. Payroll Analyst | Immediate — Ops Lead alerted |
| 🟠 High | Wrong tax deduction | 1 business day | Payroll Analyst | If unassigned after 2 hours |
| 🟡 Medium | Reimbursement delay | 2 business days | Payroll Analyst | Flag at 80% SLA window |
| 🟢 Low | Payslip clarification | 3 business days | Support Staff | Weekly review only |

---

## Key Results

| Metric | Result |
|--------|--------|
| Tickets tracked | 51 across 5 categories and 12 regions |
| SLA breaches identified | 3 flagged and escalated |
| Total financial impact tracked | $90,652 |
| Resolution time reduction | Target 68% improvement |
| SLA compliance target | 92% |
| Manual triage | Eliminated via AI classification |

---

## Tools Used

| Tool | Purpose |
|------|---------|
| React + Recharts | Interactive dashboard with filters and charts |
| Google Sheets | Live data source |
| Looker Studio | Live connected operations dashboard |
| Whimsical | System design flowchart |
| Claude AI | Ticket classification and portfolio generation |
| GitHub | Version control and project repository |
| Netlify | Static site hosting and public URL |

---

## Project Structure

```
payroll-exception-management/
│
├── index.html
├── dashboard.jsx
├── payroll_exceptions_data.xlsx
├── payroll_exceptions_raw.csv
├── AI_Classified_Ticket_TK1092.pdf
├── Payroll_Exception_Management_FlowChart.png
└── Payroll_Exception_Management_Looker.pdf

---

## How It Works End to End

1. Employee submits issue in free text
2. AI reads description — extracts type, urgency, and region
3. Severity assigned — Critical / High / Medium / Low
4. SLA clock starts — owner assigned automatically
5. Human checkpoints — compliance, payroll approval, exceptions
6. Issue resolved — CSAT captured — data logged to Google Sheets
7. Looker Studio dashboard updates in real time

---

## Stakeholders

| Role | Responsibility |
|------|---------------|
| Employee | Submits issue, receives updates, rates resolution |
| Payroll Team | Primary resolver, owns SLA compliance |
| HR | Approves contract-related corrections |
| Compliance | Reviews tax and regulatory exceptions |
| Customer Success | External liaison for B2B accounts |
| Finance | Approves off-cycle runs and adjustments |
| Ops Manager | Monitors SLA performance via dashboard |

---

## Next Phase — Expense Management System

Currently building an integrated expense management tool that connects 
directly to this payroll exception system. Employees record expenses, 
the system validates and categorises them, and any unresolved 
reimbursements automatically generate exception tickets in this workflow.

---

*Built as an independent portfolio project. Designed with global payroll 
operations complexity in mind — relevant to roles in Operations, 
Implementation, Customer Success, and Product Operations at companies 
like Deel, Remote, OyesterHR and Rippling.*
