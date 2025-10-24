import express from 'express';
import { getPool } from '../services/database.js';

const router = express.Router();

/**
 * Support System API Routes
 * 
 * Provides support ticket management and FAQ functionality
 */

// Test route to verify mounting
router.get('/test', (req, res) => {
  res.json({ 
    status: 'support routes are working', 
    timestamp: new Date().toISOString(),
    manager: 'SupportSystemAPI'
  });
});

/**
 * GET /api/support/tickets/:walletAddress
 * Returns support tickets for a specific user
 */
router.get('/tickets/:walletAddress', async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress;
    const status = req.query.status || 'all'; // all, open, closed, pending
    const limit = parseInt(req.query.limit) || 20;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Missing wallet address' 
      });
    }
    
    // Generate mock tickets based on user activity
    const tickets = await generateUserTickets(walletAddress, status, limit);
    
    res.json({
      tickets,
      count: tickets.length,
      status,
      limit,
      walletAddress,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

/**
 * POST /api/support/tickets
 * Creates a new support ticket
 */
router.post('/tickets', async (req, res) => {
  try {
    const { walletAddress, subject, description, category, priority } = req.body;
    
    if (!walletAddress || !subject || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['walletAddress', 'subject', 'description']
      });
    }

    // For now, just return success with mock ticket ID
    const ticketId = `TICKET-${Date.now()}`;
    
    res.json({
      success: true,
      ticketId,
      subject,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open',
      createdAt: new Date().toISOString(),
      estimatedResponse: '24 hours'
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

/**
 * GET /api/support/faq
 * Returns frequently asked questions
 */
router.get('/faq', async (req, res) => {
  try {
    const category = req.query.category || 'all';
    const search = req.query.search || '';
    
    const faqItems = await getFAQItems(category, search);
    
    res.json({
      faq: faqItems,
      category,
      search,
      count: faqItems.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({ error: 'Failed to fetch FAQ' });
  }
});

/**
 * GET /api/support/categories
 * Returns available support categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      {
        id: 'earning',
        name: 'Earning & Rewards',
        description: 'Questions about earning ABC tokens and rewards',
        icon: '💰',
        count: 45
      },
      {
        id: 'staking',
        name: 'Staking',
        description: 'Staking ABC tokens and earning ETH rewards',
        icon: '🔒',
        count: 32
      },
      {
        id: 'repositories',
        name: 'Repository Setup',
        description: 'Connecting and managing GitHub repositories',
        icon: '📁',
        count: 28
      },
      {
        id: 'payments',
        name: 'Payments & Membership',
        description: 'Membership payments and wallet issues',
        icon: '💳',
        count: 21
      },
      {
        id: 'technical',
        name: 'Technical Issues',
        description: 'Bug reports and technical problems',
        icon: '🔧',
        count: 15
      },
      {
        id: 'general',
        name: 'General',
        description: 'Other questions and feedback',
        icon: '❓',
        count: 12
      }
    ];
    
    res.json({
      categories,
      count: categories.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching support categories:', error);
    res.status(500).json({ error: 'Failed to fetch support categories' });
  }
});

// Helper function to generate user support tickets
async function generateUserTickets(walletAddress, status, limit) {
  const pool = getPool();
  const tickets = [];
  
  try {
    // Get user info for context
    const userResult = await pool.query(`
      SELECT id, github_username, membership_status, total_commits
      FROM users 
      WHERE wallet_address = $1
    `, [walletAddress]);
    
    if (userResult.rows.length === 0) {
      return []; // User not found
    }
    
    const user = userResult.rows[0];
    
    // Generate contextual mock tickets based on user status
    if (user.membership_status !== 'active') {
      tickets.push({
        id: 'TICKET-MEMBERSHIP-001',
        subject: 'Membership Payment Not Processed',
        description: 'I sent the membership payment but my account is still not active.',
        category: 'payments',
        priority: 'high',
        status: 'open',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        responses: 2,
        assignedTo: 'Support Team'
      });
    }
    
    if (user.total_commits > 0 && user.total_commits < 10) {
      tickets.push({
        id: 'TICKET-EARNING-001',
        subject: 'Not Receiving ABC Tokens for Commits',
        description: 'I\'ve made several commits but I\'m not seeing any ABC token rewards in my dashboard.',
        category: 'earning',
        priority: 'medium',
        status: 'closed',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        lastUpdated: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        responses: 3,
        assignedTo: 'Technical Team',
        resolution: 'Repository was not properly connected. Issue resolved after re-linking GitHub account.'
      });
    }
    
    // Filter by status if specified
    if (status !== 'all') {
      return tickets.filter(ticket => ticket.status === status).slice(0, limit);
    }
    
    return tickets.slice(0, limit);
    
  } catch (error) {
    console.error('Error generating user tickets:', error);
    return [];
  }
}

// Helper function to get FAQ items
async function getFAQItems(category, search) {
  const allFAQ = [
    {
      id: 'faq-001',
      question: 'How do I start earning ABC tokens?',
      answer: 'To start earning ABC tokens, you need to: 1) Pay the 0.002 ETH membership fee, 2) Connect your GitHub account, 3) Add your repositories to the platform, 4) Start making commits to your registered repositories. Each quality commit can earn you thousands of ABC tokens based on our reward algorithm.',
      category: 'earning',
      tags: ['getting-started', 'tokens', 'membership'],
      helpful: 89,
      views: 245
    },
    {
      id: 'faq-002',
      question: 'How is the ABC token reward amount calculated?',
      answer: 'ABC token rewards are calculated based on several factors including: commit size and complexity, repository activity level, code quality metrics, programming language bonuses (TypeScript gets 25% bonus), and your current streak. The base reward ranges from 1,000 to 10,000 ABC tokens per commit.',
      category: 'earning',
      tags: ['rewards', 'algorithm', 'calculation'],
      helpful: 67,
      views: 189
    },
    {
      id: 'faq-003',
      question: 'How do I stake ABC tokens and earn ETH?',
      answer: 'Visit the Staking tab in your dashboard, enter the amount of ABC tokens you want to stake, and confirm the transaction. Staked tokens earn you a share of the protocol\'s ETH revenue, distributed daily. Current APY is around 12-15%. You can unstake anytime with a 7-day unbonding period.',
      category: 'staking',
      tags: ['staking', 'eth-rewards', 'apy'],
      helpful: 78,
      views: 156
    },
    {
      id: 'faq-004',
      question: 'Why aren\'t my repositories showing up?',
      answer: 'Make sure you\'ve properly connected your GitHub account and granted the necessary permissions. Only public repositories are eligible for rewards. If you recently added repositories, it may take a few minutes for them to appear. Use the repository auto-detection feature to find and add your most active repositories.',
      category: 'repositories',
      tags: ['github', 'repositories', 'connection'],
      helpful: 45,
      views: 123
    },
    {
      id: 'faq-005',
      question: 'I paid the membership fee but my account isn\'t active',
      answer: 'Membership activation usually happens within 10 minutes of payment. Check that you sent exactly 0.002 ETH to the correct address (abcdao.base.eth). If your payment was successful but you\'re still not active after 30 minutes, please contact support with your transaction hash.',
      category: 'payments',
      tags: ['membership', 'payment', 'activation'],
      helpful: 52,
      views: 98
    },
    {
      id: 'faq-006',
      question: 'What programming languages earn bonus rewards?',
      answer: 'Currently, TypeScript commits earn a 25% bonus multiplier due to the value of type-safe code in our ecosystem. We regularly evaluate and update bonus multipliers based on the needs of the protocol and community feedback.',
      category: 'earning',
      tags: ['bonuses', 'typescript', 'languages'],
      helpful: 34,
      views: 87
    },
    {
      id: 'faq-007',
      question: 'How do I track my earning streak?',
      answer: 'Your earning streak is displayed in the Developers dashboard. It tracks consecutive days with at least one rewarded commit. Longer streaks can increase your base reward multiplier. Streaks reset if you go a full day (UTC) without any rewarded commits.',
      category: 'earning',
      tags: ['streak', 'tracking', 'multiplier'],
      helpful: 29,
      views: 76
    },
    {
      id: 'faq-008',
      question: 'When are staking rewards distributed?',
      answer: 'ETH staking rewards are distributed daily around 12:00 PM UTC. The amount depends on your share of the total staked ABC tokens and the protocol\'s revenue for that period. You can track your daily rewards in the Staking dashboard.',
      category: 'staking',
      tags: ['distribution', 'schedule', 'tracking'],
      helpful: 41,
      views: 94
    }
  ];
  
  let filteredFAQ = allFAQ;
  
  // Filter by category
  if (category && category !== 'all') {
    filteredFAQ = filteredFAQ.filter(item => item.category === category);
  }
  
  // Filter by search term
  if (search && search.trim()) {
    const searchLower = search.toLowerCase();
    filteredFAQ = filteredFAQ.filter(item => 
      item.question.toLowerCase().includes(searchLower) ||
      item.answer.toLowerCase().includes(searchLower) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  return filteredFAQ;
}

export default router;