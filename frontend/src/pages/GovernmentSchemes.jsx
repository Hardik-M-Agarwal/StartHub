import React, { useState, useMemo } from 'react';
import { Search, Filter, ExternalLink, Users, Target, DollarSign, Calendar, Award, Building2, BookOpen, GraduationCap, Shield } from 'lucide-react';

const GovernmentSchemes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEligibility, setSelectedEligibility] = useState('all');

  // Enhanced schemes data with more comprehensive information
  const schemes = [
    {
      id: 1,
      name: "Stand-Up India",
      description: "Facilitates bank loans between ₹10 lakh and ₹1 crore to at least one SC/ST borrower and one woman borrower per bank branch for setting up greenfield enterprises in manufacturing, services, or trading sector.",
      category: "financial",
      eligibility: ["women", "sc/st"],
      website: "https://www.standupmitra.in/",
      ministry: "Ministry of Finance",
      launched: "2016",
      benefits: ["Loan: ₹10L - ₹1Cr", "Credit Guarantee", "Handholding Support", "No Collateral Required"],
      financialAid: "Bank loans from ₹10 lakh to ₹1 crore with concessional interest rates",
      deadline: "Ongoing",
      incomeLimit: "No specific limit",
      contact: "1800-180-1551"
    },
    {
      id: 2,
      name: "Mahila Udyam Nidhi",
      description: "Special scheme for women entrepreneurs providing term loans for setting up new projects and soft loans for working capital requirements.",
      category: "financial",
      eligibility: ["women"],
      website: "https://sidbi.in/",
      ministry: "SIDBI",
      launched: "1995",
      benefits: ["Soft Loans", "Working Capital", "Interest Subsidy", "Project Funding"],
      financialAid: "Soft loans up to ₹10 lakh with interest subsidy of 3%",
      deadline: "Ongoing",
      incomeLimit: "Annual income below ₹3 lakh",
      contact: "1800-103-3551"
    },
    {
      id: 3,
      name: "Pradhan Mantri Mudra Yojana (PMMY)",
      description: "Provides loans up to ₹10 lakh to non-corporate, non-farm small/micro enterprises. Categories: Shishu (up to ₹50,000), Kishore (₹50,001-₹5 lakh), Tarun (₹5-10 lakh).",
      category: "financial",
      eligibility: ["women", "sc/st", "general", "low-income"],
      website: "https://www.mudra.org.in/",
      ministry: "Ministry of Finance",
      launched: "2015",
      benefits: ["Loans up to ₹10L", "No Collateral", "Three Categories", "Easy Processing"],
      financialAid: "Collateral-free loans up to ₹10 lakh with minimal documentation",
      deadline: "Ongoing",
      incomeLimit: "No specific limit",
      contact: "1800-180-1111"
    },
    {
      id: 4,
      name: "National SC/ST Hub",
      description: "Comprehensive support system for SC/ST entrepreneurs including access to finance, capacity building, market linkages, and technology upgradation.",
      category: "development",
      eligibility: ["sc/st"],
      website: "https://scsthub.in/",
      ministry: "Ministry of MSME",
      launched: "2016",
      benefits: ["15% Capital Subsidy", "Training Programs", "Market Access", "Technology Support"],
      financialAid: "15% capital subsidy up to ₹15 lakh for technology upgradation",
      deadline: "2026",
      incomeLimit: "No specific limit",
      contact: "1800-180-6763"
    },
    {
      id: 5,
      name: "Women Entrepreneurship Platform (WEP)",
      description: "Holistic platform offering incubation, acceleration, entrepreneurship programs, and community networking for women entrepreneurs across India.",
      category: "development",
      eligibility: ["women"],
      website: "https://wep.niti.gov.in/",
      ministry: "NITI Aayog",
      launched: "2018",
      benefits: ["Incubation Support", "Funding Access", "Mentorship", "Skill Development"],
      financialAid: "Seed funding support and access to venture capital networks",
      deadline: "Ongoing",
      incomeLimit: "No specific limit",
      contact: "011-23096645"
    },
    {
      id: 6,
      name: "Van Dhan Yojana",
      description: "Initiative for tribal entrepreneurs focusing on value addition of tribal products, training in processing, and market linkages for better price realization.",
      category: "marketing",
      eligibility: ["sc/st"],
      website: "https://trifed.tribal.gov.in/",
      ministry: "Ministry of Tribal Affairs",
      launched: "2018",
      benefits: ["Value Addition", "Market Linkage", "Training", "Infrastructure Support"],
      financialAid: "Seed capital up to ₹15 lakh per Van Dhan Vikas Kendra",
      deadline: "2024",
      incomeLimit: "Tribal community members",
      contact: "011-24365156"
    },
    {
      id: 7,
      name: "Deen Dayal Upadhyaya Grameen Kaushalya Yojana (DDU-GKY)",
      description: "Skill development program with focus on rural youth including SC/ST and women, providing placement-linked skill training and entrepreneurship development.",
      category: "training",
      eligibility: ["women", "sc/st", "low-income"],
      website: "https://ddugky.gov.in/",
      ministry: "Ministry of Rural Development",
      launched: "2014",
      benefits: ["Skill Training", "Placement", "Entrepreneurship", "Stipend Support"],
      financialAid: "Training cost up to ₹30,000 per candidate + placement support",
      deadline: "2026",
      incomeLimit: "Rural youth from BPL families",
      contact: "1800-102-3030"
    },
    {
      id: 8,
      name: "Credit Linked Capital Subsidy for SC/ST",
      description: "Credit linked capital subsidy scheme providing 15% subsidy on institutional finance for technology upgradation to SC/ST owned MSMEs.",
      category: "financial",
      eligibility: ["sc/st"],
      website: "https://msme.gov.in/",
      ministry: "Ministry of MSME",
      launched: "2020",
      benefits: ["15% Subsidy", "Technology Upgrade", "Credit Support", "Quality Certification"],
      financialAid: "15% capital subsidy up to ₹15 lakh on loans for technology upgradation",
      deadline: "2025",
      incomeLimit: "No specific limit",
      contact: "1800-180-6763"
    },
    {
      id: 9,
      name: "Mahila Coir Yojana",
      description: "Scheme for women entrepreneurs in coir industry providing training and financial assistance for setting up coir units with 75% subsidy for SC/ST women.",
      category: "financial",
      eligibility: ["women", "sc/st"],
      website: "https://coir.gov.in/",
      ministry: "Ministry of MSME",
      launched: "2015",
      benefits: ["75% Subsidy", "Training", "Equipment Support", "Market Linkage"],
      financialAid: "75% subsidy for SC/ST women, 30% for others up to ₹1.25 lakh",
      deadline: "Ongoing",
      incomeLimit: "No specific limit",
      contact: "0484-2351891"
    },
    {
      id: 10,
      name: "National Backward Classes Finance & Development Corporation",
      description: "Provides loans and financial assistance for income-generating activities to backward class entrepreneurs with special focus on women and extremely backward classes.",
      category: "financial",
      eligibility: ["sc/st", "low-income"],
      website: "https://nbcfdc.gov.in/",
      ministry: "Ministry of Social Justice",
      launched: "1992",
      benefits: ["Term Loans", "Micro Credit", "Skill Training", "Interest Subsidy"],
      financialAid: "Term loans up to ₹10 lakh with concessional interest rates",
      deadline: "Ongoing",
      incomeLimit: "Annual income below ₹3 lakh",
      contact: "011-24361232"
    },
    {
      id: 11,
      name: "Pradhan Mantri Kaushal Vikas Yojana (PMKVY)",
      description: "Skill certification scheme to encourage youth to take up industry-relevant skill training with special focus on SC/ST, women, and disadvantaged groups.",
      category: "training",
      eligibility: ["women", "sc/st", "low-income"],
      website: "https://pmkvyofficial.org/",
      ministry: "Ministry of Skill Development",
      launched: "2015",
      benefits: ["Free Training", "Certification", "Placement", "Monetary Reward"],
      financialAid: "Free training with monetary reward of ₹8,000 upon certification",
      deadline: "2026",
      incomeLimit: "No specific limit",
      contact: "1800-102-6000"
    },
    {
      id: 12,
      name: "Startup India Seed Fund Scheme",
      description: "Financial assistance for startups for proof of concept, prototype development, product trials, market entry, and commercialization.",
      category: "financial",
      eligibility: ["women", "sc/st", "general"],
      website: "https://www.startupindia.gov.in/",
      ministry: "DPIIT",
      launched: "2021",
      benefits: ["Seed Funding", "Mentorship", "Incubation", "Networking"],
      financialAid: "Up to ₹20 lakh for validation and ₹50 lakh for commercialization",
      deadline: "2025",
      incomeLimit: "No specific limit",
      contact: "1800-115-565"
    },
    {
      id: 13,
      name: "National Scheduled Castes Finance and Development Corporation",
      description: "Provides concessional finance and skill development support to SC entrepreneurs for setting up micro-enterprises and self-employment ventures.",
      category: "financial",
      eligibility: ["sc/st"],
      website: "https://nscfdc.nic.in/",
      ministry: "Ministry of Social Justice",
      launched: "1989",
      benefits: ["Micro Loans", "Skill Training", "Marketing Support", "Interest Subsidy"],
      financialAid: "Micro loans up to ₹2 lakh with interest subsidy for women entrepreneurs",
      deadline: "Ongoing",
      incomeLimit: "Annual income below ₹3 lakh",
      contact: "011-24361232"
    },
    {
      id: 14,
      name: "Mahila Samriddhi Yojana",
      description: "Micro-finance scheme specifically designed for women from low-income groups to start small businesses with minimal documentation and collateral-free loans.",
      category: "financial",
      eligibility: ["women", "low-income"],
      website: "https://mudra.org.in/",
      ministry: "Ministry of Finance",
      launched: "2017",
      benefits: ["Collateral-free", "Quick Processing", "Group Lending", "Financial Literacy"],
      financialAid: "Loans up to ₹1 lakh without collateral under MUDRA Shishu category",
      deadline: "Ongoing",
      incomeLimit: "Annual income below ₹2 lakh",
      contact: "1800-180-1111"
    },
    {
      id: 15,
      name: "Entrepreneurship Development Program (EDP)",
      description: "Comprehensive training program covering business plan preparation, financial management, marketing strategies, and legal aspects for aspiring entrepreneurs.",
      category: "training",
      eligibility: ["women", "sc/st", "low-income"],
      website: "https://msme.gov.in/",
      ministry: "Ministry of MSME",
      launched: "1979",
      benefits: ["Business Training", "Mentorship", "Network Building", "Project Guidance"],
      financialAid: "Free training with stipend support for SC/ST and women participants",
      deadline: "Ongoing",
      incomeLimit: "No specific limit",
      contact: "1800-180-6763"
    }
  ];

  // Enhanced categories
  const categories = [
    { id: 'all', name: 'All Schemes', icon: Building2 },
    { id: 'financial', name: 'Financial Support', icon: DollarSign },
    { id: 'training', name: 'Skill Development', icon: GraduationCap },
    { id: 'marketing', name: 'Marketing & Sales', icon: Target },
    { id: 'development', name: 'Entrepreneurship', icon: Users },
    { id: 'information', name: 'Information Portal', icon: Award }
  ];

  // Enhanced eligibility options
  const eligibilityOptions = [
    { id: 'all', name: 'All Beneficiaries' },
    { id: 'women', name: 'Women Entrepreneurs' },
    { id: 'sc/st', name: 'SC/ST Communities' },
    { id: 'low-income', name: 'Low Income (<₹2L)' }
  ];

  // Filter schemes based on search and filters
  const filteredSchemes = useMemo(() => {
    return schemes.filter(scheme => {
      const matchesSearch = scheme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          scheme.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          scheme.financialAid.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || scheme.category === selectedCategory;
      
      const matchesEligibility = selectedEligibility === 'all' || 
                                scheme.eligibility.includes(selectedEligibility);
      
      return matchesSearch && matchesCategory && matchesEligibility;
    });
  }, [searchTerm, selectedCategory, selectedEligibility]);

  // Enhanced statistics
  const stats = {
    totalSchemes: schemes.length,
    womenSchemes: schemes.filter(s => s.eligibility.includes('women')).length,
    scstSchemes: schemes.filter(s => s.eligibility.includes('sc/st')).length,
    lowIncomeSchemes: schemes.filter(s => s.eligibility.includes('low-income')).length,
    financialSchemes: schemes.filter(s => s.category === 'financial').length
  };

  const SchemeCard = ({ scheme }) => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {scheme.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{scheme.ministry}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {scheme.eligibility.map(elig => (
              <span 
                key={elig}
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  elig === 'women' 
                    ? 'bg-pink-100 text-pink-800' 
                    : elig === 'sc/st'
                    ? 'bg-purple-100 text-purple-800'
                    : elig === 'low-income'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {elig === 'women' ? 'Women' : elig === 'sc/st' ? 'SC/ST' : elig === 'low-income' ? 'Low Income' : 'General'}
              </span>
            ))}
          </div>
        </div>
        
        <p className="text-gray-600 mb-4 leading-relaxed">{scheme.description}</p>
        
        {/* Financial Aid Section */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <DollarSign className="w-4 h-4 text-blue-600 mr-2" />
            <h4 className="text-sm font-semibold text-blue-800">Financial Assistance</h4>
          </div>
          <p className="text-sm text-blue-700">{scheme.financialAid}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            Launched: {scheme.launched}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Award className="w-4 h-4 mr-2" />
            Deadline: {scheme.deadline}
          </div>
        </div>
        
        {scheme.incomeLimit && scheme.incomeLimit !== "No specific limit" && (
          <div className="flex items-center text-sm text-amber-600 mb-3">
            <Shield className="w-4 h-4 mr-2" />
            Income Limit: {scheme.incomeLimit}
          </div>
        )}
        
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Benefits:</h4>
          <div className="flex flex-wrap gap-2">
            {scheme.benefits.map((benefit, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium"
              >
                {benefit}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <a 
            href={scheme.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors group/link flex-1"
          >
            Visit Official Website
            <ExternalLink className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
          </a>
          {scheme.contact && (
            <div className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
              <span className="mr-2">📞</span>
              {scheme.contact}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color} mr-4`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Government Schemes for Entrepreneurs
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Comprehensive portal showcasing government initiatives for Women Entrepreneurs, SC/ST Communities, 
            and Low-Income Groups with detailed financial assistance, training programs, and business support
          </p>
        </div>

        {/* Enhanced Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          <StatCard 
            icon={Award}
            label="Total Schemes"
            value={stats.totalSchemes}
            color="bg-blue-500"
          />
          <StatCard 
            icon={Users}
            label="Women-focused"
            value={stats.womenSchemes}
            color="bg-pink-500"
          />
          <StatCard 
            icon={Target}
            label="SC/ST Schemes"
            value={stats.scstSchemes}
            color="bg-purple-500"
          />
          <StatCard 
            icon={DollarSign}
            label="Low Income"
            value={stats.lowIncomeSchemes}
            color="bg-orange-500"
          />
          <StatCard 
            icon={GraduationCap}
            label="Financial Aid"
            value={stats.financialSchemes}
            color="bg-green-500"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search schemes, benefits, or financial aid..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Eligibility Filter */}
            <select
              value={selectedEligibility}
              onChange={(e) => setSelectedEligibility(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {eligibilityOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {categories.find(c => c.id === selectedCategory)?.name}
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className="ml-2 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            )}
            {selectedEligibility !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {eligibilityOptions.find(e => e.id === selectedEligibility)?.name}
                <button 
                  onClick={() => setSelectedEligibility('all')}
                  className="ml-2 hover:text-green-600"
                >
                  ×
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                Search: "{searchTerm}"
                <button 
                  onClick={() => setSearchTerm('')}
                  className="ml-2 hover:text-gray-600"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Available Schemes ({filteredSchemes.length})
            </h2>
            <div className="text-sm text-gray-500">
              Showing {filteredSchemes.length} of {schemes.length} schemes
            </div>
          </div>
          
          {filteredSchemes.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No schemes found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSchemes.map(scheme => (
                <SchemeCard key={scheme.id} scheme={scheme} />
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Footer Info */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Need Help Applying?</h3>
          <p className="mb-6 opacity-90 text-lg">
            Contact the respective ministry helplines or visit your nearest Common Service Center (CSC) 
            for assistance with scheme applications and documentation. Most schemes require basic documents 
            like Aadhaar, caste certificate (if applicable), income certificate, and business plan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div>
              <strong className="block mb-2">Ministry of MSME</strong>
              <div>📞 1800-180-6763</div>
              <div>🌐 msme.gov.in</div>
            </div>
            <div>
              <strong className="block mb-2">Stand-Up India</strong>
              <div>📞 1800-180-1551</div>
              <div>🌐 standupmitra.in</div>
            </div>
            <div>
              <strong className="block mb-2">Women Helpline</strong>
              <div>📞 181</div>
              <div>📞 1091 (Women in distress)</div>
            </div>
            <div>
              <strong className="block mb-2">Startup India</strong>
              <div>📞 1800-115-565</div>
              <div>🌐 startupindia.gov.in</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernmentSchemes;