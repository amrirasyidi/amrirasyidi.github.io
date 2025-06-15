# Personal Website - Maintenance Guide

A minimal, frameworkless static website with automated blog listing and dark mode.

## 📁 File Structure

```
├── index.html              # Home page (About section)
├── blog.html               # Blog listing (automated)
├── services.html           # Services page 
├── tags.html               # Tags page (automated)
├── blog-post-template.html # Template for new posts (not linked)
├── blog/
│   ├── 20250610-edge-ai.html
│   └── 20250528-intepretable-ml.html
└── static/
    ├── style.css           # All styling + dark mode
    ├── blog.js             # Blog automation
    ├── tags.js             # Tags automation  
    ├── dark-mode.js        # Dark mode toggle
    └── images/             # For media files
        └── videos/
```

## ✍️ Adding New Blog Posts

### Step 1: Create the Post
1. Copy `blog-post-template.html`
2. Rename to: `blog/YYYYMMDD-post-slug.html`
3. Fill in metadata at the top:
   ```html
   <!--
   title: Your Post Title
   date: YYYY-MM-DD
   excerpt: Brief description for blog listing
   tags: tag1, tag2, tag3
   -->
   ```

### Step 2: Update Automation
**In `static/blog.js`** - Add filename to array:
```javascript
const blogPosts = [
    'YYYYMMDD-new-post.html',  // ← Add here
    '20250610-edge-ai.html',
    '20250528-intepretable-ml.html'
];
```

**In `static/tags.js`** - Add same filename:
```javascript
const blogPosts = [
    'YYYYMMDD-new-post.html',  // ← Add here
    '20250610-edge-ai.html',
    '20250528-intepretable-ml.html'
];
```

### Step 3: Deploy
- Blog listing and tags page update automatically
- No manual editing needed!

## 🎨 Customizing Content

### Personal Information
**File: `index.html`**
- Lines 20-25: Profile description
- Lines 29-35: Areas of expertise
- Lines 37: Social links
- Line 11: Replace "Alex Chen" with your name

### Services
**File: `services.html`**
- Lines 20-60: Service descriptions
- Line 65: Contact email

### Site Title/Name
**Update in all files:**
- `<title>` tags: Replace "Alex Chen"
- Navigation remains the same

### Profile Photo
1. Add your photo to `static/images/profile.jpg`
2. Update line in `index.html`:
   ```html
   <div class="profile-img">Profile Photo</div>
   <!-- Replace with: -->
   <img src="static/images/profile.jpg" alt="Your Name" class="profile-img">
   ```

## 🔧 Technical Details

### Blog Automation
**How it works:**
1. JavaScript fetches each blog post file
2. Extracts metadata from HTML comments
3. Generates blog listing and tag pages dynamically
4. Sorts by date, counts tags automatically

**Files involved:**
- `static/blog.js`: Creates blog listing
- `static/tags.js`: Creates tag cloud and sections
- Both need the same `blogPosts` array

### Dark Mode
**How it works:**
1. Button toggles `dark-mode` class on `<body>`
2. CSS has styles for both light and dark modes
3. Preference saved in session storage
4. All colors defined in `static/style.css`

**To modify colors:**
Edit `static/style.css` lines:
- Light mode: Lines 1-20
- Dark mode: Lines 23-40 (`.dark-mode` selectors)

### Navigation
**Structure:**
- All pages have same navigation
- Blog posts (in `/blog/` folder) still use "About" instead of "Home"
- Dark mode toggle appears on all pages

## 🚀 Deployment

### GitHub Pages
1. Create GitHub repository
2. Upload all files
3. Settings → Pages → Deploy from main branch
4. Site live at: `username.github.io/repo-name`

### Other Options
- **Netlify**: Drag folder to netlify.com
- **Vercel**: Upload to vercel.com
- **Surge**: `npm install -g surge` then `surge`

## 🔍 Troubleshooting

### Blog Posts Not Showing
**Check:**
1. Is the server running? (Not opening files directly)
2. Are filenames in `blog.js` and `tags.js` exactly correct?
3. Does the metadata comment format match the template?
4. Check browser console for errors (F12)

### Dark Mode Not Working
**Check:**
1. Is `dark-mode.js` included in the page?
2. Check browser console for JavaScript errors
3. Verify button has `id="dark-mode-toggle"`

### Styling Issues
**Check:**
1. Is `style.css` linked correctly?
2. Are file paths correct? (`../static/style.css` for blog posts)
3. Try hard refresh (Ctrl+F5)

## 📝 Content Guidelines

### Blog Posts
- **Filename format**: `YYYYMMDD-slug.html`
- **Title**: Clear and descriptive
- **Excerpt**: One sentence, ~15-20 words
- **Tags**: 2-5 tags, lowercase, hyphen-separated
- **Content**: Use h2 for main sections, h3 for subsections

### Writing Style
- Direct and conversational
- Technical but accessible
- Include practical examples
- Break up long paragraphs

### Media Files
- **Images**: `static/images/filename.jpg`
- **Videos**: `static/videos/filename.mp4`
- **Usage**: `<img src="../static/images/name.jpg" alt="description">`

## 🗂️ File Maintenance

### Regular Tasks
- Update `blogPosts` arrays when adding posts
- Check that tag links work after adding new tags
- Test dark mode on new pages
- Verify responsive design on mobile

### Backup Important Files
- `static/blog.js` and `static/tags.js` (contain post lists)
- `static/style.css` (all your styling)
- `index.html` and `services.html` (your content)

## 💡 Tips

1. **Test locally**: Use `python -m http.server 8000` to test
2. **Browser cache**: Hard refresh (Ctrl+F5) after changes
3. **File naming**: Keep consistent with date format
4. **Metadata**: Double-check spelling and format
5. **Links**: Test all internal links after changes

---

*Last updated: [Current Date]*