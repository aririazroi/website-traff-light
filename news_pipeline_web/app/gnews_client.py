"""
GNews API client - adapted for website format.
"""
import requests
from typing import List

from .config import Config
from .models import Article, Source


class GNewsClient:
    """Client for fetching articles from GNews API."""
    
    def __init__(self, config: Config):
        self.config = config
        self._id_counter = 0
    
    def fetch_articles(self) -> List[Article]:
        """
        Fetch recent articles from GNews API and normalize to Article objects.
        
        Returns:
            List of Article objects with normalized fields.
        """
        params = {
            "q": self.config.query,
            "lang": self.config.lang,
            "max": self.config.max_results,
            "apikey": self.config.gnews_api_key,
        }
        
        # Only add country if specified (None = any country)
        if self.config.country:
            params["country"] = self.config.country
        
        response = requests.get(self.config.gnews_endpoint, params=params)
        response.raise_for_status()
        
        data = response.json()
        raw_articles = data.get("articles", [])
        
        return [self._normalize_article(raw) for raw in raw_articles]
    
    def _normalize_article(self, raw: dict) -> Article:
        """
        Convert raw GNews article to website-compatible Article object.
        """
        self._id_counter += 1
        
        source_data = raw.get("source", {})
        source = Source(
            id=source_data.get("id", ""),
            name=source_data.get("name", "Unknown"),
            url=source_data.get("url", ""),
            country=source_data.get("country", "").upper(),
        )
        
        # Build category from source info (matches website style)
        category = f"{source.name} • {source.country}" if source.country else source.name
        
        # Wrap content in HTML paragraphs for website display
        raw_content = raw.get("content", "")
        html_content = self._format_content_html(raw_content)
        
        return Article(
            id=self._id_counter,
            title=raw.get("title", ""),
            summary=raw.get("description", ""),
            category=category,
            image=raw.get("image"),
            trafficLightStatus="",  # Set later by scoring
            misleadingScore=0,  # Set later by scoring
            content=html_content,
            url=raw.get("url", ""),
            publishedAt=raw.get("publishedAt", ""),
            source=source,
        )
    
    def _format_content_html(self, raw_content: str) -> str:
        """
        Format raw content as HTML paragraphs for website display.
        """
        if not raw_content:
            return "<p>Content not available.</p>"
        
        # Split by double newlines or periods followed by space+capital
        # For now, simple approach: wrap entire content in paragraph tags
        paragraphs = raw_content.split("\n\n")
        if len(paragraphs) == 1:
            # Single block - split into ~3 paragraphs for readability
            words = raw_content.split()
            chunk_size = max(1, len(words) // 3)
            paragraphs = []
            for i in range(0, len(words), chunk_size):
                paragraphs.append(" ".join(words[i:i + chunk_size]))
        
        html_parts = [f"<p>{p.strip()}</p>" for p in paragraphs if p.strip()]
        return "\n".join(html_parts) if html_parts else "<p>Content not available.</p>"
