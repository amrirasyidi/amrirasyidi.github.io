// Paginated Blog.js - Load only 3-5 posts at a time for instant performance

// Configuration
const PAGINATION_CONFIG = {
    POSTS_PER_PAGE: 3, // Change this to 3, 4, or 5 as preferred
    SHOW_PAGE_NUMBERS: true,
    SHOW_PREV_NEXT: true,
    MAX_PAGE_BUTTONS: 5 // Show max 5 page number buttons
};

// State management
let currentPage = 1;
let totalPages = 1;
let allPosts = []; // Cache for loaded posts
let isLoading = false;

// Get current page from URL
function getCurrentPageFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page')) || 1;
    return Math.max(1, page); // Ensure page is at least 1
}

// Update URL without page reload
function updateURL(page) {
    const url = new URL(window.location);
    if (page === 1) {
        url.searchParams.delete('page');
    } else {
        url.searchParams.set('page', page);
    }
    window.history.pushState({}, '', url);
}

// Calculate pagination info
function calculatePagination() {
    totalPages = Math.ceil(BLOG_POSTS.length / PAGINATION_CONFIG.POSTS_PER_PAGE);
    currentPage = Math.min(getCurrentPageFromURL(), totalPages); // Don't exceed total pages
}

// Get posts for specific page
function getPostsForPage(page) {
    const startIndex = (page - 1) * PAGINATION_CONFIG.POSTS_PER_PAGE;
    const endIndex = startIndex + PAGINATION_CONFIG.POSTS_PER_PAGE;
    return BLOG_POSTS.slice(startIndex, endIndex);
}

// Load posts for a specific page
async function loadPostsForPage(page) {
    if (isLoading) return;
    
    isLoading = true;
    const container = document.getElementById('blog-posts');
    
    // Show loading state
    showLoadingState(container);
    
    try {
        const postsToLoad = getPostsForPage(page);
        console.log(`📄 Loading page ${page} (${postsToLoad.length} posts)`);
        
        const posts = [];
        
        // Load posts in parallel for this page
        const promises = postsToLoad.map(async (filename) => {
            try {
                const response = await fetch(`blog/${filename}`);
                if (!response.ok) return null;
                
                const htmlContent = await response.text();
                const metadata = extractMetadata(htmlContent);
                const readingTime = calculateReadingTime(htmlContent);
                
                return { filename, metadata, readingTime };
            } catch (error) {
                console.warn(`Failed to load ${filename}:`, error);
                return null;
            }
        });
        
        const results = await Promise.all(promises);
        const validPosts = results.filter(post => post !== null);
        
        // Sort by date (newest first) - important for pagination
        validPosts.sort((a, b) => new Date(b.metadata.date) - new Date(a.metadata.date));
        
        // Display posts
        displayPagedPosts(validPosts, container);
        
        // Update pagination controls
        updatePaginationControls();
        
        // Update URL
        updateURL(page);
        
        console.log(`✅ Loaded ${validPosts.length} posts for page ${page}`);
        
    } catch (error) {
        console.error('Error loading posts:', error);
        showErrorState(container, error);
    } finally {
        isLoading = false;
    }
}

// Show loading state
function showLoadingState(container) {
    container.innerHTML = `
        <div class="posts-content">
            <div class="loading-state">
                <div class="loading">Loading posts...</div>
                <div class="loading-info">Page ${currentPage} of ${totalPages}</div>
            </div>
        </div>
    `;
}

// Show error state
function showErrorState(container, error) {
    container.innerHTML = `
        <div class="posts-content">
            <div class="error">
                <p>Unable to load blog posts.</p>
                <p><small>Error: ${error.message}</small></p>
                <button onclick="loadPostsForPage(${currentPage})" class="retry-btn">Retry</button>
            </div>
        </div>
    `;
}

// Display posts for current page
function displayPagedPosts(posts, container) {
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="posts-content">
                <div class="no-posts">No blog posts found on this page.</div>
            </div>
        `;
        return;
    }
    
    const postsHTML = posts.map(post => 
        createPostHTML(post.filename, post.metadata, post.readingTime)
    ).join('');
    
    // Wrap posts in posts-content div for consistent height
    container.innerHTML = `
        <div class="posts-content">
            ${postsHTML}
        </div>
    `;
    
    // Smooth scroll to top when changing pages (but not on initial load)
    if (currentPage > 1) {
        container.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Create pagination controls
function createPaginationControls() {
    if (totalPages <= 1) return '';
    
    let paginationHTML = '<div class="pagination">';
    
    // Previous button
    if (PAGINATION_CONFIG.SHOW_PREV_NEXT) {
        const prevDisabled = currentPage === 1 ? 'disabled' : '';
        paginationHTML += `
            <button class="pagination-btn prev-btn ${prevDisabled}" 
                    onclick="goToPage(${currentPage - 1})" 
                    ${prevDisabled ? 'disabled' : ''}>
                ← Previous
            </button>
        `;
    }
    
    // Page numbers
    if (PAGINATION_CONFIG.SHOW_PAGE_NUMBERS) {
        const pageNumbers = generatePageNumbers();
        pageNumbers.forEach(pageNum => {
            if (pageNum === '...') {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            } else {
                const activeClass = pageNum === currentPage ? 'active' : '';
                paginationHTML += `
                    <button class="pagination-btn page-btn ${activeClass}" 
                            onclick="goToPage(${pageNum})">
                        ${pageNum}
                    </button>
                `;
            }
        });
    }
    
    // Next button
    if (PAGINATION_CONFIG.SHOW_PREV_NEXT) {
        const nextDisabled = currentPage === totalPages ? 'disabled' : '';
        paginationHTML += `
            <button class="pagination-btn next-btn ${nextDisabled}" 
                    onclick="goToPage(${currentPage + 1})"
                    ${nextDisabled ? 'disabled' : ''}>
                Next →
            </button>
        `;
    }
    
    paginationHTML += '</div>';
    
    // Add pagination info
    paginationHTML += `
        <div class="pagination-info">
            Page ${currentPage} of ${totalPages} 
            (${BLOG_POSTS.length} total posts)
        </div>
    `;
    
    return paginationHTML;
}

// Generate smart page numbers (with ellipsis for many pages)
function generatePageNumbers() {
    const maxButtons = PAGINATION_CONFIG.MAX_PAGE_BUTTONS;
    const pages = [];
    
    if (totalPages <= maxButtons) {
        // Show all pages if we have few pages
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        // Smart pagination with ellipsis
        const sidePages = Math.floor((maxButtons - 3) / 2); // Pages on each side of current
        
        pages.push(1); // Always show first page
        
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
            pages.push(totalPages); // Always show last page
        }
    }
    
    return pages;
}

// Update pagination controls
function updatePaginationControls() {
    let paginationContainer = document.getElementById('pagination-container');
    
    if (!paginationContainer) {
        // Create pagination container if it doesn't exist
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination-container';
        
        // Insert pagination container after the blog-posts div
        const blogPostsContainer = document.getElementById('blog-posts');
        blogPostsContainer.parentNode.insertBefore(paginationContainer, blogPostsContainer.nextSibling);
    }
    
    paginationContainer.innerHTML = createPaginationControls();
}

// Navigate to specific page
function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage || isLoading) {
        return;
    }
    
    currentPage = page;
    loadPostsForPage(page);
}

// Utility functions (same as before)
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

function calculateReadingTime(htmlContent) {
    const textContent = htmlContent.replace(/<[^>]*>/g, '');
    const words = textContent.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    return Math.ceil(wordCount / 200);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function createPostHTML(filename, metadata, readingTime) {
    const tagsHTML = metadata.tags.map(tag => 
        `<a href="tags.html#${tag}" class="tag">${tag}</a>`
    ).join('');
    
    return `
        <div class="blog-post">
            <div class="post-date">${formatDate(metadata.date)} • ${readingTime} min read</div>
            <div class="post-title"><a href="blog/${filename}">${metadata.title}</a></div>
            <div class="post-excerpt">${metadata.excerpt}</div>
            <div class="tags">${tagsHTML}</div>
        </div>
    `;
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    const newPage = getCurrentPageFromURL();
    if (newPage !== currentPage) {
        currentPage = newPage;
        loadPostsForPage(currentPage);
    }
});

// Initialize blog when page loads
document.addEventListener('DOMContentLoaded', function() {
    calculatePagination();
    currentPage = getCurrentPageFromURL();
    loadPostsForPage(currentPage);
    
    console.log(`📚 Initialized paginated blog: ${BLOG_POSTS.length} total posts, ${PAGINATION_CONFIG.POSTS_PER_PAGE} per page, ${totalPages} pages`);
});

// Expose goToPage function globally for onclick handlers
window.goToPage = goToPage;