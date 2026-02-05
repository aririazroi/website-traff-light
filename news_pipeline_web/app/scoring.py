"""
Adapter for calling the NLP misalignment scorer.
"""
import importlib
from typing import Callable

from .config import Config


def load_scorer(config: Config) -> Callable[[str, str], int]:
    """
    Dynamically load the scorer function from the configured module.
    
    The scorer module must expose a function with signature:
        score(title: str, content: str) -> int
    
    where the return value is an integer in [0, 100].
    
    Args:
        config: Pipeline configuration containing scorer_module path.
        
    Returns:
        The score function.
        
    Raises:
        ImportError: If the module cannot be imported.
        AttributeError: If the module doesn't have a 'score' function.
    """
    module = importlib.import_module(config.scorer_module)
    
    if not hasattr(module, "score"):
        raise AttributeError(
            f"Module '{config.scorer_module}' must expose a 'score(title, content)' function"
        )
    
    return module.score


def validate_score(score: int) -> int:
    """
    Validate and clamp score to [0, 100] range.
    
    Args:
        score: Raw score from scorer.
        
    Returns:
        Score clamped to valid range.
    """
    if not isinstance(score, (int, float)):
        raise ValueError(f"Score must be numeric, got {type(score)}")
    
    score = int(score)
    return max(0, min(100, score))
