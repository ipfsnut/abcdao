# ABC_DAO Script Organization Plan

**Objective**: Clean up scattered scripts and organize by function  
**Current State**: Scripts spread across root, backend, and various subdirectories  
**Target State**: Logical folder structure with clear categorization  

---

## 🗂️ Proposed Folder Structure

### Root Level Organization
```
abc-dao/
├── scripts/                    # Deployment & system scripts
│   ├── deployment/            # Deploy contracts, setup infrastructure
│   ├── maintenance/           # System maintenance, updates
│   └── utilities/             # General purpose utilities
├── tools/                     # Development & testing tools
│   ├── analysis/              # Code/data analysis scripts
│   ├── testing/               # Test runners, validation
│   ├── debugging/             # Debug helpers, investigation
│   └── monitoring/            # Health checks, status monitoring
├── automation/                # Scheduled jobs & automations
│   ├── cron/                  # Scheduled background jobs
│   ├── webhooks/              # Webhook handlers
│   └── integrations/          # Third-party integrations
└── docs/                      # Documentation & planning
    ├── planning/              # Strategic planning documents
    ├── architecture/          # Technical architecture docs
    └── guides/                # Setup & usage guides
```

### Backend Specific Structure
```
packages/backend/
├── scripts/                   # Backend-specific scripts
│   ├── database/             # DB migrations, utilities
│   ├── rewards/              # Reward processing scripts
│   ├── payments/             # Payment processing tools
│   └── users/                # User management scripts
└── tools/                    # Backend development tools
    ├── testing/              # Test scripts & fixtures
    ├── debugging/            # Debug & investigation tools
    └── validation/           # Data validation scripts
```

---

## 📋 Current Script Inventory & Categorization

### Root Level Scripts (to organize)
```bash
# Deployment Scripts
scripts/deploy-abc-configurable.sh          → scripts/deployment/
scripts/deploy-abc-system.sh                → scripts/deployment/
scripts/update-addresses.js                 → scripts/deployment/

# Development Tools
generate-screenshots.js                      → tools/utilities/
abc-logo.html                               → docs/assets/ (or delete if unused)

# Planning Documents
plans/                                       → docs/planning/ (rename)
```

### Backend Root Scripts (to organize)
```bash
# User Management
add-user-settings.js                        → scripts/users/
investigate-free-member.js                  → tools/debugging/
investigate-users.js                        → tools/debugging/
check-members.js                            → tools/validation/
welcome-all-contributors.js                 → scripts/users/

# Payment Processing
apply-wallet-migration.js                   → scripts/database/
check-payments.js                           → tools/validation/
manual-process-payments.js                  → scripts/payments/

# Commit & Rewards
check-commit-structure.js                   → tools/validation/
check-commits.js                            → tools/validation/
generate-custom-leaderboard.js              → scripts/rewards/
generate-leaderboard-snapshot.js            → scripts/rewards/

# Testing & Development
test-*.js (15 files)                        → tools/testing/
check-staking-balance.js                    → tools/validation/

# Documentation
manual-token-testing.md                     → docs/guides/
DISCORD_SETUP.md                           → docs/guides/
COMMIT_TAGS.md                              → docs/guides/
```

### Backend Testing Folder (already organized)
```bash
# Keep existing structure, just move location
testing/                                     → tools/testing/legacy/
```

---

## 🚀 Migration Plan

### Phase 1: Create New Folder Structure
1. Create main folders: `scripts/`, `tools/`, `automation/`, `docs/`
2. Create backend subfolders: `database/`, `rewards/`, `payments/`, `users/`
3. Create tool categories: `testing/`, `debugging/`, `validation/`, `utilities/`

### Phase 2: Move Scripts by Category
1. **Deployment Scripts** → `scripts/deployment/`
2. **Database Scripts** → `scripts/database/`
3. **User Management** → `scripts/users/`
4. **Payment Processing** → `scripts/payments/`
5. **Reward Processing** → `scripts/rewards/`

### Phase 3: Move Development Tools
1. **Test Scripts** → `tools/testing/`
2. **Debug Scripts** → `tools/debugging/`
3. **Validation Scripts** → `tools/validation/`
4. **Utilities** → `tools/utilities/`

### Phase 4: Move Documentation
1. **Planning Docs** → `docs/planning/`
2. **Setup Guides** → `docs/guides/`
3. **Architecture** → `docs/architecture/`

### Phase 5: Update References
1. Update package.json scripts
2. Update documentation references
3. Update CI/CD scripts
4. Update .gitignore patterns

---

## 📝 Detailed Migration Commands

