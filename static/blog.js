
// Function to calculate reading time from HTML content
function calculateReadingTime(htmlContent) {
    // Remove HTML tags and get plain text
    const textContent = htmlContent.replace(/<[^>]*>/g, '');
    
    // Count words (split by whitespace, filter empty)
    const words = textContent.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Calculate reading time (200 WPM average)
    const readingTimeMinutes = Math.ceil(wordCount / 200);
    
    return readingTimeMinutes;
}

// Function to extract metadata from HTML content
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

// Function to create blog post HTML
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

// Load and process blog posts
async function loadBlogPosts() {
    const container = document.getElementById('blog-posts');
    
    try {
        const posts = [];
        
        for (const filename of BLOG_POSTS) {
            try {
                const response = await fetch(`blog/${filename}`);
                if (!response.ok) continue;
                
                const htmlContent = await response.text();
                const metadata = extractMetadata(htmlContent);
                const readingTime = calculateReadingTime(htmlContent);
                posts.push({ filename, metadata, readingTime });
            } catch (error) {
                console.warn(`Failed to load ${filename}:`, error);
            }
        }
        
        // Sort posts by date (newest first)
        posts.sort((a, b) => new Date(b.metadata.date) - new Date(a.metadata.date));
        
        // Generate HTML
        if (posts.length > 0) {
            container.innerHTML = posts.map(post => 
                createPostHTML(post.filename, post.metadata, post.readingTime)
            ).join('');
        } else {
            container.innerHTML = '<div class="no-posts">No blog posts found.</div>';
        }
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        container.innerHTML = `
            <div class="error">
                <p>Unable to load blog posts automatically.</p>
                <p><small>Note: This feature requires serving the site from a web server (not opening files directly).</small></p>
            </div>
        `;
    }
}

// Load posts when page loads
document.addEventListener('DOMContentLoaded', loadBlogPosts);