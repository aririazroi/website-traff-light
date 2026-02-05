// --- Tracking module --------------------------------------------------------

// Configuration
const CONFIG = {
    googleSheetsWebhookUrl: 'https://script.google.com/macros/s/AKfycbwTVk2bdIYgSFL3HM_J8-WLRVqXV0GZdcjgfMG89lBUYWYRzL9zuFIGPAoNv-EFviTUXg/exec', // Set this to your Google Apps Script webhook URL
    maxRetries: 3,
    retryDelay: 1000, // Start with 1 second
};

const Tracking = (function () {
    const state = {
        participantId: null,
        // Track when modal article view started
        modalArticleStartTime: null,
        currentModalArticleId: null,
        // Track traffic light hover start time
        trafficLightHoverStartTime: null,
        currentHoverArticleId: null,
    };

    function nowMs() {
        return Date.now();
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function parseParticipantId() {
        try {
            const params = new URLSearchParams(window.location.search);
            return params.get('pid') || null;
        } catch (e) {
            return null;
        }
    }

    function getArticleMetadata(articleId) {
        if (!articleId) return null;
        const article = articles.find(a => String(a.id) === String(articleId));
        if (!article) return null;
        return {
            trafficLightStatus: article.trafficLightStatus,
            misleadingScore: article.misleadingScore,
        };
    }

    function sendToGoogleSheets(eventData, retryCount = 0) {
        if (!CONFIG.googleSheetsWebhookUrl) return;

        // Ensure eventType is always present
        if (!eventData.eventType) {
            console.error('Event missing eventType:', eventData);
            return;
        }

        const payload = {
            events: [eventData],
            participantId: state.participantId,
        };

        // Debug: log what we're sending
        console.log('Sending to Google Sheets:', JSON.stringify(payload, null, 2));

        fetch(CONFIG.googleSheetsWebhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        }).catch(error => {
            console.warn('Google Sheets tracking error:', error);
            
            if (retryCount < CONFIG.maxRetries) {
                const delay = CONFIG.retryDelay * Math.pow(2, retryCount);
                setTimeout(() => {
                    sendToGoogleSheets(eventData, retryCount + 1);
                }, delay);
            } else {
                console.error('Failed to send event to Google Sheets after max retries:', eventData);
            }
        });
    }

    // Track article clicks
    function setupClickTracking() {
        document.addEventListener('click', function (e) {
            const target = e.target;
            if (!target || typeof target.closest !== 'function') return;

            // Only track clicks on article cards (not traffic lights, buttons, etc.)
            const articleEl = target.closest('[data-article-id]');
            if (!articleEl) return;

            // Don't track if clicking on traffic light or close button
            if (target.closest('.traffic-light, .traffic-light-card, .close-button')) {
                return;
            }

            const articleId = articleEl.getAttribute('data-article-id');
            if (!articleId) return;

            const metadata = getArticleMetadata(articleId);
            
            const clickEvent = {
                eventType: 'article_click',
                timestamp: nowIso(),
                participantId: state.participantId,
                articleId: articleId,
                trafficLightStatus: metadata?.trafficLightStatus || '',
                misleadingScore: metadata?.misleadingScore || '',
            };

            sendToGoogleSheets(clickEvent);
        }, true);
    }

    // Track article view time (only in modal)
    function startModalArticle(articleId) {
        // End previous article view if any
        if (state.currentModalArticleId && state.modalArticleStartTime) {
            endModalArticle();
        }

        state.currentModalArticleId = articleId;
        state.modalArticleStartTime = nowMs();
    }

    function endModalArticle() {
        if (!state.currentModalArticleId || !state.modalArticleStartTime) return;

        const viewDuration = nowMs() - state.modalArticleStartTime;
        const metadata = getArticleMetadata(state.currentModalArticleId);

        const viewEvent = {
            eventType: 'article_view',
            timestamp: nowIso(),
            participantId: state.participantId,
            articleId: state.currentModalArticleId,
            durationMs: viewDuration,
            durationSeconds: Math.round(viewDuration / 1000),
            trafficLightStatus: metadata?.trafficLightStatus || '',
            misleadingScore: metadata?.misleadingScore || '',
        };

        sendToGoogleSheets(viewEvent);

        // Reset state
        state.currentModalArticleId = null;
        state.modalArticleStartTime = null;
    }

    // Track traffic light hover time
    function setupHoverTracking() {
        document.addEventListener('mouseenter', function(e) {
            const target = e.target;
            if (!target || typeof target.closest !== 'function') return;

            // Check if hovering on traffic light
            const trafficLightEl = target.closest('.traffic-light, .traffic-light-card, .traffic-light-large');
            if (!trafficLightEl) return;

            // Find the associated article
            const articleEl = trafficLightEl.closest('[data-article-id]');
            if (!articleEl) return;

            const articleId = articleEl.getAttribute('data-article-id');
            if (!articleId || state.trafficLightHoverStartTime) return; // Already hovering

            state.currentHoverArticleId = articleId;
            state.trafficLightHoverStartTime = nowMs();
        }, true);

        document.addEventListener('mouseleave', function(e) {
            const target = e.target;
            if (!target || typeof target.closest !== 'function') return;

            // Check if leaving traffic light
            const trafficLightEl = target.closest('.traffic-light, .traffic-light-card, .traffic-light-large');
            if (!trafficLightEl || !state.trafficLightHoverStartTime) return;

            const hoverDuration = nowMs() - state.trafficLightHoverStartTime;
            const metadata = getArticleMetadata(state.currentHoverArticleId);

            const hoverEvent = {
                eventType: 'traffic_light_hover',
                timestamp: nowIso(),
                participantId: state.participantId,
                articleId: state.currentHoverArticleId,
                durationMs: hoverDuration,
                durationSeconds: Math.round(hoverDuration / 1000),
                trafficLightStatus: metadata?.trafficLightStatus || '',
                misleadingScore: metadata?.misleadingScore || '',
            };

            sendToGoogleSheets(hoverEvent);

            // Reset state
            state.currentHoverArticleId = null;
            state.trafficLightHoverStartTime = null;
        }, true);
    }

    function setupUnloadHandler() {
        // Send any pending data when user leaves the page
        window.addEventListener('beforeunload', function () {
            // End modal article view if still open
            if (state.currentModalArticleId && state.modalArticleStartTime) {
                endModalArticle();
            }
            // End traffic light hover if still active
            if (state.currentHoverArticleId && state.trafficLightHoverStartTime) {
                const hoverDuration = nowMs() - state.trafficLightHoverStartTime;
                const metadata = getArticleMetadata(state.currentHoverArticleId);
                const hoverEvent = {
                    eventType: 'traffic_light_hover',
                    timestamp: nowIso(),
                    participantId: state.participantId,
                    articleId: state.currentHoverArticleId,
                    durationMs: hoverDuration,
                    durationSeconds: Math.round(hoverDuration / 1000),
                    trafficLightStatus: metadata?.trafficLightStatus || '',
                    misleadingScore: metadata?.misleadingScore || '',
                };
                sendToGoogleSheets(hoverEvent);
            }
        });
    }

    function init() {
        state.participantId = parseParticipantId();
        setupClickTracking();
        setupHoverTracking();
        setupUnloadHandler();
    }

    return {
        init,
        startModalArticle,
        endModalArticle,
    };
})();