### Root Level Moves
```bash
# Create structure
mkdir -p scripts/{deployment,maintenance,utilities}
mkdir -p tools/{analysis,testing,debugging,monitoring,utilities}
mkdir -p automation/{cron,webhooks,integrations}
mkdir -p docs/{planning,architecture,guides,assets}

# Move deployment scripts
mv scripts/deploy-abc-configurable.sh scripts/deployment/
mv scripts/deploy-abc-system.sh scripts/deployment/
mv scripts/update-addresses.js scripts/deployment/

# Move planning docs
mv plans/ docs/planning/

# Move utilities
mv generate-screenshots.js tools/utilities/
mv abc-logo.html docs/assets/ # or delete if unused
```

### Backend Moves
```bash
cd packages/backend

# Create backend structure
mkdir -p scripts/{database,rewards,payments,users}
mkdir -p tools/{testing,debugging,validation,utilities}

# User management scripts
mv add-user-settings.js scripts/users/
mv investigate-free-member.js tools/debugging/
mv investigate-users.js tools/debugging/
mv check-members.js tools/validation/
mv welcome-all-contributors.js scripts/users/

# Payment & database scripts
mv apply-wallet-migration.js scripts/database/
mv check-payments.js tools/validation/
mv manual-process-payments.js scripts/payments/

# Reward & commit scripts
mv check-commit-structure.js tools/validation/
mv check-commits.js tools/validation/
mv generate-custom-leaderboard.js scripts/rewards/
mv generate-leaderboard-snapshot.js scripts/rewards/
mv check-staking-balance.js tools/validation/

# Testing scripts
mv test-*.js tools/testing/
mv testing/ tools/testing/legacy/

# Documentation
mv manual-token-testing.md ../../docs/guides/
mv DISCORD_SETUP.md ../../docs/guides/
mv COMMIT_TAGS.md ../../docs/guides/
```

---

## 🔧 Update Required Files

### Package.json Scripts
```json
{
  "scripts": {
    "deploy": "bash scripts/deployment/deploy-abc-system.sh",
    "test:integration": "node tools/testing/test-server-start.js",
    "validate:payments": "node tools/validation/check-payments.js",
    "debug:users": "node tools/debugging/investigate-users.js",
    "rewards:leaderboard": "node scripts/rewards/generate-leaderboard-snapshot.js"
  }
}
```

### Documentation Updates
```markdown
# Update references in:
- README.md
- CLAUDE.md
- REPOSITORY-INTEGRATION-GUIDE.md
- All docs/ files
```

### CI/CD Updates
```yaml
# Update railway.json, nixpacks.toml
# Update any GitHub Actions workflows
# Update deployment scripts
```

---

## 📊 Benefits of Organization

### Developer Experience
- **Clear Purpose**: Easy to find scripts by function
- **Reduced Clutter**: Clean root directory
- **Better Onboarding**: New developers can navigate easily
- **Logical Grouping**: Related scripts together

### Maintenance
- **Easier Updates**: Know where to find/update scripts
- **Better Testing**: Test scripts grouped together
- **Documentation**: Guides grouped with related scripts
- **Version Control**: Cleaner git history

### Security
- **Permission Management**: Can set folder-level permissions
- **Audit Trail**: Easier to track script changes
- **Isolation**: Separate production from development tools

---

## 🚨 Migration Risks & Mitigation

### Potential Issues
1. **Broken References**: Scripts calling other scripts
2. **CI/CD Failures**: Hardcoded paths in deployment
3. **Documentation Links**: Broken internal links
4. **Import Paths**: Relative imports in Node.js scripts

### Mitigation Strategy
1. **Audit First**: Grep for all script references
2. **Update Incrementally**: One category at a time
3. **Test After Each Move**: Verify functionality
4. **Keep Symlinks**: Temporary backwards compatibility
5. **Update Documentation**: Immediately after moves

---

## 🎯 Success Criteria

### Completion Checklist
- [ ] All scripts moved to appropriate folders
- [ ] No broken references in codebase
- [ ] Package.json scripts updated
- [ ] Documentation updated
- [ ] CI/CD still functioning
- [ ] All tests still pass
- [ ] Developer onboarding guide updated

### Post-Migration Validation
```bash
# Test key workflows
npm run deploy
npm run test:integration
npm run validate:payments

# Check for broken imports
grep -r "require.*\.js" packages/
grep -r "import.*\.js" packages/

# Verify no orphaned files
find . -name "*.js" -not -path "./node_modules/*" -not -path "./packages/*/node_modules/*"
```

---

*This organization will create a much cleaner, more maintainable codebase structure for ABC_DAO.*