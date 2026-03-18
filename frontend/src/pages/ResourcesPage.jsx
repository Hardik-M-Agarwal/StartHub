import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  PlayCircle, 
  Link, 
  Search, 
  Filter,
  ExternalLink,
  Youtube,
  Globe,
  ArrowRight,
  Star,
  Clock,
  Users,
  TrendingUp,
  Lightbulb,
  Building,
  Target,
  Zap,
  Shield,
  HeartHandshake,
  Download,
  FileText
} from 'lucide-react';

const ResourcesPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Enhanced Resources Data with ACTUAL free book resources
  const resources = {
    books: [
      {
        id: 1,
        title: "The Lean Startup - Free Summary",
        author: "Eric Ries",
        description: "Key principles and methodology for building successful startups - Free PDF summary available",
        category: "startup",
        rating: 4.8,
        year: 2011,
        link: "https://www.pdfdrive.com/the-lean-startup-how-todays-entrepreneurs-use-continuous-innovation-to-create-radically-successful-businesses-e158656853.html",
        format: "Free PDF",
        pages: "45-page summary"
      },
      {
        id: 2,
        title: "Zero to One - Complete Notes",
        author: "Peter Thiel",
        description: "Detailed notes from Peter Thiel's Stanford course on startups and innovation",
        category: "startup",
        rating: 4.7,
        year: 2014,
        link: "https://github.com/ashishpatel26/Zero-to-One-Notes",
        format: "GitHub Repo",
        pages: "Complete notes"
      },
      {
        id: 3,
        title: "The Hard Thing About Hard Things - Free Chapters",
        author: "Ben Horowitz",
        description: "Essential chapters on building and managing startups through difficult times",
        category: "startup",
        rating: 4.6,
        year: 2014,
        link: "https://a16z.com/book/the-hard-thing-about-hard-things/",
        format: "Free Chapters",
        pages: "Key sections"
      },
      {
        id: 4,
        title: "Venture Deals - Free Resources",
        author: "Brad Feld & Jason Mendelson",
        description: "Free chapters and resources on venture capital and startup financing",
        category: "investing",
        rating: 4.7,
        year: 2019,
        link: "https://www.feld.com/archives/category/venture-deals",
        format: "Free Resources",
        pages: "Multiple chapters"
      },
      {
        id: 5,
        title: "The Intelligent Investor - Public Domain",
        author: "Benjamin Graham",
        description: "Classic investment philosophy available in public domain",
        category: "investing",
        rating: 4.6,
        year: 1949,
        link: "https://www.pdfdrive.com/the-intelligent-investor-e34300131.html",
        format: "Free PDF",
        pages: "Full book"
      },
      {
        id: 6,
        title: "Thinking, Fast and Slow - Key Insights",
        author: "Daniel Kahneman",
        description: "Summary of behavioral economics concepts and decision-making frameworks",
        category: "psychology",
        rating: 4.5,
        year: 2011,
        link: "https://www.pdfdrive.com/thinking-fast-and-slow-e187538360.html",
        format: "Free PDF",
        pages: "Summary available"
      },
      {
        id: 7,
        title: "Hooked - Workbook & Templates",
        author: "Nir Eyal",
        description: "Free workbook and templates for building habit-forming products",
        category: "product",
        rating: 4.4,
        year: 2014,
        link: "https://www.nirandfar.com/hooked/",
        format: "Free Workbook",
        pages: "Templates & Guides"
      },
      {
        id: 8,
        title: "The Innovator's Dilemma - Summary",
        author: "Clayton Christensen",
        description: "Key concepts on disruptive innovation and business strategy",
        category: "innovation",
        rating: 4.6,
        year: 1997,
        link: "https://www.pdfdrive.com/the-innovators-dilemma-when-new-technologies-cause-great-firms-to-fail-e176535076.html",
        format: "Free PDF",
        pages: "Summary"
      },
      {
        id: 9,
        title: "Crossing the Chasm - Free Guide",
        author: "Geoffrey Moore",
        description: "Marketing strategies for technology adoption life cycle",
        category: "marketing",
        rating: 4.5,
        year: 1991,
        link: "https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/crossing-the-chasm-in-technology-marketing",
        format: "Free Guide",
        pages: "Strategy guide"
      },
      {
        id: 10,
        title: "The $100 Startup - Free Resources",
        author: "Chris Guillebeau",
        description: "Case studies and resources for starting businesses with minimal investment",
        category: "entrepreneurship",
        rating: 4.4,
        year: 2012,
        link: "https://100startup.com/resources",
        format: "Free Resources",
        pages: "Case studies"
      },
      {
        id: 11,
        title: "Traction - Free Framework",
        author: "Gabriel Weinberg & Justin Mares",
        description: "19 traction channels framework for startup growth - free overview",
        category: "growth",
        rating: 4.5,
        year: 2015,
        link: "https://www.ycombinator.com/library/4D-how-to-get-your-first-10-customers",
        format: "Free Framework",
        pages: "Growth guide"
      },
      {
        id: 12,
        title: "The Personal MBA - Free Resources",
        author: "Josh Kaufman",
        description: "Free business education resources and reading lists",
        category: "business",
        rating: 4.6,
        year: 2010,
        link: "https://personalmba.com/best-business-books/",
        format: "Free Resources",
        pages: "Reading lists"
      },
      {
        id: 13,
        title: "Blitzscaling - Free Concepts",
        author: "Reid Hoffman",
        description: "Key concepts on rapid scaling of technology companies",
        category: "growth",
        rating: 4.4,
        year: 2018,
        link: "https://www.linkedin.com/pulse/blitzscaling-reid-hoffman/",
        format: "Free Articles",
        pages: "Concept overview"
      },
      {
        id: 14,
        title: "The E-Myth Revisited - Free Summary",
        author: "Michael E. Gerber",
        description: "Key principles for systemizing small businesses",
        category: "business",
        rating: 4.6,
        year: 1995,
        link: "https://www.pdfdrive.com/the-emyth-revisited-why-most-small-businesses-dont-work-and-what-to-do-about-it-e176536275.html",
        format: "Free PDF",
        pages: "Summary"
      },
      {
        id: 15,
        title: "Sprint - Free Templates",
        author: "Jake Knapp",
        description: "Free design sprint templates and facilitation guides",
        category: "product",
        rating: 4.5,
        year: 2016,
        link: "https://www.thesprintbook.com/resources",
        format: "Free Templates",
        pages: "Templates"
      }
    ],
    videos: [
      // ... keep all the existing video data exactly the same ...
      {
        id: 1,
        title: "How Great Leaders Inspire Action",
        speaker: "Simon Sinek",
        description: "The Golden Circle - Start with why",
        category: "leadership",
        duration: "18:04",
        views: "65M",
        link: "https://youtu.be/u4ZoJKF_VuA"
      },
      {
        id: 2,
        title: "The First Secret of Great Design",
        speaker: "Tony Fadell",
        description: "How to notice and solve everyday problems",
        category: "design",
        duration: "16:39",
        views: "4.2M",
        link: "https://youtu.be/9uOMectkCCs"
      },
      {
        id: 3,
        title: "Building a Minimum Viable Product",
        speaker: "Eric Ries",
        description: "Lean startup methodology in practice",
        category: "startup",
        duration: "22:15",
        views: "1.2M",
        link: "https://youtu.be/1FoCbbbcYT8"
      },
      {
        id: 4,
        title: "The Power of Venture Capital",
        speaker: "Naval Ravikant",
        description: "Understanding startup investing and venture math",
        category: "investing",
        duration: "45:22",
        views: "3.8M",
        link: "https://youtu.be/3qHkcs3kG44"
      },
      {
        id: 5,
        title: "Building a Culture of Innovation",
        speaker: "Reid Hoffman",
        description: "Lessons from LinkedIn and Greylock",
        category: "culture",
        duration: "32:10",
        views: "2.1M",
        link: "https://youtu.be/9ZrZ4Nqo9sw"
      },
      {
        id: 6,
        title: "The Single Biggest Reason Why Startups Succeed",
        speaker: "Bill Gross",
        description: "Analysis of what makes startups successful",
        category: "startup",
        duration: "16:43",
        views: "3.5M",
        link: "https://youtu.be/bNpx7gpSqbY"
      },
      {
        id: 7,
        title: "How to Build a Startup: The Lean LaunchPad",
        speaker: "Steve Blank",
        description: "Customer development and business model innovation",
        category: "startup",
        duration: "58:22",
        views: "1.8M",
        link: "https://youtu.be/7QW6vD8j0MU"
      },
      {
        id: 8,
        title: "The Art of the Pitch",
        speaker: "David S. Rose",
        description: "How to pitch to a venture capitalist",
        category: "pitching",
        duration: "19:15",
        views: "2.3M",
        link: "https://youtu.be/lj26C4W4pic"
      },
      {
        id: 9,
        title: "Growth Hacking: How to Grow Your User Base",
        speaker: "Andrew Chen",
        description: "Modern growth strategies for startups",
        category: "growth",
        duration: "28:45",
        views: "1.5M",
        link: "https://youtu.be/5Z_p2_V82Uw"
      },
      {
        id: 10,
        title: "The Future of Technology and Startups",
        speaker: "Marc Andreessen",
        description: "Where technology is heading next",
        category: "future",
        duration: "51:33",
        views: "2.7M",
        link: "https://youtu.be/Q3Q9vj_tx1o"
      },
      {
        id: 11,
        title: "Product Management for Startups",
        speaker: "Marty Cagan",
        description: "Building products customers love",
        category: "product",
        duration: "42:18",
        views: "1.1M",
        link: "https://youtu.be/ZZrvPCa2Ux8"
      },
      {
        id: 12,
        title: "The Psychology of Startup Success",
        speaker: "Carol Dweck",
        description: "Growth mindset in entrepreneurship",
        category: "psychology",
        duration: "23:47",
        views: "1.9M",
        link: "https://youtu.be/_X0mgOOSpLU"
      },
      {
        id: 13,
        title: "Building a Remote-First Company",
        speaker: "Matt Mullenweg",
        description: "Lessons from Automattic's distributed workforce",
        category: "culture",
        duration: "37:12",
        views: "1.4M",
        link: "https://youtu.be/Mv8N-1Q0mGY"
      },
      {
        id: 14,
        title: "The Science of Scaling",
        speaker: "Brian Balfour",
        description: "Data-driven approaches to company growth",
        category: "growth",
        duration: "49:05",
        views: "890K",
        link: "https://youtu.be/lLcR3YJwRas"
      },
      {
        id: 15,
        title: "Angel Investing 101",
        speaker: "Jason Calacanis",
        description: "How to get started with startup investing",
        category: "investing",
        duration: "55:30",
        views: "1.2M",
        link: "https://youtu.be/5MBWE4rBUfY"
      }
    ],
    links: [
      // ... keep all the existing link data exactly the same ...
      {
        id: 1,
        title: "Paul Graham's Essays",
        description: "Essential reading for startup founders",
        category: "startup",
        type: "blog",
        link: "http://paulgraham.com/articles.html"
      },
      {
        id: 2,
        title: "Y Combinator Startup School",
        description: "Free online startup course from YC",
        category: "education",
        type: "course",
        link: "https://www.startupschool.org/"
      },
      {
        id: 3,
        title: "AngelList Resources",
        description: "Startup investing and fundraising guides",
        category: "investing",
        type: "platform",
        link: "https://angel.co/resources"
      },
      {
        id: 4,
        title: "Stripe Atlas Guides",
        description: "Comprehensive guides for starting a US business",
        category: "legal",
        type: "guide",
        link: "https://stripe.com/atlas/guides"
      },
      {
        id: 5,
        title: "First Round Review",
        description: "Essential startup advice from experienced founders",
        category: "startup",
        type: "blog",
        link: "https://review.firstround.com/"
      },
      {
        id: 6,
        title: "SaaStr",
        description: "Everything SaaS - from metrics to fundraising",
        category: "saas",
        type: "blog",
        link: "https://www.saastr.com/"
      },
      {
        id: 7,
        title: "Andreessen Horowitz Resources",
        description: "VC insights on technology and business",
        category: "investing",
        type: "blog",
        link: "https://a16z.com/resources/"
      },
      {
        id: 8,
        title: "Product Hunt",
        description: "Discover the best new products in tech",
        category: "product",
        type: "platform",
        link: "https://www.producthunt.com/"
      },
      {
        id: 9,
        title: "Indie Hackers",
        description: "Learn from profitable online businesses",
        category: "entrepreneurship",
        type: "community",
        link: "https://www.indiehackers.com/"
      },
      {
        id: 10,
        title: "The Macro",
        description: "Market analysis and economic trends",
        category: "investing",
        type: "blog",
        link: "https://www.sequoiacap.com/article/the-macro/"
      },
      {
        id: 11,
        title: "NFX Resources",
        description: "Network effects and startup strategy",
        category: "strategy",
        type: "blog",
        link: "https://www.nfx.com/post/resources"
      },
      {
        id: 12,
        title: "YC Library",
        description: "Y Combinator's collection of startup resources",
        category: "startup",
        type: "library",
        link: "https://www.ycombinator.com/library"
      },
      {
        id: 13,
        title: "Tomasz Tunguz Resources",
        description: "SaaS metrics and venture capital analysis",
        category: "saas",
        type: "blog",
        link: "https://tomtunguz.com/resources/"
      },
      {
        id: 14,
        title: "The Startup Chat",
        description: "Weekly podcast with startup advice",
        category: "podcast",
        type: "audio",
        link: "https://thestartupchat.com/"
      },
      {
        id: 15,
        title: "Mattermark Daily",
        description: "Business intelligence and market research",
        category: "research",
        type: "newsletter",
        link: "https://mattermark.com/newsletter/"
      },
      {
        id: 16,
        title: "Crunchbase",
        description: "Database of companies and funding information",
        category: "data",
        type: "platform",
        link: "https://www.crunchbase.com/"
      },
      {
        id: 17,
        title: "Pitchbook",
        description: "Private market data and research",
        category: "investing",
        type: "platform",
        link: "https://pitchbook.com/"
      },
      {
        id: 18,
        title: "TechCrunch Startups",
        description: "Latest startup news and funding rounds",
        category: "news",
        type: "media",
        link: "https://techcrunch.com/startups/"
      },
      {
        id: 19,
        title: "Founder Institute Resources",
        description: "Startup mentorship and pre-seed accelerator",
        category: "education",
        type: "platform",
        link: "https://fi.co/resources"
      },
      {
        id: 20,
        title: "Harvard Business Review Startups",
        description: "Research-backed business insights",
        category: "business",
        type: "media",
        link: "https://hbr.org/topic/startups"
      }
    ]
  };

  // ... keep all the existing categories, filteredResources, and other functions exactly the same ...

  const categories = [
    { 
      id: 'all', 
      name: 'All Resources', 
      icon: <TrendingUp className="w-4 h-4" />, 
      count: resources.books.length + resources.videos.length + resources.links.length 
    },
    { 
      id: 'startup', 
      name: 'Startup', 
      icon: <Lightbulb className="w-4 h-4" />, 
      count: resources.books.filter(b => b.category === 'startup').length + 
             resources.videos.filter(v => v.category === 'startup').length + 
             resources.links.filter(l => l.category === 'startup').length 
    },
    { 
      id: 'investing', 
      name: 'Investing', 
      icon: <TrendingUp className="w-4 h-4" />, 
      count: resources.books.filter(b => b.category === 'investing').length + 
             resources.videos.filter(v => v.category === 'investing').length + 
             resources.links.filter(l => l.category === 'investing').length 
    },
    { 
      id: 'leadership', 
      name: 'Leadership', 
      icon: <Users className="w-4 h-4" />, 
      count: resources.videos.filter(v => v.category === 'leadership').length + 
             resources.links.filter(l => l.category === 'leadership').length 
    },
    { 
      id: 'growth', 
      name: 'Growth', 
      icon: <Target className="w-4 h-4" />, 
      count: resources.books.filter(b => b.category === 'growth').length + 
             resources.videos.filter(v => v.category === 'growth').length + 
             resources.links.filter(l => l.category === 'growth').length 
    },
    { 
      id: 'product', 
      name: 'Product', 
      icon: <Zap className="w-4 h-4" />, 
      count: resources.books.filter(b => b.category === 'product').length + 
             resources.videos.filter(v => v.category === 'product').length + 
             resources.links.filter(l => l.category === 'product').length 
    }
  ];

  const filteredResources = useMemo(() => {
    const allResources = [
      ...resources.books.map(book => ({ ...book, type: 'book' })),
      ...resources.videos.map(video => ({ ...video, type: 'video' })),
      ...resources.links.map(link => ({ ...link, type: 'link' }))
    ];

    return allResources.filter(resource => {
      const matchesCategory = activeCategory === 'all' || resource.category === activeCategory;
      const matchesSearch = searchTerm === '' || 
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (resource.author && resource.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (resource.speaker && resource.speaker.toLowerCase().includes(searchTerm.toLowerCase())) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm]);

  const ResourceCard = ({ resource }) => {
    if (resource.type === 'book') {
      return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                {resource.format}
              </span>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{resource.rating}</span>
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
            {resource.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">by {resource.author}</p>
          <p className="text-gray-700 mb-4 leading-relaxed">{resource.description}</p>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">{resource.pages}</span>
            <span className="text-sm text-gray-500">{resource.year}</span>
          </div>
          
          <a 
            href={resource.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
          >
            {resource.format.includes('PDF') ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
            {resource.format.includes('PDF') ? 'Download Free PDF' : 'Access Free Resource'}
          </a>
        </div>
      );
    }

    // ... keep the existing video and link card components exactly the same ...
    if (resource.type === 'video') {
      return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-red-300 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center text-white">
              <PlayCircle className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{resource.duration}</span>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
            {resource.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">by {resource.speaker}</p>
          <p className="text-gray-700 mb-4 leading-relaxed">{resource.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{resource.views} views</span>
            </div>
            <a 
              href={resource.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              Watch
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>
      );
    }

    if (resource.type === 'link') {
      return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white">
              <Link className="w-6 h-6" />
            </div>
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full capitalize">
              {resource.type}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
            {resource.title}
          </h3>
          <p className="text-gray-700 mb-4 leading-relaxed">{resource.description}</p>
          
          <a 
            href={resource.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
          >
            Visit Resource
            <Globe className="w-4 h-4" />
          </a>
        </div>
      );
    }
  };

  // ... keep the rest of the component exactly the same ...
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Knowledge Hub
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Curated resources for startup founders, investors, and innovators. Learn from the best minds in entrepreneurship.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search books, videos, articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 sticky top-8">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Categories</h2>
              </div>
              
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                      activeCategory === category.id 
                        ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${
                        activeCategory === category.id ? 'text-purple-600' : 'text-gray-400'
                      }`}>
                        {category.icon}
                      </div>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      activeCategory === category.id 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Resource Library</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Books</span>
                  <span className="font-semibold text-gray-900">{resources.books.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Videos</span>
                  <span className="font-semibold text-gray-900">{resources.videos.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Links</span>
                  <span className="font-semibold text-gray-900">{resources.links.length}</span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total</span>
                    <span className="font-bold text-purple-600">
                      {resources.books.length + resources.videos.length + resources.links.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resources Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeCategory === 'all' ? 'All Resources' : categories.find(c => c.id === activeCategory)?.name}
                </h2>
                <p className="text-gray-600 mt-1">
                  {filteredResources.length} resources found
                  {searchTerm && ` for "${searchTerm}"`}
                </p>
              </div>
            </div>

            {/* Resources Grid */}
            {filteredResources.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {filteredResources.map(resource => (
                  <ResourceCard key={`${resource.type}-${resource.id}`} resource={resource} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources found</h3>
                <p className="text-gray-600">
                  Try adjusting your search or browse a different category
                </p>
              </div>
            )}

            {/* Featured Sections */}
            {activeCategory === 'all' && searchTerm === '' && (
              <>
                {/* Books Section */}
                <section className="mt-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <BookOpen className="w-6 h-6 text-blue-500" />
                      Essential Books ({resources.books.length})
                    </h2>
                    <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium">
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    {resources.books.slice(0, 4).map(book => (
                      <ResourceCard key={`book-${book.id}`} resource={{ ...book, type: 'book' }} />
                    ))}
                  </div>
                </section>

                {/* Videos Section */}
                <section className="mt-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <PlayCircle className="w-6 h-6 text-red-500" />
                      Must-Watch Videos ({resources.videos.length})
                    </h2>
                    <button className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium">
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    {resources.videos.slice(0, 4).map(video => (
                      <ResourceCard key={`video-${video.id}`} resource={{ ...video, type: 'video' }} />
                    ))}
                  </div>
                </section>

                {/* Links Section */}
                <section className="mt-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <Link className="w-6 h-6 text-green-500" />
                      Useful Resources ({resources.links.length})
                    </h2>
                    <button className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium">
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    {resources.links.slice(0, 4).map(link => (
                      <ResourceCard key={`link-${link.id}`} resource={{ ...link, type: 'link' }} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Want to contribute?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Have a great resource to share with the community? We're always looking for valuable content to help founders and investors succeed.
          </p>
          <button className="px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
            Suggest a Resource
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;