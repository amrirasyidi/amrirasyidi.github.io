// Enhanced tags.js with pagination and filtering - Simplified version

// Configuration - EASILY CONFIGURABLE
const TAGS_CONFIG = {
    POSTS_PER_PAGE: 3,        // ⚙️ CHANGE THIS to adjust posts per page (currently 5)
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

// Function to extract metadata from HTML content (same as original)
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

// Function to format date for display
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Function to organize posts by tags
function organizePosts(posts) {
    const counts = {};
    const byTag = {};
    
    posts.forEach(post => {
        post.metadata.tags.forEach(tag => {
            counts[tag] = (counts[tag] || 0) + 1;
            
            if (!byTag[tag]) {
                byTag[tag] = [];
            }
            byTag[tag].push(post);
        });
    });
    
    // Sort posts within each tag by date (newest first)
    Object.keys(byTag).forEach(tag => {
        byTag[tag].sort((a, b) => new Date(b.metadata.date) - new Date(a.metadata.date));
    });
    
    return { tagCounts: counts, postsByTag: byTag };
}

// Create tag cloud HTML with filtering
function createTagCloudHTML(tagCounts, selectedTag) {
    const sortedTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a) // Sort by count descending
        .map(([tag, count]) => {
            const isActive = tag === selectedTag;
            const activeClass = isActive ? 'tag-active' : '';
            return `<button class="tag-filter ${activeClass}" onclick="filterByTag('${tag}')" data-tag="${tag}">${tag} (${count})</button>`;
        });
    
    const clearFilter = selectedTag ? 
        `<button class="tag-filter tag-clear" onclick="clearTagFilter()">× Clear filter</button>` : '';
    
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
    // Only show posts when a tag is selected
    if (!selectedTag) {
        return []; // No posts in default state
    }
    
    const postsToShow = postsByTag[selectedTag] || [];
    const startIndex = (currentPage - 1) * TAGS_CONFIG.POSTS_PER_PAGE;
    const endIndex = startIndex + TAGS_CONFIG.POSTS_PER_PAGE;
    
    const pagesPosts = postsToShow.slice(startIndex, endIndex);
    
    console.log(`📄 Tag "${selectedTag}" Page ${currentPage}: showing ${pagesPosts.length} posts (${startIndex}-${endIndex-1} of ${postsToShow.length} total)`);
    
    return pagesPosts;
}

// Calculate pagination
function calculatePagination() {
    if (!selectedTag) {
        // No pagination in default state
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
    if (!selectedTag) {
        // Default state - no tag selected, show nothing
        return '';
    }
    
    if (posts.length === 0) {
        return '<div class="no-posts">No posts found for the selected tag.</div>';
    }
    
    // Single tag view - simple list format
    const postsHTML = posts.map(post => 
        `<div class="simple-post-item">
            <div class="post-title">
                <a href="blog/${post.filename}">${post.metadata.title}</a>
            </div>
            <div class="post-date">${formatDate(post.metadata.date)}</div>
            <div class="post-excerpt">${post.metadata.excerpt}</div>
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
    
    // Previous button
    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    html += `<button class="pagination-btn prev-btn ${prevDisabled}" 
                onclick="goToPage(${currentPage - 1})" 
                ${prevDisabled ? 'disabled' : ''}>← Previous</button>`;
    
    // Page numbers
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
    
    // Next button
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';
    html += `<button class="pagination-btn next-btn ${nextDisabled}" 
                onclick="goToPage(${currentPage + 1})"
                ${nextDisabled ? 'disabled' : ''}>Next →</button>`;
    
    html += '</div>';
    
    // Pagination info
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
    
    console.log(`🔄 Updating display: page ${currentPage}/${totalPages}, tag: ${selectedTag || 'NONE'}`);
    
    const tagCloudContainer = document.getElementById('tag-cloud');
    const tagSectionsContainer = document.getElementById('tag-sections');
    
    // Update tag cloud
    tagCloudContainer.innerHTML = createTagCloudHTML(tagCounts, selectedTag);
    
    // Get posts for current page
    const postsForPage = getPostsForPage();
    
    if (selectedTag) {
        console.log(`📋 Posts for "${selectedTag}" page ${currentPage}:`, postsForPage.map(p => p.metadata.title));
    } else {
        console.log(`📋 Default state: showing no posts`);
    }
    
    // Update content
    tagSectionsContainer.innerHTML = createPostsHTML(postsForPage);
    
    // Update pagination
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

// Load posts sequentially (more reliable)
async function loadTagsPage() {
    const tagCloudContainer = document.getElementById('tag-cloud');
    const tagSectionsContainer = document.getElementById('tag-sections');
    
    try {
        console.log('🚀 Starting to load tags page...');
        
        // Check if BLOG_POSTS exists
        if (typeof BLOG_POSTS === 'undefined') {
            throw new Error('BLOG_POSTS is not defined. Make sure blog-posts.js is loaded.');
        }
        
        console.log(`📚 Found ${BLOG_POSTS.length} blog posts to load`);
        
        allPosts = [];
        let loadedCount = 0;
        
        // Load posts one by one for better reliability
        for (const filename of BLOG_POSTS) {
            try {
                console.log(`📄 Loading ${filename}...`);
                const response = await fetch(`blog/${filename}`);
                if (!response.ok) {
                    console.warn(`❌ Failed to fetch ${filename}: ${response.status}`);
                    continue;
                }
                
                const htmlContent = await response.text();
                const metadata = extractMetadata(htmlContent);
                allPosts.push({ filename, metadata });
                loadedCount++;
                
                console.log(`✅ Loaded ${filename}: ${metadata.title}`);
                
                // Update loading indicator
                tagCloudContainer.innerHTML = `<div class="loading">Loading posts... (${loadedCount}/${BLOG_POSTS.length})</div>`;
                
            } catch (error) {
                console.warn(`❌ Error loading ${filename}:`, error);
            }
        }
        
        console.log(`📊 Successfully loaded ${allPosts.length} posts`);
        
        if (allPosts.length === 0) {
            tagCloudContainer.innerHTML = '<div class="no-posts">No blog posts could be loaded.</div>';
            tagSectionsContainer.innerHTML = '';
            return;
        }
        
        // Organize posts by tags
        const organized = organizePosts(allPosts);
        tagCounts = organized.tagCounts;
        postsByTag = organized.postsByTag;
        
        console.log(`🏷️ Found ${Object.keys(tagCounts).length} unique tags`);
        
        // Get initial state from URL
        const urlState = getCurrentStateFromURL();
        selectedTag = urlState.tag && tagCounts[urlState.tag] ? urlState.tag : null;
        currentPage = urlState.page;
        
        console.log(`🎯 Initial state: page=${currentPage}, tag=${selectedTag || 'none'}`);
        
        // Update display
        updateDisplay();
        
        console.log('✅ Tags page loaded successfully!');
        
    } catch (error) {
        console.error('💥 Error loading tags page:', error);
        tagCloudContainer.innerHTML = `
            <div class="error">
                <p>Unable to load tags: ${error.message}</p>
                <p><small>Check the console for more details.</small></p>
                <button onclick="loadTagsPage()" class="retry-btn">Retry</button>
            </div>
        `;
        tagSectionsContainer.innerHTML = '';
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
    console.log('🚀 DOM loaded, starting tags page...');
    // Small delay to ensure all scripts are loaded
    setTimeout(loadTagsPage, 100);
});