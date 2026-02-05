# News Pipeline - Dockerfile for deployment
#
# Build:
#   docker build -t news-pipeline .
#
# Run:
#   docker run --rm \
#     -e GNEWS_API_KEY=your_key_here \
#     -e QUERY="latest news" \
#     -e MAX_RESULTS=20 \
#     -v $(pwd)/output:/app/output \
#     news-pipeline

FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY scorer.py ./scorer.py

# Create output directory
RUN mkdir -p output

# Default environment variables
ENV GNEWS_ENDPOINT=https://gnews.io/api/v4/search
ENV QUERY=news
ENV LANG=en
ENV COUNTRY=us
ENV MAX_RESULTS=10
ENV GREEN_MAX=33
ENV YELLOW_MAX=66
ENV SCORER_MODULE=scorer
ENV OUTPUT_PATH=output/articles.json

# Run the pipeline
CMD ["python", "-m", "app.main"]
