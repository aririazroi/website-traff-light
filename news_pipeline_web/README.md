# News Pipeline (Website Version)

Batch pipeline that fetches news from GNews, scores for title-content misalignment, **samples 3 articles from each color bin**, and outputs `articles.js` for the website.

## What This Does

1. Fetches N articles from GNews API
2. Scores each article using your NLP misalignment scorer
3. Maps scores to traffic light colors (green/yellow/red)
4. **Randomly samples 3 articles from each bin** (9 total by default)
5. Outputs `articles.js` that the website can directly use

## Quick Start

```bash
cd news_pipeline_web
source venv/bin/activate  # or create one: python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Run with defaults (3 per bin, outputs ../articles.js)
GNEWS_API_KEY=your_key python3 -m app.main

# Or customize
GNEWS_API_KEY=your_key \
QUERY="technology" \
MAX_RESULTS=50 \
python3 -m app.main --per-bin 3 --out ../articles.js
```

## CLI Options

| Option | Default | Description |
|--------|---------|-------------|
| `--out` | `../articles.js` | Output file path |
| `--per-bin` | `3` | Articles to sample from each color bin |
| `--format` | `js` | Output format: `js` or `json` |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GNEWS_API_KEY` | Yes | - | Your GNews API key |
| `QUERY` | No | `news` | Search query |
| `LANG` | No | `en` | Language code |
| `COUNTRY` | No | *(any)* | Country code (leave empty for any) |
| `MAX_RESULTS` | No | `30` | Articles to fetch (fetch more than needed for good bin distribution) |
| `GREEN_MAX` | No | `33` | Max score for green |
| `YELLOW_MAX` | No | `66` | Max score for yellow |
| `SCORER_MODULE` | No | `scorer` | Python module with `score(title, content)` function |

## Output Format

The pipeline outputs `articles.js` in the exact format the website expects:

```javascript
const articles = [
    {
        id: 1,
        title: "Article Title",
        summary: "Brief description...",
        category: "Source Name • Country",
        image: "https://...",
        trafficLightStatus: "green",
        misleadingScore: 23,
        content: "<p>HTML formatted content...</p>",
        url: "https://original-article-url...",
        publishedAt: "2026-01-29T10:00:00Z"
    },
    // ... 8 more articles (3 green, 3 yellow, 3 red)
];
```

## Sampling Strategy

- Currently: **Equal proportions** (3 from each bin = 9 total)
- If a bin has fewer than 3 articles, takes all available
- Random selection ensures variety across runs

To change proportions, modify `--per-bin` or adjust `sampling.py`.

## Project Structure

```
news_pipeline_web/
├── app/
│   ├── config.py      # Environment config
│   ├── gnews_client.py # Fetches & formats articles
│   ├── main.py        # CLI entrypoint
│   ├── mapping.py     # Score → traffic light
│   ├── models.py      # Article data model
│   ├── sampling.py    # Stratified sampling by color
│   └── scoring.py     # Scorer adapter
├── scorer.py          # YOUR scorer (replace this!)
├── requirements.txt
└── README.md
```

## Integrating with Website

After running the pipeline, the website automatically picks up the new `articles.js`:

```bash
# Generate new articles
cd news_pipeline_web
GNEWS_API_KEY=your_key python3 -m app.main --out ../articles.js

# Serve website
cd ..
npm run dev
```
