// Global variables to store PR data
let allPRs = [];
let filteredPRs = [];
let socket;

/**
 * Load pull requests from the API
 *
 * Initialize WebSocket connection for real-time updates
**/
function initWebSocket() {
    socket = io();
    
    socket.on('connected', (data) => {
        console.log('Connected to WebSocket:', data.message);
    });
    
    socket.on('pr_update', (data) => {
        console.log('PR update received');
        loadPRs(); // Refresh the data
    });
}
async function loadPRs() {
    try {
        showLoading();
        const response = await fetch('/api/prs');
        const result = await response.json();
        
        if (result.data) {
            allPRs = result.data;
            updateStats();
            updateFilters();
            applyFilters();
        } else {
            showError('No data received from server');
        }
    } catch (error) {
        console.error('Error loading PRs:', error);
        showError('Failed to load pull requests');
    }
}

/**
 * Update statistics in the sidebar
 */
function updateStats() {
    const total = allPRs.length;
    const open = allPRs.filter(pr => pr.pr_state === 'open').length;
    const closed = allPRs.filter(pr => pr.pr_state === 'closed').length;
    const merged = allPRs.filter(pr => pr.pr_state === 'merged').length;

    document.getElementById('total-prs').textContent = total;
    document.getElementById('open-prs').textContent = open;
    document.getElementById('closed-prs').textContent = closed;
    document.getElementById('merged-prs').textContent = merged;
}

/**
 * Update filter dropdowns with unique values from data
 */
function updateFilters() {
    const repoFilter = document.getElementById('repo-filter');
    const authorFilter = document.getElementById('author-filter');
    
    // Get unique repositories
    const repos = [...new Set(allPRs.map(pr => pr.repositories?.name || 'Unknown'))];
    repoFilter.innerHTML = '<option value="">All repositories</option>' + 
        repos.map(repo => `<option value="${repo}">${repo}</option>`).join('');
    
    // Get unique authors
    const authors = [...new Set(allPRs.map(pr => pr.pr_author).filter(Boolean))];
    authorFilter.innerHTML = '<option value="">All authors</option>' + 
        authors.map(author => `<option value="${author}">${author}</option>`).join('');
}

/**
 * Apply all active filters to the PR data
 */
function applyFilters() {
    const repoFilter = document.getElementById('repo-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const authorFilter = document.getElementById('author-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    filteredPRs = allPRs.filter(pr => {
        const matchesRepo = !repoFilter || (pr.repositories?.name === repoFilter);
        const matchesStatus = !statusFilter || (pr.pr_state === statusFilter);
        const matchesAuthor = !authorFilter || (pr.pr_author === authorFilter);
        const matchesSearch = !searchTerm || 
            pr.pr_title?.toLowerCase().includes(searchTerm) ||
            pr.pr_author?.toLowerCase().includes(searchTerm) ||
            pr.repositories?.name?.toLowerCase().includes(searchTerm);

        return matchesRepo && matchesStatus && matchesAuthor && matchesSearch;
    });

    renderPRs();
}

/**
 * Render filtered PRs to the main content area
 */
function renderPRs() {
    const container = document.getElementById('pr-container');
    
    if (filteredPRs.length === 0) {
        showEmptyState();
        return;
    }

    const prHTML = filteredPRs.map(pr => createPRCard(pr)).join('');
    container.innerHTML = `<div class="pr-grid">${prHTML}</div>`;
}

/**
 * Create HTML for a single PR card
 * @param {Object} pr - Pull request data
 * @returns {string} HTML string for the PR card
 */
function createPRCard(pr) {
    const createdDate = formatDate(pr.created_at);
    const updatedDate = formatDate(pr.updated_at);
    const statusClass = `status-${pr.pr_state}`;
    
    return `
        <div class="pr-card">
            <div class="pr-header">
                <h3 class="pr-title">
                    <a href="${pr.pr_url || '#'}" target="_blank">${escapeHtml(pr.pr_title) || 'Untitled PR'}</a>
                </h3>
                <div class="pr-status ${statusClass}">${pr.pr_state || 'unknown'}</div>
            </div>
            
            <div class="pr-meta">
                <div class="meta-item">
                    ${createIcon('repository')}
                    <div>
                        <div class="meta-label">Repository</div>
                        <div class="meta-value">
                            <span class="repo-badge">
                                ${escapeHtml(pr.repositories?.owner || 'Unknown')}/${escapeHtml(pr.repositories?.name || 'Unknown')}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="meta-item">
                    ${createIcon('user')}
                    <div>
                        <div class="meta-label">Author</div>
                        <div class="meta-value">${escapeHtml(pr.pr_author) || 'Unknown'}</div>
                    </div>
                </div>
                
                <div class="meta-item">
                    ${createIcon('clock')}
                    <div>
                        <div class="meta-label">Created</div>
                        <div class="meta-value">${createdDate}</div>
                    </div>
                </div>
                
                <div class="meta-item">
                    ${createIcon('message')}
                    <div>
                        <div class="meta-label">PR Number</div>
                        <div class="meta-value">#${pr.pr_num || 'N/A'}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Create SVG icons for different types
 * @param {string} type - Icon type
 * @returns {string} SVG HTML string
 */
function createIcon(type) {
    const icons = {
        repository: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77 5.44 5.44 0 0 0 3.5 8.55c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
        </svg>`,
        user: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
        </svg>`,
        clock: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
        </svg>`,
        message: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>`
    };
    
    return icons[type] || '';
}

/**
 * Format date string for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (error) {
        return 'Invalid date';
    }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show loading state
 */
function showLoading() {
    document.getElementById('pr-container').innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            Loading pull requests...
        </div>
    `;
}

/**
 * Show empty state when no PRs match filters
 */
function showEmptyState() {
    document.getElementById('pr-container').innerHTML = `
        <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h9l4-4-4-4H3"/>
            </svg>
            <h3>No pull requests found</h3>
            <p>Try adjusting your filters or check back later.</p>
        </div>
    `;
}

/**
 * Show error state
 * @param {string} message - Error message to display
 */
function showError(message) {
    document.getElementById('pr-container').innerHTML = `
        <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <h3>Error loading data</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    document.getElementById('repo-filter').addEventListener('change', applyFilters);
    document.getElementById('status-filter').addEventListener('change', applyFilters);
    document.getElementById('author-filter').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', applyFilters);
}

/**
 * Initialize the dashboard
 */
function initDashboard() {
    initEventListeners();
    initWebSocket();
    loadPRs();
}

// Initialize dashboard when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}