# Payroll Exception Management System

An end-to-end operational system designed to replace manual email-based 
payroll issue resolution with AI-assisted ticket classification, SLA-governed 
routing, and a live operations dashboard.

Built as an independent portfolio project demonstrating operational system 
design, AI-assisted automation, and live data visualisation relevant to 
global payroll operations at scale.

## Live Demo

- Interactive Dashboard: [Claude Artifact](YOUR CLAUDE ARTIFACT LINK)
- Live Command Center: [Looker Studio Dashboard](YOUR LOOKER STUDIO LINK)
- Project Summary: [Portfolio Page](YOUR NETLIFY LINK)

## What This System Does

1. AI Intake Tool — reads free-text payroll issue descriptions and 
   automatically classifies severity, category, SLA, and owner
2. Exception Routing Logic — Priority Matrix with four severity tiers, 
   SLA targets, and automatic escalation rules
3. Live Dashboard — connected to Google Sheets, updates in real time 
   when tickets are added or resolved
4. Whimsical Flowchart — full system design showing AI-handled, 
   system-automated, and human-owned steps

## Tools Used

- React + Recharts — interactive dashboard
- Google Sheets + Looker Studio — live data layer and dashboard
- Whimsical — system design flowchart
- Claude AI — ticket classification and portfolio page
- GitHub + Netlify — version control and hosting

## Project Structure

- dashboard.jsx — React interactive dashboard with filters and charts
- payroll_exceptions_data.xlsx — 51-row dataset with colour coding
- payroll_exceptions_raw.csv — raw data for import
- payroll_exception_portfolio.html — one-page project summary
- AI_Classified_Ticket_TK1092.pdf — sample AI classified ticket output

## Key Results

- 51 tickets tracked across 5 categories and 12 regions
- 3 SLA breaches identified and flagged
- $90,652 total financial impact tracked
- AI classification replaces manual triage entirely
- Live dashboard updates automatically from Google Sheets
