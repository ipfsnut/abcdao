// Automated Campaign Posting for @abc-dao-dev
// Run this script to schedule beginner-focused content

const posts = [
  // INITIAL LAUNCH POSTS (use first)
  {
    id: "launch-1",
    content: `💡 What if learning to code actually paid you?

ABC DAO is a fair-launched community where beginners earn $ABC tokens while learning.

• Write your first "Hello World" → Earn tokens (yes, really! - just join the DAO, create a GitHub repo, add it to the app, and make your first commit!)

https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao

#LearnToEarn #CodingBeginners`,
    priority: "high"
  },

  {
    id: "launch-2", 
    content: `🌱 CALLING ALL CODING BEGINNERS

Tired of learning for free with no immediate rewards?

ABC DAO is designed for people just getting started:

✅ No experience required
✅ Earn tokens from day one
✅ Growing community  
✅ Every small win counts
✅ Fair-launched for everyone

Your coding journey should be rewarded from the very first line.

Start earning while you learn: https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao`,
    priority: "high"
  },

  {
    id: "launch-3",
    content: `🚀 ABC DAO is FAIR-LAUNCHED

What does this mean?
• No VCs got special deals
• No insiders got early access
• Community-owned from day one

We believe coding education should be:
- Accessible to all
- Immediately rewarding  
- Community-driven

Join our learn-to-earn movement: https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao

#FairLaunch #CodingCommunity`,
    priority: "high"
  },

  {
    id: "learning-journey",
    content: `📚 YOUR CODING LEARNING JOURNEY, REWARDED

Day 1: Learn variables → Commit "my first variable" → Earn tokens ✨
Week 1: Build a calculator → Commit "basic calculator" → Earn tokens ✨  
Month 1: Create your first app → Commit "my first app" → Earn tokens ✨
Month 3: Contribute to open source → Commit → Earn tokens ✨

Every step forward deserves recognition.

Start your rewarded learning: https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao`,
    priority: "medium"
  },

  {
    id: "no-experience",
    content: `❓ "Can I join ABC DAO if I've never coded before?"

YES! 🎉

Our community is designed for:
• Complete beginners
• Career changers  
• Students learning to code
• Anyone curious about programming

Your first commit matters just as much as your 1000th.

Ready to start your coding journey? https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao`,
    priority: "medium"
  },

  // DAILY RECURRING CONTENT
  {
    id: "motivation-monday",
    content: `🌟 MOTIVATION MONDAY for new coders

"Every expert was once a beginner."

Your first "Hello World" is worth celebrating.
Your first bug fix deserves recognition.
Your first project earns rewards.

ABC DAO makes sure every step forward counts.

What coding goal will you tackle this week? 👇

#MotivationMonday #BeginnerCoder`,
    schedule: "weekly",
    day: "monday"
  },

  {
    id: "tutorial-tuesday",
    content: `📚 TUTORIAL TUESDAY: Your First Commit

Never made a commit before? Here's how to earn your first tokens:

1️⃣ Create a file called "hello.txt"
2️⃣ Write "Hello, ABC DAO!" inside
3️⃣ Save and commit with message "My first commit"
4️⃣ Push to GitHub
5️⃣ Earn your first $ABC tokens! 🎉

Every journey starts with one step.

Questions? Ask below! 👇

#TutorialTuesday #FirstCommit`,
    schedule: "weekly",
    day: "tuesday"
  },

  {
    id: "wednesday-wins",
    content: `🏆 WEDNESDAY WINS

Celebrating our beginner coders this week:

"Made my first HTML page!" 🎉
"Fixed my first bug (missing semicolon)!" 💪  
"Completed my first tutorial!" 📚
"Earned tokens on day one!" ✨

Every win matters, no matter how small.

Share your coding win below! 👇

#WednesdayWins #BeginnerPride`,
    schedule: "weekly", 
    day: "wednesday"
  },

  {
    id: "thursday-resources",
    content: `📖 THURSDAY LEARNING RESOURCES

Free resources perfect for ABC DAO beginners:

🔗 FreeCodeCamp - Interactive lessons
🔗 Codecademy - Guided projects
🔗 MDN Web Docs - HTML/CSS/JS basics
🔗 GitHub Learning Lab - Git basics

Remember: Every tutorial you complete can become a rewarded commit!

What's your favorite learning resource? 👇

#ThursdayResources #LearnToCode`,
    schedule: "weekly",
    day: "thursday"
  },

  {
    id: "friday-highlight", 
    content: `💫 FRIDAY COMMUNITY HIGHLIGHT

This week in our beginner-friendly community:

📈 New coders joined: Welcome everyone!
🎯 First commits made: So proud!
💡 Questions answered by community: Amazing!
🏆 Beginner projects completed: Inspiring!

ABC DAO is built on helping each other grow.

Who helped you code this week? Tag them! 👇

#FridayHighlight #Community`,
    schedule: "weekly",
    day: "friday"
  },

  {
    id: "saturday-tips",
    content: `💡 SATURDAY CODING TIPS

Beginner tip: Start small and commit often!

Instead of building a huge project:
✅ Make one small feature
✅ Commit it immediately  
✅ Earn tokens for progress
✅ Build the next small piece

Small steps = steady progress = consistent rewards

What small thing will you code today? 👇

#SaturdayTips #CodingWisdom`,
    schedule: "weekly",
    day: "saturday"
  },

  {
    id: "sunday-reflection",
    content: `🌅 SUNDAY REFLECTION

End of week check-in for beginners:

• What did you learn this week?
• What challenges did you overcome?
• What are you proud of?
• What tokens did you earn?

Every line of code is progress.
Every commit is growth.
Every week you're better than before.

Keep going! 💪

#SundayReflection #Progress`,
    schedule: "weekly",
    day: "sunday"
  }
];