// Main application logic

document.addEventListener('DOMContentLoaded', function() {
    renderArticles();
    setupModal();
    Tracking.init();
});

// Render all articles on the homepage
function renderArticles() {
    const container = document.getElementById('main-container');
    if (!container) return;

    // Left Column - Daily Briefing and Top News
    const leftColumn = createColumn('left-column');
    
    // Daily Briefing (first article)
    const briefingArticle = articles[0];
    leftColumn.appendChild(createDailyBriefing(briefingArticle));
    
    // Top News Stories
    const topNews = createTopNewsSection();
    leftColumn.appendChild(topNews);
    
    // Middle Column - Main articles
    const middleColumn = createColumn('middle-column');
    
    // Main featured article
    middleColumn.appendChild(createMainArticle(briefingArticle));
    
    // Other articles
    for (let i = 1; i < Math.min(4, articles.length); i++) {
        middleColumn.appendChild(createArticleCard(articles[i]));
    }
    
    // Right Column - Blindspot section
    const rightColumn = createColumn('right-column');
    rightColumn.appendChild(createBlindspotSection());
    
    container.appendChild(leftColumn);
    container.appendChild(middleColumn);
    container.appendChild(rightColumn);
}

// Create a column element
function createColumn(className) {
    const column = document.createElement('div');
    column.className = `column ${className}`;
    return column;
}

// Create Daily Briefing section
function createDailyBriefing(article) {
    const briefing = document.createElement('div');
    briefing.className = 'daily-briefing';
    briefing.setAttribute('data-article-id', article.id);
    
    briefing.innerHTML = `
        ${createArticleImageContainer(article)}
        <div class="article-meta">6 stories • 675 articles • 6m read</div>
        <h2 class="article-headline">${article.title}</h2>
        <p class="article-summary">${article.summary}</p>
        <div class="related-links">
            ${articles.slice(1, 4).map(a => `<div class="related-item">+ ${a.title}</div>`).join('')}
            <div class="related-item">+ and more.</div>
        </div>
    `;
    
    briefing.addEventListener('click', () => openArticle(article.id));
    return briefing;
}

// Create Top News section
function createTopNewsSection() {
    const topNews = document.createElement('div');
    topNews.className = 'top-news';
    
    const title = document.createElement('h3');
    title.className = 'section-title';
    title.textContent = 'Top News Stories';
    topNews.appendChild(title);
    
    // Add top news items
    articles.slice(4, 7).forEach(article => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        newsItem.setAttribute('data-article-id', article.id);
        
        const headline = document.createElement('h4');
        headline.className = 'news-headline';
        headline.textContent = article.title;
        newsItem.appendChild(headline);
        
        newsItem.addEventListener('click', () => openArticle(article.id));
        topNews.appendChild(newsItem);
    });
    
    return topNews;
}

