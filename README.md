# SMSL Division 3 — Winter 2026 Stats

Interactive stats site for Division 3 of Sissy McGinty's Singles League (SMSL), Winter 2026 season.

## Features

- **Standings** — full table with PPR, leg win %, form dots, and streak badges
- **Players** — per-player profile with match history and PPR trend chart
- **Head-to-Head** — 16×16 interactive matrix with hover details
- **Match Log** — all 125+ matches with search and sort
- **Leaderboards** — best season PPR, single-match PPR, leg win %, win streak, consistency, most active
- **Insights** — title race, hottest matches, biggest upsets, dominance pairs, PPR overperformers, closest matches

## Data

Stats scraped from [DartConnect TV](https://tv.dartconnect.com/league/smsl/20236/standings). Closest-match leg counts fetched from [DartConnect Recap](https://recap.dartconnect.com).

## Stack

Static HTML/CSS/JS — no framework, no build step. Data embedded as a JS global in `data/data.js`.