// Manual posting function
async function postCast(message, adminKey) {
  try {
    const response = await fetch('https://abcdao-production.up.railway.app/api/cast/custom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey
      },
      body: JSON.stringify({
        customMessage: message
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Cast posted successfully: ${result.castHash}`);
      console.log(`🔗 Cast URL: ${result.castUrl}`);
      return result;
    } else {
      console.error('❌ Cast failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    return null;
  }
}

// Post high priority launch content first
async function postLaunchSequence(adminKey) {
  console.log('🚀 Starting launch sequence...');
  
  const launchPosts = posts.filter(p => p.priority === 'high');
  
  for (let i = 0; i < launchPosts.length; i++) {
    const post = launchPosts[i];
    console.log(`\n📢 Posting launch content ${i + 1}/${launchPosts.length}: ${post.id}`);
    
    const result = await postCast(post.content, adminKey);
    
    if (result) {
      console.log('✅ Posted successfully');
    }
    
    // Wait 2 hours between launch posts to avoid spam
    if (i < launchPosts.length - 1) {
      console.log('⏳ Waiting 2 hours before next post...');
      await new Promise(resolve => setTimeout(resolve, 2 * 60 * 60 * 1000));
    }
  }
  
  console.log('🎉 Launch sequence complete!');
}

// Post a single cast by ID
async function postById(id, adminKey) {
  const post = posts.find(p => p.id === id);
  
  if (!post) {
    console.error(`❌ Post with id "${id}" not found`);
    return;
  }
  
  console.log(`📢 Posting: ${post.id}`);
  const result = await postCast(post.content, adminKey);
  
  if (result) {
    console.log('✅ Posted successfully');
  }
}

// Get today's scheduled post
function getTodaysPost() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  
  const todaysPost = posts.find(p => p.schedule === 'weekly' && p.day === today);
  
  if (todaysPost) {
    console.log(`📅 Today's post (${today}): ${todaysPost.id}`);
    console.log(todaysPost.content);
  } else {
    console.log(`📅 No scheduled post for ${today}`);
  }
  
  return todaysPost;
}

// List all available posts
function listPosts() {
  console.log('📋 Available posts:');
  posts.forEach(post => {
    const schedule = post.schedule ? `(${post.schedule} - ${post.day})` : `(${post.priority || 'one-time'})`;
    console.log(`- ${post.id} ${schedule}`);
  });
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    posts,
    postCast,
    postLaunchSequence,
    postById,
    getTodaysPost,
    listPosts
  };
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const adminKey = process.env.ADMIN_SECRET;
  
  if (!adminKey) {
    console.error('❌ ADMIN_SECRET environment variable required');
    process.exit(1);
  }
  
  switch (command) {
    case 'launch':
      postLaunchSequence(adminKey);
      break;
      
    case 'post':
      const id = args[1];
      if (!id) {
        console.error('❌ Post ID required. Usage: node script.js post <post-id>');
        listPosts();
        process.exit(1);
      }
      postById(id, adminKey);
      break;
      
    case 'today':
      const todaysPost = getTodaysPost();
      if (todaysPost && args[1] === '--post') {
        postById(todaysPost.id, adminKey);
      }
      break;
      
    case 'list':
      listPosts();
      break;
      
    default:
      console.log(`
📋 ABC DAO Campaign Posting Tool

Usage:
  node automated-campaign-posts.js launch     # Post all high-priority launch content
  node automated-campaign-posts.js post <id>  # Post specific content by ID  
  node automated-campaign-posts.js today      # Show today's scheduled post
  node automated-campaign-posts.js today --post # Post today's scheduled content
  node automated-campaign-posts.js list       # List all available posts

Examples:
  node automated-campaign-posts.js post launch-1
  node automated-campaign-posts.js post motivation-monday
  node automated-campaign-posts.js today --post
      `);
  }
}