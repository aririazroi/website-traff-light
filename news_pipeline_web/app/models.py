"""
Data models for articles - adapted for website format.
"""
from dataclasses import dataclass, asdict, field
from typing import Optional, List


@dataclass
class Source:
    """News source information."""
    id: str
    name: str
    url: str
    country: str


@dataclass
class Article:
    """
    Article structure matching the website's expected format.
    """
    id: int  # Sequential ID for website
    title: str
    summary: str  # from GNews 'description'
    category: str  # derived from source name + country
    image: Optional[str]
    trafficLightStatus: str  # green/yellow/red
    misleadingScore: int  # 0-100
    content: str  # HTML-wrapped content for website
    
    # Original data (kept for reference)
    url: str = ""
    publishedAt: str = ""
    source: Optional[Source] = None
    
    # Optional related articles (populated later if needed)
    related: List[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON/JS serialization."""
        return {
            "id": self.id,
            "title": self.title,
            "summary": self.summary,
            "category": self.category,
            "image": self.image,
            "trafficLightStatus": self.trafficLightStatus,
            "misleadingScore": self.misleadingScore,
            "content": self.content,
            "url": self.url,
            "publishedAt": self.publishedAt,
        }
