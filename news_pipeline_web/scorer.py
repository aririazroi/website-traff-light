"""
DeepSeek-based scorer for headline vs content misalignment.
Uses DeepSeek API to evaluate how misleading a headline is relative to article content.
"""
import os
import json
import re
from openai import OpenAI


# Initialize DeepSeek client (OpenAI-compatible API)
client = OpenAI(
    api_key=os.environ.get("DEEPSEEK_API_KEY", ""),
    base_url="https://api.deepseek.com"
)

SCORING_PROMPT = """You are an expert at detecting misleading news headlines.

Analyze the following headline and article body. Score how misleading the headline is on a scale of 0-100:

- 0-33: ALIGNED - Headline accurately represents the article content
- 34-66: SOMEWHAT MISLEADING - Headline exaggerates, omits key context, or uses sensational language
- 67-100: HIGHLY MISLEADING - Headline misrepresents the article, uses clickbait, or contradicts the content

HEADLINE:
{title}

ARTICLE BODY:
{content}

Respond with ONLY a JSON object in this exact format (no other text):
{{"misleadingScore": <number>, "reason": "<brief explanation>"}}
"""


def score(title: str, content: str) -> int:
    """
    Score how misleading the headline is relative to the content.
    
    Args:
        title: Article headline
        content: Article body text
        
    Returns:
        Integer score from 0 (well-aligned) to 100 (highly misleading)
    """
    api_key = os.environ.get("DEEPSEEK_API_KEY", "")
    if not api_key:
        print("[Scorer] WARNING: DEEPSEEK_API_KEY not set, returning default score")
        return 50
    
    # Truncate content if too long (DeepSeek has token limits)
    max_content_chars = 4000
    truncated_content = content[:max_content_chars]
    if len(content) > max_content_chars:
        truncated_content += "... [truncated]"
    
    prompt = SCORING_PROMPT.format(title=title, content=truncated_content)
    
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a news analysis assistant. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Low temperature for consistent scoring
            max_tokens=200
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Parse JSON response
        # Handle potential markdown code blocks
        if "```" in result_text:
            json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group(1)
        
        result = json.loads(result_text)
        score_value = int(result.get("misleadingScore", 50))
        reason = result.get("reason", "")
        
        # Clamp to valid range
        score_value = max(0, min(100, score_value))
        
        if reason:
            print(f"[Scorer] Reason: {reason[:80]}...")
        
        return score_value
        
    except json.JSONDecodeError as e:
        print(f"[Scorer] Failed to parse JSON response: {e}")
        print(f"[Scorer] Raw response: {result_text[:200]}")
        return 50
    except Exception as e:
        print(f"[Scorer] API error: {e}")
        return 50
