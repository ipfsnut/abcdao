# ABC DAO Social Media Automation Guide

## Overview
ABC DAO uses automated social media posting to grow the @abc-dao-dev Farcaster account and build a beginner-friendly coding community. This system posts curated content designed to attract new developers and provide value to the learn-to-earn ecosystem.

## Campaign Focus
**Target Audience**: Complete coding beginners, career changers, students
**Message**: Learn-to-earn - get rewarded while learning to code
**Positioning**: Fair-launched, beginner-friendly web3 coding community

## Content Strategy

### Launch Phase Content (Priority Posts)
Use these first to establish the account and messaging:

1. **Learn-to-Earn Intro** (`launch-1`)
   - Explains the core value proposition
   - Specific instructions: "join the DAO, create a GitHub repo, add it to the app, make your first commit"
   - Hooks with "What if learning to code actually paid you?"

2. **Beginner Welcome** (`launch-2`) 
   - Addresses pain point: "Tired of learning for free?"
   - Lists benefits: no experience required, earn from day one, growing community
   - Emphasizes fairness and accessibility

3. **Fair Launch Explanation** (`launch-3`)
   - Builds trust: no VCs, no insider deals, community-owned
   - Positions against traditional unfair launches
   - Values: accessible, immediately rewarding, community-driven

### Daily Recurring Content
**Monday - Motivation Monday**: Inspirational content for new coders
**Tuesday - Tutorial Tuesday**: Step-by-step guides and instructions  
**Wednesday - Wednesday Wins**: Celebrate community achievements
**Thursday - Learning Resources**: Free educational tools and links
**Friday - Community Highlight**: Showcase community growth and engagement
**Saturday - Coding Tips**: Practical advice for beginners
**Sunday - Reflection**: Weekly check-in and progress celebration

## Technical Implementation

### Automated Posting Script
**File**: `automated-campaign-posts.js`
**Location**: Project root directory
**Dependencies**: Uses existing `/api/cast/custom` endpoint

### Usage Commands

#### Launch Campaign
```bash
# Post all 3 priority launch posts (2 hours apart)
railway run node automated-campaign-posts.js launch
```

#### Daily Operations
```bash
# Check today's scheduled content
railway run node automated-campaign-posts.js today

# Post today's content automatically
railway run node automated-campaign-posts.js today --post
```

#### Manual Posting
```bash
# Post specific content by ID
railway run node automated-campaign-posts.js post launch-1
railway run node automated-campaign-posts.js post motivation-monday

# List all available posts
railway run node automated-campaign-posts.js list
```

### Content Management

#### Adding New Posts
Edit `automated-campaign-posts.js` and add to the `posts` array:
```javascript
{
  id: "new-post-id",
  content: "Your cast content here...",
  schedule: "weekly", // or priority: "high"
  day: "monday" // for weekly posts
}
```

#### Updating Existing Content
Find the post by `id` in the `posts` array and modify the `content` field.

#### Scheduling Options
- `priority: "high"` - For launch/important posts
- `priority: "medium"` - For general promotional content  
- `schedule: "weekly", day: "monday"` - For recurring daily content

## Content Guidelines

### Always Include
- Clear value proposition for beginners
- Miniapp link: `https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao`
- Relevant hashtags (#LearnToEarn #CodingBeginners #BeginnerFriendly)
- Encouraging, supportive tone

### Never Include
- Fake metrics or user numbers (we're new!)
- Intimidating jargon or assumptions of prior knowledge
- Promises that seem too good to be true
- Pressure tactics or urgency manipulation

### Messaging Principles
- **Honesty**: We're a new, fair-launched community
- **Accessibility**: No experience required, everyone welcome
- **Support**: Community-driven learning and help
- **Recognition**: Every small step deserves rewards
- **Growth**: Focus on learning journey, not just end results

## Automation Setup

### Prerequisites
- `ADMIN_SECRET` environment variable set in Railway
- ABC DEV Farcaster account credentials configured
- Custom cast endpoint active at `/api/cast/custom`

### Daily Automation (Recommended)
Set up a daily cron job or scheduled task:
```bash
# Add to crontab for daily posting at 10 AM
0 10 * * * cd /path/to/abc-dao && railway run node automated-campaign-posts.js today --post
```

### Launch Sequence
Run once to post all priority content:
```bash
railway run node automated-campaign-posts.js launch
```

## Monitoring and Analytics

### Success Metrics
- **Follower growth rate**: Target 10-20% weekly growth
- **Engagement rate**: Likes, recasts, replies per post
- **Miniapp clicks**: Track traffic to the Farcaster miniapp
- **New developer signups**: Monitor registrations from social traffic
- **Community interaction**: Questions, help requests, sharing wins

### Content Performance
- Monitor which daily themes get the most engagement
- Track which types of posts drive the most miniapp visits
- Note which hashtags perform best
- Identify optimal posting times for your audience

### Adjustments
- Replace low-performing content with variations
- Amplify successful post formats
- Adjust posting frequency based on engagement
- Evolve messaging based on community feedback

## Content Calendar Integration

### Weekly Planning
- **Monday**: Plan week's custom content and community highlights
- **Tuesday**: Prepare educational resources and tutorials
- **Wednesday**: Collect community wins and achievements to celebrate
- **Thursday**: Curate new learning resources and tools
- **Friday**: Compile community metrics and growth stats
- **Saturday**: Develop new tips and practical advice
- **Sunday**: Reflect on week's performance and plan improvements

### Monthly Reviews
- Analyze follower growth and engagement trends
- Update content based on community feedback
- Refresh messaging if needed
- Plan special campaigns or events
- Review and update automation scripts

## Integration with ABC DAO Features

### Coordinate with Other Bots
- **@abc-dao-commits**: Handles individual commit announcements
- **@abc-dao-dev**: Handles ecosystem updates and community building
- Ensure consistent messaging across accounts

### Leverage Platform Features
- **Daily stats posts**: Coordinate with automated treasury/staking updates
- **Community highlights**: Use real data from user achievements
- **Feature announcements**: Promote new platform capabilities

### Cross-Promotion
- Share successful posts on other social platforms
- Include social media content in newsletter
- Reference in documentation and onboarding materials

## Troubleshooting

### Common Issues
1. **Posts not publishing**: Check ADMIN_SECRET and network connectivity
2. **Content too long**: Farcaster has character limits, keep posts concise
3. **Low engagement**: Review timing, hashtags, and content relevance
4. **Duplicate posts**: Check for running multiple instances of script

### Error Handling
- Script includes error logging and retry logic
- Failed posts can be manually retried using `post` command
- Check Railway logs for detailed error information

### Content Quality
- Test posts manually before automation
- Review community feedback regularly
- Update messaging based on platform changes
- Keep content fresh and relevant to current events

---

*This automation system is designed to grow ABC DAO's social presence while maintaining authentic, helpful communication with the coding community. Regular monitoring and adjustment ensure continued effectiveness.*