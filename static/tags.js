// Function to extract metadata from HTML content (same as in blog.js)
function extractMetadata(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Look for metadata in HTML comments (fixed regex)
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
    
    // Fallback: extract from HTML content
    const titleElement = doc.querySelector('h1');
    const title = titleElement ? titleElement.textContent.trim() : 'Untitled';
    
    // Try to extract date from filename or content
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

// Function to count tags and organize posts
function organizePosts(posts) {
    const tagCounts = {};
    const postsByTag = {};
    
    posts.forEach(post => {
        post.metadata.tags.forEach(tag => {
            // Count tags
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            
            // Group posts by tag
            if (!postsByTag[tag]) {
                postsByTag[tag] = [];
            }
            postsByTag[tag].push(post);
        });
    });
    
    return { tagCounts, postsByTag };
}

// Function to create tag cloud HTML
function createTagCloudHTML(tagCounts) {
    const sortedTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a) // Sort by count descending
        .map(([tag, count]) => 
            `<a href="#${tag}" class="tag" style="margin: 5px;">${tag} (${count})</a>`
        );
    
    return sortedTags.join('');
}

// Function to create tag sections HTML
function createTagSectionsHTML(postsByTag) {
    const sortedTags = Object.keys(postsByTag).sort();
    
    return sortedTags.map(tag => {
        const posts = postsByTag[tag];
        const postsHTML = posts.map(post => 
            `<li><a href="blog/${post.filename}">${post.metadata.title}</a> (${formatDate(post.metadata.date)})</li>`
        ).join('');
        
        return `
            <div id="${tag}" style="margin-top: 40px;">
                <h2>${tag}</h2>
                <ul>
                    ${postsHTML}
                </ul>
            </div>
        `;
    }).join('');
}

// Load and process all posts to build tags page
async function loadTagsPage() {
    const tagCloudContainer = document.getElementById('tag-cloud');
    const tagSectionsContainer = document.getElementById('tag-sections');
    
    try {
        const posts = [];
        
        // Fetch all blog posts
        for (const filename of BLOG_POSTS) {
            try {
                const response = await fetch(`blog/${filename}`);
                if (!response.ok) continue;
                
                const htmlContent = await response.text();
                const metadata = extractMetadata(htmlContent);
                posts.push({ filename, metadata });
            } catch (error) {
                console.warn(`Failed to load ${filename}:`, error);
            }
        }
        
        if (posts.length === 0) {
            tagCloudContainer.innerHTML = '<div class="no-posts">No blog posts found.</div>';
            tagSectionsContainer.innerHTML = '';
            return;
        }
        
        // Organize posts by tags
        const { tagCounts, postsByTag } = organizePosts(posts);
        
        // Generate tag cloud
        tagCloudContainer.innerHTML = createTagCloudHTML(tagCounts);
        
        // Generate tag sections
        tagSectionsContainer.innerHTML = createTagSectionsHTML(postsByTag);
        
    } catch (error) {
        console.error('Error loading tags page:', error);
        tagCloudContainer.innerHTML = `
            <div class="error">
                <p>Unable to load tags automatically.</p>
                <p><small>Note: This feature requires serving the site from a web server (not opening files directly).</small></p>
            </div>
        `;
        tagSectionsContainer.innerHTML = '';
    }
}

// Load tags when page loads
document.addEventListener('DOMContentLoaded', loadTagsPage);