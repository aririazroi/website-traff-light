"""
Configuration loading from environment variables - website version.
"""
import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class Config:
    """Pipeline configuration loaded from environment variables."""
    
    # GNews API settings
    gnews_api_key: str
    gnews_endpoint: str
    query: str
    lang: str
    country: Optional[str]  # None = any country
    max_results: int
    
    # Traffic light thresholds (score -> color mapping)
    green_max: int  # 0..green_max => green
    yellow_max: int  # green_max+1..yellow_max => yellow, else red
    
    # Scorer module path
    scorer_module: str
    
    # Output path (default to website's articles.js location)
    output_path: str


def load_config() -> Config:
    """Load configuration from environment variables with sensible defaults."""
    
    gnews_api_key = os.environ.get("GNEWS_API_KEY", "")
    if not gnews_api_key:
        raise ValueError("GNEWS_API_KEY environment variable is required")
    
    # Country is optional - empty string or unset means "any country"
    country_env = os.environ.get("COUNTRY", "").strip()
    country = country_env if country_env else None
    
    return Config(
        gnews_api_key=gnews_api_key,
        gnews_endpoint=os.environ.get(
            "GNEWS_ENDPOINT", 
            "https://gnews.io/api/v4/search"
        ),
        query=os.environ.get("QUERY", "news"),
        lang=os.environ.get("LANG", "en"),
        country=country,
        max_results=int(os.environ.get("MAX_RESULTS", "30")),  # Fetch more to ensure bins are filled
        
        # Thresholds: 0-33 green, 34-66 yellow, 67-100 red
        green_max=int(os.environ.get("GREEN_MAX", "33")),
        yellow_max=int(os.environ.get("YELLOW_MAX", "66")),
        
        scorer_module=os.environ.get("SCORER_MODULE", "scorer"),
        
        # Default to website's articles.js
        output_path=os.environ.get("OUTPUT_PATH", "../articles.js"),
    )
