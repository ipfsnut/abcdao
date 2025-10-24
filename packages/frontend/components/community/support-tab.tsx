/**
 * Support Tab Component
 * 
 * Help documentation, FAQ, and support ticket system
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SupportTabProps {
  user: any;
  supportTickets: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'getting-started' | 'earning' | 'staking' | 'technical';
  helpful: number;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created: string;
  lastUpdate: string;
}

export function SupportTab({ user, supportTickets }: SupportTabProps) {
  const [activeSection, setActiveSection] = useState<'help' | 'faq' | 'contact' | 'tickets'>('help');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: ''
  });

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I start earning ABC tokens?',
      answer: 'Connect your GitHub account in the Developer Hub, enable your repositories, and start making meaningful commits. Each commit is automatically analyzed and rewarded based on complexity, quality, and impact.',
      category: 'getting-started',
      helpful: 45
    },
    {
      id: '2',
      question: 'What types of commits earn the most rewards?',
      answer: 'Feature implementations, bug fixes, and well-documented code changes earn the highest rewards. Commits in TypeScript, Rust, and Go typically receive bonus multipliers. Quality matters more than quantity.',
      category: 'earning',
      helpful: 38
    },
    {
      id: '3',
      question: 'How does ABC token staking work?',
      answer: 'Stake your ABC tokens to earn ETH rewards from protocol fees. Staking is non-custodial, rewards are distributed daily, and you can unstake anytime (with a 7-day cooldown period).',
      category: 'staking',
      helpful: 32
    },
    {
      id: '4',
      question: 'Why aren\'t my commits being rewarded?',
      answer: 'Commits must be meaningful and substantial. Very small changes, merge commits, and commits to non-enabled repositories won\'t earn rewards. Check your repository settings in the Developer Hub.',
      category: 'technical',
      helpful: 29
    },
    {
      id: '5',
      question: 'How do I increase my staking rewards?',
      answer: 'Stake more $ABC tokens to earn a larger share of ETH rewards. The rewards are distributed proportionally based on your stake size.',
      category: 'staking',
      helpful: 24
    }
  ];

  const mockTickets: SupportTicket[] = [
    {
      id: 'T-001',
      subject: 'Repository not detecting commits',
      status: 'in-progress',
      priority: 'medium',
      created: '2024-01-20',
      lastUpdate: '2024-01-21'
    }
  ];

  const helpSections = [
    {
      title: 'Getting Started',
      icon: '🚀',
      description: 'New to ABC DAO? Start here',
      links: [
        { label: 'Wallet Setup Guide', url: '/docs/wallet-setup' },
        { label: 'Connect GitHub', url: '/docs/github-setup' },
        { label: 'Your First Rewards', url: '/docs/first-rewards' },
        { label: 'Understanding Scoring', url: '/docs/scoring' }
      ]
    },
    {
      title: 'Developer Guides',
      icon: '💻',
      description: 'Maximize your earning potential',
      links: [
        { label: 'Repository Management', url: '/docs/repositories' },
        { label: 'Commit Best Practices', url: '/docs/commits' },
        { label: 'Language Bonuses', url: '/docs/languages' },
        { label: 'Analytics Dashboard', url: '/docs/analytics' }
      ]
    },
    {
      title: 'Staking & Rewards',
      icon: '🏦',
      description: 'Stake tokens and earn ETH',
      links: [
        { label: 'How Staking Works', url: '/docs/staking' },
        { label: 'Claiming Rewards', url: '/docs/claiming' },
        { label: 'Unstaking Process', url: '/docs/unstaking' },
        { label: 'APY Calculations', url: '/docs/apy' }
      ]
    },
    {
      title: 'Troubleshooting',
      icon: '🔧',
      description: 'Common issues and solutions',
      links: [
        { label: 'Commit Not Rewarded', url: '/docs/commit-issues' },
        { label: 'Wallet Connection Problems', url: '/docs/wallet-issues' },
        { label: 'Transaction Failures', url: '/docs/tx-issues' },
        { label: 'Performance Issues', url: '/docs/performance' }
      ]
    }
  ];

  const categories = [
    { value: 'all', label: 'All Topics' },
    { value: 'getting-started', label: 'Getting Started' },
    { value: 'earning', label: 'Earning Tokens' },
    { value: 'staking', label: 'Staking' },
    { value: 'technical', label: 'Technical' },
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setContactForm({ subject: '', category: 'general', priority: 'medium', message: '' });
      alert('Support ticket created successfully!');
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'open': 'text-blue-400 bg-blue-950/20',
      'in-progress': 'text-yellow-400 bg-yellow-950/20',
      'resolved': 'text-green-400 bg-green-950/20',
      'closed': 'text-gray-400 bg-gray-950/20'
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'text-blue-400',
      'medium': 'text-yellow-400',
      'high': 'text-red-400'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="space-y-6">
      {/* Support Navigation */}
      <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-green-400 mb-4">🛟 How can we help you?</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: 'help', label: 'Documentation', icon: '📚', description: 'Guides and tutorials' },
            { id: 'faq', label: 'FAQ', icon: '❓', description: 'Common questions' },
            { id: 'contact', label: 'Contact Support', icon: '📧', description: 'Get help from our team' },
            { id: 'tickets', label: 'My Tickets', icon: '🎫', description: `${mockTickets.length} active` }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-green-950/20 border-green-700/50 text-green-400'
                  : 'bg-black/20 border-green-900/30 text-green-600 hover:border-green-700/30 hover:text-green-400'
              }`}
            >
              <div className="text-2xl mb-2">{section.icon}</div>
              <div className="font-semibold font-mono text-sm mb-1">{section.label}</div>
              <div className="text-xs opacity-80">{section.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Help Documentation */}
      {activeSection === 'help' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {helpSections.map((section, i) => (
            <div key={i} className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{section.icon}</span>
                <div>
                  <h4 className="text-lg font-bold text-green-400">{section.title}</h4>
                  <p className="text-sm text-green-600">{section.description}</p>
                </div>
              </div>
              
              <ul className="space-y-2">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <Link
                      href={link.url}
                      className="text-sm text-green-600 hover:text-green-400 transition-colors flex items-center gap-2"
                    >
                      <span>→</span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* FAQ Section */}
      {activeSection === 'faq' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-3 py-1 rounded-lg font-mono text-sm transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                    : 'bg-black/40 text-green-600 border border-green-900/30 hover:text-green-400'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          
          {/* FAQ List */}
          <div className="space-y-3">
            {filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className="bg-green-950/20 border border-green-900/30 rounded-lg transition-all duration-200"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-green-950/10 transition-colors"
                >
                  <span className="font-semibold text-green-400 font-mono text-sm">
                    {faq.question}
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${
                      expandedFAQ === faq.id ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {expandedFAQ === faq.id && (
                  <div className="px-4 pb-4 border-t border-green-900/20">
                    <p className="text-sm text-green-600 mt-3 mb-4">
                      {faq.answer}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-green-700">
                      <span>Category: {faq.category.replace('-', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <span>👍 {faq.helpful} found this helpful</span>
                        <button className="text-green-600 hover:text-green-400 transition-colors">
                          Helpful?
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Support */}
      {activeSection === 'contact' && (
        <div className="max-w-2xl">
          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
            <h4 className="text-lg font-bold text-green-400 mb-4">📧 Contact Support</h4>
            
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-green-600 mb-2">Subject</label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
                  className="w-full bg-black/40 border border-green-900/50 rounded-lg px-3 py-2 text-green-400 font-mono focus:outline-none focus:border-green-700/50"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-mono text-green-600 mb-2">Category</label>
                  <select
                    value={contactForm.category}
                    onChange={(e) => setContactForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-black/40 border border-green-900/50 rounded-lg px-3 py-2 text-green-400 font-mono focus:outline-none focus:border-green-700/50"
                  >
                    <option value="general">General Question</option>
                    <option value="technical">Technical Issue</option>
                    <option value="account">Account Problem</option>
                    <option value="earning">Earning Issue</option>
                    <option value="staking">Staking Issue</option>
                    <option value="bug">Bug Report</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-mono text-green-600 mb-2">Priority</label>
                  <select
                    value={contactForm.priority}
                    onChange={(e) => setContactForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full bg-black/40 border border-green-900/50 rounded-lg px-3 py-2 text-green-400 font-mono focus:outline-none focus:border-green-700/50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-mono text-green-600 mb-2">Message</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Please provide detailed information about your issue..."
                  rows={6}
                  className="w-full bg-black/40 border border-green-900/50 rounded-lg px-3 py-2 text-green-400 font-mono focus:outline-none focus:border-green-700/50"
                  required
                ></textarea>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-green-600">
                  We typically respond within 24 hours
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-900/50 text-green-400 rounded-lg font-mono font-bold hover:bg-green-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? '📤 Sending...' : '📤 Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Support Tickets */}
      {activeSection === 'tickets' && (
        <div className="space-y-4">
          {mockTickets.length === 0 ? (
            <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🎫</div>
              <h4 className="text-lg font-bold text-green-400 mb-2">No Support Tickets</h4>
              <p className="text-sm text-green-600 font-mono">
                You don't have any open support tickets. If you need help, feel free to contact us!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mockTickets.map((ticket) => (
                <div key={ticket.id} className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-green-400 text-sm">#{ticket.id}</span>
                        <span className={`px-2 py-1 rounded text-xs font-mono ${getStatusColor(ticket.status)}`}>
                          {ticket.status.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-mono ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      </div>
                      
                      <h5 className="font-semibold text-green-400 mb-2">{ticket.subject}</h5>
                      
                      <div className="flex items-center gap-4 text-xs text-green-600">
                        <span>Created: {ticket.created}</span>
                        <span>Updated: {ticket.lastUpdate}</span>
                      </div>
                    </div>
                    
                    <button className="text-green-600 hover:text-green-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-green-950/20 via-blue-950/20 to-purple-950/20 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4">⚡ Quick Actions</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Live Chat', action: () => window.open('https://discord.gg/abcdao', '_blank'), icon: '💬' },
            { label: 'Video Tutorials', action: () => {}, icon: '🎥' },
            { label: 'Feature Request', action: () => {}, icon: '💡' },
            { label: 'Bug Report', action: () => setActiveSection('contact'), icon: '🐛' }
          ].map((action, i) => (
            <button
              key={i}
              onClick={action.action}
              className="p-3 bg-black/40 border border-green-900/30 rounded-lg text-center hover:border-green-700/50 hover:bg-green-950/10 transition-all duration-200 group"
            >
              <div className="text-lg mb-1">{action.icon}</div>
              <div className="text-xs font-mono text-green-600 group-hover:text-green-400 transition-colors">
                {action.label}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}