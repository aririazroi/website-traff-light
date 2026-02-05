"""
Stratified sampling: pick N random articles from each traffic light bin.
"""
import random
from typing import List, Dict

from .models import Article


def sample_by_color(
    articles: List[Article],
    per_bin: int = 3,
    seed: int | None = None
) -> List[Article]:
    """
    Sample articles stratified by traffic light color.
    
    Picks `per_bin` random articles from each color (green, yellow, red).
    If a bin has fewer than `per_bin` articles, takes all available.
    
    Args:
        articles: List of scored articles with trafficLightStatus set.
        per_bin: Number of articles to sample from each color bin (default 3).
        seed: Optional random seed for reproducibility.
        
    Returns:
        List of sampled articles (up to per_bin * 3 articles).
    """
    if seed is not None:
        random.seed(seed)
    
    # Bin articles by color
    bins: Dict[str, List[Article]] = {
        "green": [],
        "yellow": [],
        "red": [],
    }
    
    for article in articles:
        color = article.trafficLightStatus
        if color in bins:
            bins[color].append(article)
    
    # Sample from each bin
    sampled: List[Article] = []
    for color in ["green", "yellow", "red"]:
        bin_articles = bins[color]
        n_to_sample = min(per_bin, len(bin_articles))
        if n_to_sample > 0:
            sampled.extend(random.sample(bin_articles, n_to_sample))
    
    return sampled


def get_bin_stats(articles: List[Article]) -> Dict[str, int]:
    """
    Get count of articles in each color bin.
    
    Args:
        articles: List of scored articles.
        
    Returns:
        Dict with counts: {"green": N, "yellow": N, "red": N}
    """
    stats = {"green": 0, "yellow": 0, "red": 0}
    for article in articles:
        color = article.trafficLightStatus
        if color in stats:
            stats[color] += 1
    return stats
