# Commit Tags Integration 🏷️

This document explains the commit tags feature integration in the ABC DAO frontend.

## Overview

The commit tags system allows developers to control their commit behavior using hashtags in commit messages. The feature is accessible from the `./rewards` tab in the main application.

## Frontend Integration

### Component: `CommitTagsDocs`

**Location:** `/components/commit-tags-docs.tsx`

**Features:**
- 📚 Interactive documentation viewer
- 🔄 Lazy loading (docs only fetch when opened)
- 🎨 Matrix-themed UI matching app design
- 📱 Mobile-responsive design
- 🔗 Live API integration with backend

**Usage:**
```tsx
import { CommitTagsDocs } from './commit-tags-docs';

// Renders as collapsible documentation panel
<CommitTagsDocs />
```

### Integration Point: `ClaimRewardsPanel`

**Location:** `/components/claim-rewards.tsx`

The commit tags docs are integrated at the bottom of the rewards panel, making them easily discoverable when users are viewing their reward activity.

## User Experience

### Collapsed State
- Shows as blue button: `> commit_tags_guide()`
- Minimal visual footprint
- Consistent with app's terminal aesthetic

### Expanded State
- Comprehensive tag documentation
- Live examples with syntax highlighting
- Visual indicators for different tag types
- Best practices section
- Easy-to-scan layout

## API Integration

The component fetches live documentation from:
- **Endpoint:** `GET /api/commits/tags`
- **Response:** Tag definitions, examples, help text
- **Error Handling:** Graceful fallback with retry option

## Visual Design

### Color Coding
- **Blue:** Documentation and guides (`#3b82f6`)
- **Green:** Examples and success states (`#10b981`)
- **Purple:** Special features (`#8b5cf6`)
- **Yellow:** Warnings and pending states (`#f59e0b`)

### Typography
- **Font:** `font-mono` (consistent with app)
- **Sizes:** Responsive (`text-xs sm:text-sm`)
- **Effects:** Matrix glow for headers

## Mobile Optimization

- Horizontal scroll prevention
- Touch-friendly buttons
- Readable text sizes on small screens
- Optimized spacing for mobile viewing

## Backend Dependencies

- `POST /api/commits/parse` - Test commit message parsing
- `GET /api/commits/tags` - Fetch documentation
- `GET /api/commits/dev-status/:username` - Check developer status

## Future Enhancements

- [ ] Search/filter tags functionality
- [ ] Interactive commit message builder
- [ ] Real-time parsing preview
- [ ] Tag usage analytics
- [ ] Custom tag suggestions

## Development Notes

### State Management
```tsx
const [isOpen, setIsOpen] = useState(false);
const [tagDocs, setTagDocs] = useState<TagDocsData | null>(null);
const [loading, setLoading] = useState(false);
```

### Data Flow
1. User clicks guide button
2. Component fetches docs from API (lazy loaded)
3. Displays comprehensive documentation
4. User can close to return to rewards view

### Error Handling
- Network failures show retry option
- Loading states prevent multiple requests
- Graceful fallbacks for missing data

## Testing

Run the API integration test:
```bash
node test-commit-tags-api.js
```

## Examples

### Available Tags in UI

| Tag | Visual Indicator | Description |
|-----|------------------|-------------|
| `#silent` | 🤐 | Skip public announcements |
| `#private` | 🔒 | Hide from leaderboards |
| `#priority` | ⭐ | High priority (1.5x rewards) |
| `#milestone` | 🎯 | Milestone achievement |
| `#experiment` | 🧪 | Experimental work |
| `#devon` | 🟢 | Enable dev status |
| `#devoff` | 🟡 | Disable dev status |
| `#norew` | ❌ | Skip reward generation |

---

**Integration Complete** ✅
The commit tags documentation is now fully integrated into the rewards screen, providing developers with easy access to powerful commit control features.