// scripts/generate-metadata.js - Auto-discovery version (no manual lists!)
const fs = require('fs');
const path = require('path');

function extractMetadata(htmlContent, filename) {
    const commentPattern = /<!--[\s\S]*?title:\s*([^\n\r]+)[\s\S]*?date:\s*([^\n\r]+)[\s\S]*?excerpt:\s*([^\n\r]+)[\s\S]*?tags:\s*([^\n\r]+)[\s\S]*?-->/;
    const match = htmlContent.match(commentPattern);
    
    if (match) {
        return {
            filename,
            title: match[1].trim(),
            date: match[2].trim(),
            excerpt: match[3].trim(),
            tags: match[4].trim().split(',').map(tag => tag.trim()),
            lastModified: new Date().toISOString()
        };
    }
    
    // Fallback extraction
    const titleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/);
    const dateMatch = htmlContent.match(/(\d{4}-\d{2}-\d{2})/);
    
    return {
        filename,
        title: titleMatch ? titleMatch[1].trim() : 'Untitled',
        date: dateMatch ? dateMatch[1] : 'Unknown date',
        excerpt: 'No excerpt available',
        tags: [],
        lastModified: new Date().toISOString()
    };
}

function organizePosts(posts) {
    const tagCounts = {};
    const postsByTag = {};
    
    posts.forEach(post => {
        post.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            
            if (!postsByTag[tag]) {
                postsByTag[tag] = [];
            }
            postsByTag[tag].push({
                filename: post.filename,
                title: post.title,
                date: post.date,
                excerpt: post.excerpt
            });
        });
    });
    
    // Sort posts within each tag by date (newest first)
    Object.keys(postsByTag).forEach(tag => {
        postsByTag[tag].sort((a, b) => new Date(b.date) - new Date(a.date));
    });
    
    return { tagCounts, postsByTag };
}

// 🔍 AUTO-DISCOVER BLOG POSTS
function discoverBlogPosts(blogDir) {
    console.log('🔍 Auto-discovering blog posts...');
    
    if (!fs.existsSync(blogDir)) {
        console.warn(`⚠️  Blog directory not found: ${blogDir}`);
        return [];
    }
    
    const files = fs.readdirSync(blogDir);
    
    // Filter for HTML files, exclude template
    const blogPosts = files.filter(file => {
        return file.endsWith('.html') && 
               file !== '0_template.html' &&
               !file.startsWith('_'); // Exclude any files starting with underscore
    });
    
    // Sort by filename (which includes date) - newest first
    blogPosts.sort().reverse();
    
    console.log(`📚 Discovered ${blogPosts.length} blog posts:`);
    blogPosts.forEach(post => console.log(`   - ${post}`));
    
    return blogPosts;
}

// 📝 GENERATE BROWSER-COMPATIBLE BLOG-POSTS.JS
function generateBlogPostsJS(blogPosts, staticDir) {
    const jsContent = `// Auto-generated blog posts list - DO NOT EDIT MANUALLY
// Generated on: ${new Date().toISOString()}
// Found ${blogPosts.length} blog posts

const BLOG_POSTS = [
${blogPosts.map(post => `    '${post}'`).join(',\n')}
];

// Export for modules (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BLOG_POSTS;
}
`;
    
    const jsFilePath = path.join(staticDir, 'blog-posts.js');
    fs.writeFileSync(jsFilePath, jsContent);
    
    console.log(`📄 Generated ${jsFilePath}`);
    return blogPosts;
}

async function generateMetadata() {
    console.log('🚀 Starting auto-discovery metadata generation...');
    
    const blogDir = path.join(__dirname, '..', 'blog');
    const staticDir = path.join(__dirname, '..', 'static');
    
    // Ensure static directory exists
    if (!fs.existsSync(staticDir)) {
        fs.mkdirSync(staticDir, { recursive: true });
    }
    
    // 🔍 AUTO-DISCOVER blog posts (no manual list needed!)
    const discoveredPosts = discoverBlogPosts(blogDir);
    
    if (discoveredPosts.length === 0) {
        console.warn('⚠️  No blog posts found! Check your blog/ directory.');
        return;
    }
    
    // 📝 GENERATE blog-posts.js for browser fallback
    generateBlogPostsJS(discoveredPosts, staticDir);
    
    // 📊 PROCESS each discovered post
    const allPosts = [];
    let processedCount = 0;
    
    for (const filename of discoveredPosts) {
        const filePath = path.join(blogDir, filename);
        
        try {
            if (fs.existsSync(filePath)) {
                const htmlContent = fs.readFileSync(filePath, 'utf8');
                const metadata = extractMetadata(htmlContent, filename);
                allPosts.push(metadata);
                processedCount++;
                console.log(`✅ Processed ${filename}: ${metadata.title}`);
            } else {
                console.warn(`⚠️  File not found: ${filename}`);
            }
        } catch (error) {
            console.error(`❌ Error processing ${filename}:`, error.message);
        }
    }
    
    // Sort posts by date (newest first)
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Organize posts by tags
    const organized = organizePosts(allPosts);
    
    // Create final metadata object
    const metadata = {
        posts: allPosts,
        tagCounts: organized.tagCounts,
        postsByTag: organized.postsByTag,
        generatedAt: new Date().toISOString(),
        totalPosts: allPosts.length,
        totalTags: Object.keys(organized.tagCounts).length,
        discoveredFiles: discoveredPosts // List of auto-discovered files
    };
    
    // Write metadata to static directory
    const outputPath = path.join(staticDir, 'blog-metadata.json');
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    
    console.log(`🎉 Generated metadata for ${processedCount} posts`);
    console.log(`📊 Found ${metadata.totalTags} unique tags`);
    console.log(`💾 Saved to: ${outputPath}`);
    console.log(`📦 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    
    return metadata;
}

// Run if called directly
if (require.main === module) {
    generateMetadata()
        .then(() => {
            console.log('✨ Auto-discovery metadata generation completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Metadata generation failed:', error);
            process.exit(1);
        });
}

module.exports = { generateMetadata };