// Create main article card
function createMainArticle(article) {
    const mainArticle = document.createElement('div');
    mainArticle.className = 'main-article';
    mainArticle.setAttribute('data-article-id', article.id);
    
    mainArticle.innerHTML = `
        ${createArticleImageContainer(article)}
        <h1 class="main-headline">${article.title}</h1>
    `;
    
    mainArticle.addEventListener('click', () => openArticle(article.id));
    return mainArticle;
}

// Create article card
function createArticleCard(article) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.setAttribute('data-article-id', article.id);
    
    card.innerHTML = `
        <div class="article-category">${article.category}</div>
        ${createArticleImageContainer(article)}
        <h3 class="article-headline">${article.title}</h3>
    `;
    
    card.addEventListener('click', () => openArticle(article.id));
    return card;
}

// Create article image container with traffic light
function createArticleImageContainer(article) {
    return `
        <div class="article-image-container">
            <div class="article-image-wrapper">
                <img src="${article.image}" alt="${article.title}" class="article-image">
            </div>
            ${createTrafficLight(article.trafficLightStatus, article.misleadingScore)}
        </div>
    `;
}

// Create traffic light component
function createTrafficLight(status, misleadingScore) {
    return `
        <div class="traffic-light" data-status="${status}" data-score="${misleadingScore}">
            <div class="traffic-light-light red"></div>
            <div class="traffic-light-light yellow"></div>
            <div class="traffic-light-light green"></div>
            <div class="traffic-light-tooltip">Misleading score: ${misleadingScore}/100</div>
        </div>
    `;
}

// Create large traffic light card for article view
function createLargeTrafficLightCard(status, misleadingScore) {
    let levelText = '';
    let levelClass = '';
    
    if (status === 'green') {
        levelText = 'LOW';
        levelClass = 'level-low';
    } else if (status === 'yellow') {
        levelText = 'MEDIUM';
        levelClass = 'level-medium';
    } else {
        levelText = 'HIGH';
        levelClass = 'level-high';
    }
    
    return `
        <div class="traffic-light-card">
            <div class="traffic-light-card-title">Misleading Level</div>
            <div class="traffic-light-large" data-status="${status}">
                <div class="traffic-light-light-large red"></div>
                <div class="traffic-light-light-large yellow"></div>
                <div class="traffic-light-light-large green"></div>
            </div>
            <div class="traffic-light-level ${levelClass}">${levelText}</div>
        </div>
    `;
}

// Create Blindspot section
function createBlindspotSection() {
    const blindspot = document.createElement('div');
    blindspot.className = 'blindspot-section';
    
    blindspot.innerHTML = `
        <div class="blindspot-header">
            <div class="blindspot-logo">BLINDSPOT</div>
            <p class="blindspot-description">Stories disproportionately covered by one side of the political spectrum. Learn more about political bias in news coverage.</p>
        </div>
    `;
    
    // Add blindspot articles (articles with higher misleading scores)
    const blindspotArticles = articles.filter(a => a.misleadingScore > 45).slice(0, 3);
    blindspotArticles.forEach(article => {
        const blindspotArticle = document.createElement('div');
        blindspotArticle.className = 'blindspot-article';
        blindspotArticle.setAttribute('data-article-id', article.id);
        
        blindspotArticle.innerHTML = `
            ${createArticleImageContainer(article)}
            <div class="blindspot-meta">Blindspot ${Math.floor(Math.random() * 10) + 8} Sources</div>
            <h3 class="article-headline">${article.title}</h3>
        `;
        
        blindspotArticle.addEventListener('click', () => openArticle(article.id));
        blindspot.appendChild(blindspotArticle);
    });
    
    return blindspot;
}

// Open article in modal
function openArticle(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;
    
    const modal = document.getElementById('article-modal');
    const detail = document.getElementById('article-detail');
    const fixedTrafficLight = document.getElementById('fixed-traffic-light');
    
    if (!modal || !detail || !fixedTrafficLight) return;
    
    // Create traffic light HTML
    const trafficLightHTML = createLargeTrafficLightCard(article.trafficLightStatus, article.misleadingScore);
    
    // Remove traffic light from article image in detail view
    detail.innerHTML = `
        <div class="article-image-container">
            <div class="article-image-wrapper">
                <img src="${article.image}" alt="${article.title}" class="article-image">
            </div>
            <div class="mobile-traffic-light-container">
                ${trafficLightHTML}
            </div>
        </div>
        <div class="article-category">${article.category}</div>
        <h1>${article.title}</h1>
        <div class="article-content">
            ${article.content}
        </div>
    `;
    
    // Add fixed traffic light card on the side (for desktop)
    fixedTrafficLight.innerHTML = trafficLightHTML;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Track focused reading of this article in the modal
    Tracking.startModalArticle(String(article.id));
}

// Setup modal close functionality
function setupModal() {
    const modal = document.getElementById('article-modal');
    const closeButton = document.getElementById('close-modal');
    
    if (closeButton) {
        closeButton.addEventListener('click', closeArticle);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeArticle();
            }
        });
    }
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeArticle();
        }
    });
}

// Close article modal
function closeArticle() {
    const modal = document.getElementById('article-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // End modal-focused reading time tracking
    Tracking.endModalArticle();
}

