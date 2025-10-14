# ABC DAO Repository Integration Guide

## 🎯 Enable $ABC Rewards for Your Repository

This guide shows repository owners how to integrate with ABC DAO's reward system to automatically reward contributors with $ABC tokens for their commits.

## 📋 Prerequisites

### For Repository Owners:
- Repository must be **public** on GitHub
- Admin access to repository settings
- ABC DAO webhook secret (contact team)

### For Contributors:
- Must be ABC DAO members (paid membership + GitHub linked)
- GitHub account linked at https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao

## ⚙️ Setup Instructions

### Step 1: Add ABC DAO Webhook

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Webhooks**
3. Click **Add webhook**
4. Configure the webhook:

```
Payload URL: https://abcdao-production.up.railway.app/api/webhooks/github
Content type: application/json
Secret: [Contact ABC DAO team for webhook secret]
Events: Select "Push events"
Active: ✅ Checked
```

5. Click **Add webhook**

### Step 2: Verify Integration

After setup, make a test commit. If successful, you should see:
- ✅ Webhook delivery in GitHub webhook logs  
- ✅ Bot cast on Farcaster announcing the commit (if contributor is ABC DAO member)
- ✅ Reward recorded in ABC DAO system

## 💰 How Rewards Work

### Automatic Reward Calculation
- **Base reward**: Calculated per commit
- **Bonus multipliers**: Applied for priority commits, quality contributions
- **Distribution**: Rewards added to contributor's claimable balance

### Commit Tags (Optional)
Contributors can add special tags to commit messages for bonus rewards:

```bash
git commit -m "Fix user authentication bug #priority"
git commit -m "Add new feature #milestone" 
git commit -m "Update documentation #docs"
```

### Bot Announcements
When ABC DAO members commit to integrated repositories:
- 🤖 **Bot posts on Farcaster** announcing the contribution
- 📊 **Reward amount** is publicly displayed
- 🔗 **Links** to commit and contributor profile

## 👥 Member Management

### Current ABC DAO Members
Contributors with GitHub linked and ready to earn rewards:
- **4 active developers** currently earning rewards
- **3 pending members** need to complete GitHub linking

### Adding New Contributors
1. **Join ABC DAO**: Pay 0.002 ETH membership fee
2. **Link GitHub**: Connect account at ABC DAO miniapp
3. **Start contributing**: Commits to integrated repos automatically earn rewards

## 🔧 Technical Details

### Webhook Events Processed
- **Push events**: New commits to main/master branches
- **Commit data**: Author, message, repository, timestamp
- **Filtering**: Only processes commits from ABC DAO members

### Reward Calculation Factors
- **Commit size**: Lines changed, files modified
- **Repository importance**: Multiplier based on project significance  
- **Contribution quality**: Manual review for bonus rewards
- **Time factors**: Recent activity bonuses

### Smart Contract Integration
- **$ABC Token**: ERC-20 token on Base blockchain
- **Reward distribution**: Automated through smart contracts
- **Claiming**: Contributors claim accumulated rewards via interface

## 📞 Support & Contact

### Getting Started
- **Webhook secret**: Contact ABC DAO team on Farcaster
- **Integration help**: Ask in ABC DAO channels
- **Technical issues**: Report via GitHub or Farcaster

### For Contributors
- **Join ABC DAO**: https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao
- **Check rewards**: View earned balance in miniapp
- **Claim tokens**: Use built-in claiming interface

## 📊 Repository Benefits

### For Project Owners
- ✅ **Incentivized contributions** from ABC DAO community
- ✅ **Automatic contributor rewards** without manual overhead
- ✅ **Social promotion** via bot casts on Farcaster
- ✅ **Quality developers** attracted by reward system

### For Contributors  
- ✅ **Earn $ABC tokens** for valuable contributions
- ✅ **Recognition** through public bot announcements
- ✅ **Governance participation** in ABC DAO decisions
- ✅ **Staking rewards** by holding $ABC tokens

## 🚀 Example Integration

### Sample Repository Setup
```bash
# Repository: awesome-project
# Owner: alice
# Webhook: ✅ Configured
# ABC DAO member: bob (GitHub: @bob-dev)

# Bob makes a commit:
git commit -m "Add new API endpoint #priority"
git push origin main

# Results:
# 1. Webhook triggers ABC DAO backend
# 2. System recognizes @bob-dev as ABC DAO member  
# 3. Calculates reward (base + priority bonus)
# 4. Bot posts: "🎉 @bob earned 150 $ABC for priority commit to awesome-project!"
# 5. Reward added to Bob's claimable balance
```

## 🎯 Next Steps

1. **Contact ABC DAO team** for webhook secret
2. **Add webhook** to your repository
3. **Test integration** with a commit
4. **Promote to contributors** about ABC DAO membership benefits
5. **Monitor rewards** and celebrate your contributors!

---

**Ready to reward your contributors? Set up ABC DAO integration today!**

*Contact: ABC DAO team on Farcaster | Miniapp: https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao*