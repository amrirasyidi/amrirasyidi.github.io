// Simple optimized tags.js - Parallel loading without build step
// Just replace the old tags.js with this file - no build process needed!

// Configuration
const TAGS_CONFIG = {
    POSTS_PER_PAGE: 3,
    SHOW_PAGE_NUMBERS: true,
    SHOW_PREV_NEXT: true,
    MAX_PAGE_BUTTONS: 5
};

// State management
let currentPage = 1;
let totalPages = 1;
let allPosts = [];
let selectedTag = null;
let tagCounts = {};
let postsByTag = {};
let isLoading = false;

// Get current state from URL
function getCurrentStateFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page')) || 1;
    const tag = urlParams.get('tag') || null;
    return { page: Math.max(1, page), tag };
}

// Update URL without page reload
function updateURL(page, tag) {
    const url = new URL(window.location);
    
    if (page === 1) {
        url.searchParams.delete('page');
    } else {
        url.searchParams.set('page', page);
    }
    
    if (tag) {
        url.searchParams.set('tag', tag);
    } else {
        url.searchParams.delete('tag');
    }
    
    window.history.pushState({}, '', url);
}

// Extract metadata from HTML content
function extractMetadata(htmlContent) {
    const commentPattern = /<!--[\s\S]*?title:\s*([^\n\r]+)[\s\S]*?date:\s*([^\n\r]+)[\s\S]*?excerpt:\s*([^\n\r]+)[\s\S]*?tags:\s*([^\n\r]+)[\s\S]*?-->/;
    const match = htmlContent.match(commentPattern);
    
    if (match) {
        return {
            title: match[1].trim(),
            date: match[2].trim(),
            excerpt: match[3].trim(),
            tags: match[4].trim().split(',').map(tag => tag.trim())
        };
    }
    
    const titleElement = document.createElement('div');
    titleElement.innerHTML = htmlContent;
    const h1 = titleElement.querySelector('h1');
    const title = h1 ? h1.textContent.trim() : 'Untitled';
    const dateMatch = htmlContent.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : 'Unknown date';
    
    return {
        title: title,
        date: date,
        excerpt: 'No excerpt available',
        tags: []
    };
}

// Format date for display
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Organize posts by tags
function organizePosts(posts) {
    const counts = {};
    const byTag = {};
    
    posts.forEach(post => {
        post.metadata.tags.forEach(tag => {
            counts[tag] = (counts[tag] || 0) + 1;
            
            if (!byTag[tag]) {
                byTag[tag] = [];
            }
            byTag[tag].push({
                filename: post.filename,
                title: post.metadata.title,
                date: post.metadata.date,
                excerpt: post.metadata.excerpt
            });
        });
    });
    
    // Sort posts within each tag by date (newest first)
    Object.keys(byTag).forEach(tag => {
        byTag[tag].sort((a, b) => new Date(b.date) - new Date(a.date));
    });
    
    return { tagCounts: counts, postsByTag: byTag };
}

// ⚡ PARALLEL LOADING - Much faster than sequential
async function loadPostsInParallel() {
    const startTime = Date.now();
    
    try {
        console.log('🚀 Loading posts in parallel...');
        
        if (typeof BLOG_POSTS === 'undefined') {
            throw new Error('BLOG_POSTS is not defined. Make sure blog-posts.js is loaded.');
        }
        
        console.log(`📚 Loading ${BLOG_POSTS.length} posts simultaneously...`);
        
        // Create all fetch promises at once - this is the key optimization!
        const fetchPromises = BLOG_POSTS.map(async (filename) => {
            try {
                const response = await fetch(`blog/${filename}`);
                if (!response.ok) {
                    console.warn(`⚠️ Failed to fetch ${filename}: ${response.status}`);
                    return null;
                }
                
                const htmlContent = await response.text();
                const metadata = extractMetadata(htmlContent);
                return { filename, metadata };
                
            } catch (error) {
                console.warn(`❌ Error loading ${filename}:`, error);
                return null;
            }
        });
        
        // Wait for ALL requests to complete simultaneously
        const results = await Promise.all(fetchPromises);
        const validPosts = results.filter(post => post !== null);
        
        const duration = Date.now() - startTime;
        console.log(`⚡ Parallel loading completed in ${duration}ms (${validPosts.length}/${BLOG_POSTS.length} successful)`);
        
        if (validPosts.length === 0) {
            throw new Error('No posts could be loaded');
        }
        
        // Sort by date (newest first)
        validPosts.sort((a, b) => new Date(b.metadata.date) - new Date(a.metadata.date));
        
        // Set global state
        allPosts = validPosts;
        
        // Organize posts by tags
        const organized = organizePosts(validPosts);
        tagCounts = organized.tagCounts;
        postsByTag = organized.postsByTag;
        
        console.log(`✅ Success: ${allPosts.length} posts, ${Object.keys(tagCounts).length} tags`);
        return true;
        
    } catch (error) {
        console.error('💥 Parallel loading failed:', error);
        throw error;
    }
}

