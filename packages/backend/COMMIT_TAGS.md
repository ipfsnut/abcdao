# ABC DAO Commit Tags 🏷️

Control your commit behavior with special hashtags! Add these tags to your commit messages to customize how ABC DAO handles your contributions.

## Available Tags

| Tag | Description | Example |
|-----|-------------|---------|
| `#silent` | Skip casting about this commit | `fix: update database schema #silent` |
| `#private` | Don't include in leaderboards or public stats | `experiment: try new approach #private` |
| `#devoff` | Temporarily disable dev status | `taking a break for vacation #devoff` |
| `#devon` | Re-enable dev status | `back from vacation, ready to code! #devon` |
| `#norew` | Skip reward generation for this commit | `docs: fix typos #norew` |
| `#priority` | Mark as high priority (1.5x reward multiplier) | `fix: critical security patch #priority` |
| `#experiment` | Mark as experimental work | `experiment: test new algorithm #experiment` |
| `#milestone` | Mark as milestone achievement (1.5x reward multiplier) | `feat: v2.0 release! #milestone` |

## Usage Examples

### Silent Commits
```bash
git commit -m "fix: update database schema #silent"
```
- ✅ Commit recorded and rewarded
- ❌ No public cast posted

### Private Development
```bash
git commit -m "experiment: trying new ML model #experiment #private"
```
- ✅ Commit recorded and rewarded
- 🔒 Won't appear in public leaderboards
- 🧪 Marked as experimental priority

### Dev Status Management
```bash
# Going offline
git commit -m "taking a break for a few days #devoff"

# Coming back online  
git commit -m "back to coding! #devon"
```
- 🟡/🟢 Updates your dev status
- 📢 Posts status change announcement (unless #silent)

### No Rewards
```bash
git commit -m "docs: fix typo in README #norew"
```
- ✅ Commit recorded
- ❌ No $ABC rewards generated
- ✅ Still gets cast (unless #silent)

### Priority Commits
```bash
git commit -m "fix: critical security vulnerability #priority"
git commit -m "feat: major feature launch #milestone"
```
- ⭐ 1.5x reward multiplier
- 🎯 Special priority indicators in casts

## Tag Combinations

You can combine multiple tags:

```bash
# Private priority work
git commit -m "feat: secret feature #priority #private"

# Silent status change
git commit -m "going offline for maintenance #devoff #silent"

# Experimental work without rewards
git commit -m "test: trying new approach #experiment #norew"
```

## Cast Indicators

Tagged commits get special indicators in public casts:

- `⭐ (Priority)` - High priority commits
- `🎯 (Milestone)` - Milestone achievements  
- `🧪 (Experiment)` - Experimental work
- `🔒` - Private commits (still cast but marked)

## API Endpoints

### Get Tag Documentation
```bash
curl https://abcdao-production.up.railway.app/api/commits/tags
```

### Parse Commit Message
```bash
curl -X POST https://abcdao-production.up.railway.app/api/commits/parse \
  -H "Content-Type: application/json" \
  -d '{"message": "feat: new feature #milestone #silent"}'
```

### Check Dev Status
```bash
curl https://abcdao-production.up.railway.app/api/commits/dev-status/yourusername
```

## Database Schema

New columns added to support tags:

```sql
ALTER TABLE commits ADD COLUMN tags TEXT[] DEFAULT '{}';
ALTER TABLE commits ADD COLUMN priority VARCHAR(50) DEFAULT 'normal';
ALTER TABLE commits ADD COLUMN is_private BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
```

## Important Notes

- Tags are **case-insensitive**: `#Silent`, `#SILENT`, and `#silent` all work
- Tags are **automatically removed** from the commit message in casts
- **Priority multipliers** apply to `#priority` and `#milestone` tags (1.5x rewards)
- **Dev status changes** are processed before reward generation
- **Private commits** are still rewarded but excluded from public stats
- **Multiple tags** can be combined in any order

## Best Practices

1. **Use `#silent`** for maintenance, refactoring, or minor fixes
2. **Use `#private`** for experimental or sensitive development
3. **Use `#priority`** or `#milestone`** for important releases
4. **Use `#devoff`/`#devon`** to manage your availability status
5. **Use `#norew`** for documentation or non-development commits

---

**Ready to use commit tags?** Just add them to your commit messages and ABC DAO will handle the rest! 

🚀 **Ship code. Earn $ABC. Control your flow.** #AlwaysBeCoding