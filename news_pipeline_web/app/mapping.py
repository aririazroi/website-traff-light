"""
Score to traffic light color mapping with configurable thresholds.
"""
from .config import Config


def score_to_traffic_light(score: int, config: Config) -> str:
    """
    Map a misleading score to a traffic light color.
    
    Thresholds are configurable via environment variables:
    - GREEN_MAX: Maximum score for green (default 33)
    - YELLOW_MAX: Maximum score for yellow (default 66)
    
    Mapping:
    - 0 to GREEN_MAX (inclusive) => "green"
    - GREEN_MAX+1 to YELLOW_MAX (inclusive) => "yellow"  
    - YELLOW_MAX+1 to 100 => "red"
    
    Args:
        score: Misleading score (0-100).
        config: Pipeline configuration with thresholds.
        
    Returns:
        Traffic light color: "green", "yellow", or "red".
    """
    if score <= config.green_max:
        return "green"
    elif score <= config.yellow_max:
        return "yellow"
    else:
        return "red"