// Create tag cloud HTML
function createTagCloudHTML(tagCounts, selectedTag) {
    const sortedTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([tag, count]) => {
            const isActive = tag === selectedTag;
            const activeClass = isActive ? 'tag-active' : '';
            return `<button class="tag-filter ${activeClass}" onclick="filterByTag('${tag}')" data-tag="${tag}">${tag} (${count})</button>`;
        });
    
    const clearFilter = selectedTag ? 
        `<button class="tag-filter tag-clear" onclick="clearTagFilter()">✖ Clear filter</button>` : '';
    
    return `
        <div class="tag-controls">
            ${clearFilter}
            <div class="tag-cloud-grid">
                ${sortedTags.join('')}
            </div>
        </div>
    `;
}

// Get posts for current page
function getPostsForPage() {
    if (!selectedTag) return [];
    
    const postsToShow = postsByTag[selectedTag] || [];
    const startIndex = (currentPage - 1) * TAGS_CONFIG.POSTS_PER_PAGE;
    const endIndex = startIndex + TAGS_CONFIG.POSTS_PER_PAGE;
    
    return postsToShow.slice(startIndex, endIndex);
}

// Calculate pagination
function calculatePagination() {
    if (!selectedTag) {
        totalPages = 0;
        currentPage = 1;
        return;
    }
    
    const postsToShow = postsByTag[selectedTag] || [];
    totalPages = Math.ceil(postsToShow.length / TAGS_CONFIG.POSTS_PER_PAGE);
    currentPage = Math.min(currentPage, Math.max(1, totalPages));
}

// Create posts HTML
function createPostsHTML(posts) {
    if (!selectedTag) return '';
    
    if (posts.length === 0) {
        return '<div class="no-posts">No posts found for the selected tag.</div>';
    }
    
    const postsHTML = posts.map(post => 
        `<div class="simple-post-item">
            <div class="post-title">
                <a href="blog/${post.filename}">${post.title}</a>
            </div>
            <div class="post-date">${formatDate(post.date)}</div>
            <div class="post-excerpt">${post.excerpt}</div>
        </div>`
    ).join('');
    
    return `
        <div class="tag-section">
            <h2>${selectedTag}</h2>
            <div class="simple-post-list">
                ${postsHTML}
            </div>
        </div>
    `;
}

// Generate page numbers
function generatePageNumbers() {
    const maxButtons = TAGS_CONFIG.MAX_PAGE_BUTTONS;
    const pages = [];
    
    if (totalPages <= maxButtons) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        const sidePages = Math.floor((maxButtons - 3) / 2);
        
        pages.push(1);
        
        if (currentPage > sidePages + 2) {
            pages.push('...');
        }
        
        const startPage = Math.max(2, currentPage - sidePages);
        const endPage = Math.min(totalPages - 1, currentPage + sidePages);
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        if (currentPage < totalPages - sidePages - 1) {
            pages.push('...');
        }
        
        if (totalPages > 1) {
            pages.push(totalPages);
        }
    }
    
    return pages;
}

// Create pagination HTML
function createPaginationHTML() {
    if (!selectedTag || totalPages <= 1) return '';
    
    let html = '<div class="pagination">';
    
    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    html += `<button class="pagination-btn prev-btn ${prevDisabled}" 
                onclick="goToPage(${currentPage - 1})" 
                ${prevDisabled ? 'disabled' : ''}>← Previous</button>`;
    
    const pageNumbers = generatePageNumbers();
    pageNumbers.forEach(pageNum => {
        if (pageNum === '...') {
            html += '<span class="pagination-ellipsis">...</span>';
        } else {
            const activeClass = pageNum === currentPage ? 'active' : '';
            html += `<button class="pagination-btn page-btn ${activeClass}" 
                        onclick="goToPage(${pageNum})">${pageNum}</button>`;
        }
    });
    
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';
    html += `<button class="pagination-btn next-btn ${nextDisabled}" 
                onclick="goToPage(${currentPage + 1})"
                ${nextDisabled ? 'disabled' : ''}>Next →</button>`;
    
    html += '</div>';
    
    const totalPosts = postsByTag[selectedTag] ? postsByTag[selectedTag].length : 0;
    html += `<div class="pagination-info">
        Page ${currentPage} of ${totalPages} 
        (${totalPosts} posts in "${selectedTag}")
    </div>`;
    
    return html;
}

// Update display
function updateDisplay() {
    calculatePagination();
    
    const tagCloudContainer = document.getElementById('tag-cloud');
    const tagSectionsContainer = document.getElementById('tag-sections');
    
    tagCloudContainer.innerHTML = createTagCloudHTML(tagCounts, selectedTag);
    
    const postsForPage = getPostsForPage();
    tagSectionsContainer.innerHTML = createPostsHTML(postsForPage);
    
    updatePagination();
}

// Update pagination
function updatePagination() {
    let paginationContainer = document.getElementById('tags-pagination-container');
    
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'tags-pagination-container';
        
        const tagSectionsContainer = document.getElementById('tag-sections');
        tagSectionsContainer.parentNode.insertBefore(paginationContainer, tagSectionsContainer.nextSibling);
    }
    
    paginationContainer.innerHTML = createPaginationHTML();
}

// Navigation functions
function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    currentPage = page;
    updateDisplay();
    updateURL(currentPage, selectedTag);
    
    document.getElementById('tag-cloud').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function filterByTag(tag) {
    if (selectedTag === tag) return;
    
    selectedTag = tag;
    currentPage = 1;
    updateDisplay();
    updateURL(currentPage, selectedTag);
    
    document.getElementById('tag-sections').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function clearTagFilter() {
    if (!selectedTag) return;
    
    selectedTag = null;
    currentPage = 1;
    updateDisplay();
    updateURL(currentPage, selectedTag);
}

// Main loading function
async function loadTagsPage() {
    if (isLoading) return;
    
    isLoading = true;
    const loadStartTime = Date.now();
    
    const tagCloudContainer = document.getElementById('tag-cloud');
    const tagSectionsContainer = document.getElementById('tag-sections');
    
    try {
        console.log('🚀 Starting simple parallel tags loading...');
        
        tagCloudContainer.innerHTML = '<div class="loading">Loading tags... (parallel mode)</div>';
        tagSectionsContainer.innerHTML = '';
        
        // Load posts in parallel (much faster than the old sequential method)
        await loadPostsInParallel();
        
        // Get initial state from URL
        const urlState = getCurrentStateFromURL();
        selectedTag = urlState.tag && tagCounts[urlState.tag] ? urlState.tag : null;
        currentPage = urlState.page;
        
        // Update display
        updateDisplay();
        
        const totalTime = Date.now() - loadStartTime;
        console.log(`✨ Tags page loaded in ${totalTime}ms!`);
        
    } catch (error) {
        console.error('💥 Tags page load failed:', error);
        tagCloudContainer.innerHTML = `
            <div class="error">
                <p>Unable to load tags: ${error.message}</p>
                <p><small>Check the console for more details.</small></p>
                <button onclick="loadTagsPage()" class="retry-btn">Retry</button>
            </div>
        `;
        tagSectionsContainer.innerHTML = '';
    } finally {
        isLoading = false;
    }
}

// Handle browser navigation
window.addEventListener('popstate', function(event) {
    const urlState = getCurrentStateFromURL();
    if (urlState.page !== currentPage || urlState.tag !== selectedTag) {
        selectedTag = urlState.tag && tagCounts[urlState.tag] ? urlState.tag : null;
        currentPage = urlState.page;
        updateDisplay();
    }
});

// Expose functions globally
window.goToPage = goToPage;
window.filterByTag = filterByTag;
window.clearTagFilter = clearTagFilter;
window.loadTagsPage = loadTagsPage;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Simple parallel tags system initialized');
    setTimeout(loadTagsPage, 50);
});