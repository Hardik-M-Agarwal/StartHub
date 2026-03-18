import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, 
  TrendingUp, 
  Users, 
  BarChart3, 
  MessageCircle,
  Shield,
  Zap,
  ArrowRight,
  Menu,
  X,
  Mail,
  Star,
  ExternalLink,
  ChevronDown,
  MessageSquare
} from 'lucide-react';
import * as THREE from 'three';
import gsap from 'gsap';

// Three.js Hero Component
function cssVar(name, fallback) {
  if (typeof window === "undefined") return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

const HeroCanvas = () => {
  const containerRef = useRef(null)
  const rendererRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.z = 3.2

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer
    container.appendChild(renderer.domElement)

    // Colors from CSS variables
    const brand = cssVar("--brand-hex", "#1e90ff")
    const accent = cssVar("--accent-hex", "#7dd3fc")

    // Primary wireframe icosahedron
    const icoGeom = new THREE.IcosahedronGeometry(1, 2)
    const icoMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(brand),
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    })
    const ico = new THREE.Mesh(icoGeom, icoMat)
    scene.add(ico)

    // Ring geometry
    const ringGeom = new THREE.TorusGeometry(1.35, 0.02, 16, 200)
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accent),
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    })
    const ring = new THREE.Mesh(ringGeom, ringMat)
    ring.rotation.x = Math.PI / 3
    scene.add(ring)

    // Particle field
    const pts = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        Array.from(
          { length: 600 },
          () => new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6),
        ),
      ),
      new THREE.PointsMaterial({ color: accent, size: 0.01, transparent: true, opacity: 0.6 }),
    )
    scene.add(pts)

    let raf = 0
    let mouseX = 0
    let mouseY = 0

    const resize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    resize()
    window.addEventListener("resize", resize)

    const onPointer = (e) => {
      const rect = container.getBoundingClientRect()
      mouseX = (e.clientX - rect.left) / rect.width - 0.5
      mouseY = (e.clientY - rect.top) / rect.height - 0.5
    }
    window.addEventListener("pointermove", onPointer)

    const animate = () => {
      raf = requestAnimationFrame(animate)
      ico.rotation.x += 0.003
      ico.rotation.y += 0.004
      ring.rotation.z -= 0.002
      pts.rotation.y -= 0.001

      camera.position.x += (mouseX * 0.8 - camera.position.x) * 0.05
      camera.position.y += (-mouseY * 0.8 - camera.position.y) * 0.05
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", onPointer)
      icoGeom.dispose()
      icoMat.dispose()
      ringGeom.dispose()
      ringMat.dispose()
      pts.geometry.dispose()
      pts.material.dispose()
      scene.clear()
      renderer.dispose()
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className="h-full w-full rounded-3xl overflow-hidden" />
}

// GSAP Reveal Component
const GsapReveal = ({ children, y = 50, delay = 0, duration = 1, className = "" }) => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    gsap.fromTo(element, 
      { 
        y: y, 
        opacity: 0,
        rotationX: 5
      },
      { 
        y: 0, 
        opacity: 1,
        rotationX: 0,
        duration: duration,
        delay: delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    );
  }, [y, delay, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

// Floating Element Component
const FloatingElement = ({ children, delay = 0 }) => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    gsap.to(element, {
      y: -10,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: delay
    });
  }, [delay]);

  return (
    <div ref={ref} className="inline-block">
      {children}
    </div>
  );
};

// Navbar Component
const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    gsap.to(".nav-item", {
      y: 0,
      opacity: 1,
      stagger: 0.1,
      duration: 0.8,
      ease: "power3.out"
    });
  }, []);

  const linkClass = "nav-item text-sm font-medium text-gray-600 hover:text-purple-600 transition-all transform hover:scale-105 opacity-0 translate-y-10";

  const handleRoleNavigation = (role, id, path = 'events') => {
    navigate(`/${role}/${id}/${path}`);
  };

  const navigatetologin = () => {
    navigate('/login');
  };

  const navigatetosignup = () => {
    navigate('/register');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200/50">
      <nav className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <FloatingElement>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              StartHub
            </span>
          </div>
        </FloatingElement>

        <button
          className="md:hidden inline-flex items-center justify-center rounded-xl border border-gray-300 px-3 py-2 text-sm hover:border-purple-400 transition-colors"
          onClick={() => setOpen((s) => !s)}
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        <ul className="hidden md:flex items-center gap-8">
          <li><a className={linkClass} href="#features">Features</a></li>
          <li><a className={linkClass} href="#vision">Vision</a></li>
          <li><a className={linkClass} href="#roles">Platform</a></li>
          <li><a className={linkClass} href="#testimonials">Success Stories</a></li>
        </ul>

        <button className='ml-auto border border-blue-300 px-3 py-2 text-sm hover:bg-blue-500 hover:text-white rounded-xl transition-colors' onClick={navigatetologin}>Login</button>
        <button className='ml-3 border border-blue-300 px-3 py-2 text-sm hover:bg-blue-500 hover:text-white rounded-xl transition-colors' onClick={navigatetosignup}>Signup</button>


        <div className="hidden md:flex items-center gap-3">
        
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`md:hidden border-t border-gray-200/50 transition-all duration-300 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-4 py-6 space-y-4 bg-white/95 backdrop-blur-lg">
          <a className="block text-lg font-medium text-gray-700 hover:text-purple-600 transition-colors" href="#features" onClick={() => setOpen(false)}>Features</a>
          <a className="block text-lg font-medium text-gray-700 hover:text-purple-600 transition-colors" href="#vision" onClick={() => setOpen(false)}>Vision</a>
          <a className="block text-lg font-medium text-gray-700 hover:text-purple-600 transition-colors" href="#roles" onClick={() => setOpen(false)}>Platform</a>
          <a className="block text-lg font-medium text-gray-700 hover:text-purple-600 transition-colors" href="#testimonials" onClick={() => setOpen(false)}>Success Stories</a>
          
          <div className="pt-4 space-y-3 border-t border-gray-200">
            <button 
              onClick={() => {
                handleRoleNavigation('startup', '1');
                setOpen(false);
              }}
              className="w-full px-6 py-3 text-base font-semibold text-gray-700 border-2 border-gray-300 rounded-xl hover:border-purple-400 transition-colors"
            >
              Startup Portal
            </button>
            <button 
              onClick={() => {
                handleRoleNavigation('investor', '1', 'analytics');
                setOpen(false);
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all"
            >
              Investor Dashboard
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Role Cards Component
const RoleCards = () => {
  const navigate = useNavigate();
  
  const roles = [
    {
      id: "startup",
      title: "For Startups",
      icon: <Rocket className="w-8 h-8" />,
      description: "Launch, grow, and scale your venture",
      features: ["AI-Powered Validation", "Growth Analytics", "Investor Matching", "Resource Hub"],
      gradient: "from-green-400 to-emerald-600",
      buttonText: "Launch Startup",
      path: "events"
    },
    {
      id: "investor",
      title: "For Investors",
      icon: <TrendingUp className="w-8 h-8" />,
      description: "Discover and fund the next unicorn",
      features: ["Curated Deals", "Portfolio Analytics", "Due Diligence Tools", "Market Insights"],
      gradient: "from-purple-400 to-pink-600",
      buttonText: "Explore Deals",
      path: "analytics"
    },
    {
      id: "admin",
      title: "For Admins",
      icon: <Shield className="w-8 h-8" />,
      description: "Manage and grow the ecosystem",
      features: ["Platform Analytics", "User Management", "Event Coordination", "Compliance Tools"],
      gradient: "from-orange-400 to-red-600",
      buttonText: "Admin Panel",
      path: "events"
    }
  ];

  const handleRoleClick = (role) => {
    navigate(`/${role.id}/${1}/${role.path}`);
  };

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {roles.map((role, idx) => (
        <GsapReveal key={role.id} delay={idx * 0.2} y={30}>
          <div 
            className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 hover:border-transparent transition-all duration-500 hover:shadow-2xl cursor-pointer overflow-hidden"
            onClick={() => handleRoleClick(role)}
          >
            {/* Animated background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
            
            {/* Floating icon */}
            <FloatingElement delay={idx * 0.3}>
              <div className={`w-16 h-16 bg-gradient-to-r ${role.gradient} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                {role.icon}
              </div>
            </FloatingElement>

            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-700 group-hover:bg-clip-text transition-all duration-300">
              {role.title}
            </h3>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              {role.description}
            </p>

            <ul className="space-y-3 mb-8">
              {role.features.map((feature, i) => (
                <li key={i} className="flex items-center text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                  <div className={`w-2 h-2 bg-gradient-to-r ${role.gradient} rounded-full mr-3`} />
                  {feature}
                </li>
              ))}
            </ul>

            <button className={`w-full py-3 bg-gradient-to-r ${role.gradient} text-white rounded-xl font-semibold hover:shadow-lg transform group-hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2`}>
              {role.buttonText}
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </GsapReveal>
      ))}
    </div>
  );
};

// Testimonials Component
const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CEO, TechNova",
      content: "StartHub helped us secure $2M in funding and connect with the right mentors. The platform is incredible!",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "VC Partner, Future Capital",
      content: "The deal flow quality is outstanding. We've made 3 investments through StartHub this quarter alone.",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Product Lead, InnovateLabs",
      content: "From analytics to networking, everything we need is in one place. Game-changing for startups!",
      rating: 5
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {testimonials.map((testimonial, idx) => (
        <GsapReveal key={idx} delay={idx * 0.15} y={20}>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
            <div>
              <div className="font-semibold text-gray-900">{testimonial.name}</div>
              <div className="text-sm text-gray-600">{testimonial.role}</div>
            </div>
          </div>
        </GsapReveal>
      ))}
    </div>
  );
};

// Footer Component with Feedback
const Footer = () => {
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    alert('Thank you for subscribing to our newsletter!');
    setEmail('');
  };

  const handleFeedback = (e) => {
    e.preventDefault();
    alert('Thank you for your valuable feedback! We appreciate your input.');
    setFeedback('');
    setRating(0);
    setShowFeedback(false);
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white mt-20">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">StartHub</span>
            </div>
            <p className="text-gray-300 leading-relaxed max-w-md">
              The all-in-one platform connecting startups, investors, and ecosystem partners to accelerate innovation and drive meaningful growth.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Platform</h3>
            <ul className="space-y-3 text-gray-300">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#vision" className="hover:text-white transition-colors">Our Vision</a></li>
              <li><a href="#roles" className="hover:text-white transition-colors">For Startups</a></li>
              <li><a href="#roles" className="hover:text-white transition-colors">For Investors</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Resources</h3>
            <ul className="space-y-3 text-gray-300">
              <li><a href="#testimonials" className="hover:text-white transition-colors">Success Stories</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Newsletter & Feedback */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Stay Connected</h3>
            
            {/* Newsletter */}
            <div className="mb-6">
              <p className="text-gray-300 text-sm mb-3">Get the latest startup insights</p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Mail className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Feedback Trigger */}
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              Give Feedback
              <ChevronDown className={`w-4 h-4 transition-transform ${showFeedback ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Feedback Form */}
        {showFeedback && (
          <GsapReveal duration={0.5}>
            <div className="mt-8 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
              <h4 className="font-semibold text-lg mb-4">We'd love your feedback!</h4>
              <form onSubmit={handleFeedback} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star 
                          className={`w-6 h-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Your Feedback</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What do you think about StartHub?"
                    rows="4"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Submit Feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeedback(false)}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </GsapReveal>
        )}

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} StartHub. All rights reserved. Building the future of innovation.</p>
        </div>
      </div>
    </footer>
  );
};

// Main Landing Page Component
const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Animate background elements
    gsap.to(".floating-bg-1", {
      y: 20,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(".floating-bg-2", {
      y: -15,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.5
    });
  }, []);

  const handleGetStarted = () => {
    navigate('/startup/1/events');
  };

  const handleExploreDemo = () => {
    navigate('/investor/1/analytics');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="floating-bg-1 absolute top-20 left-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl" />
      <div className="floating-bg-2 absolute bottom-20 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
      
      <Navbar />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <GsapReveal y={60} duration={1.2}>
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/50 text-sm text-gray-600 mb-6">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Trusted by 500+ startups worldwide
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance text-gray-900 leading-tight">
                  Launch. Fund. <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Scale.</span>
                </h1>
              </div>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                The all-in-one platform where startups meet opportunity. From idea to IPO, we provide the tools, connections, and insights you need to succeed.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGetStarted}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-2xl transition-all duration-300 flex items-center gap-3 hover:scale-105"
                >
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate("/idea-finder")}
                  className="px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:border-purple-400 hover:text-purple-700 transition-all duration-300 hover:scale-105"
                >
                  Do Not Have Any Startup Idea?
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-600">Startups</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">$50M+</div>
                  <div className="text-sm text-gray-600">Funding Raised</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">98%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>
          </GsapReveal>

          <GsapReveal delay={0.3} duration={1.5}>
            <div className="relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden">
              <HeroCanvas />
            </div>
          </GsapReveal>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="relative mx-auto max-w-7xl px-4 py-20 md:py-32">
        <GsapReveal y={40} duration={1}>
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Why <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">One Platform</span>?
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              We're building the operating system for innovation—where every piece of the startup journey connects seamlessly.
            </p>
          </div>
        </GsapReveal>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Rocket className="w-8 h-8" />,
              title: "For Startups",
              description: "Everything you need to launch and scale, from validation to venture funding.",
              features: ["AI Validation", "Growth Tools", "Investor Access", "Resource Network"]
            },
            {
              icon: <TrendingUp className="w-8 h-8" />,
              title: "For Investors",
              description: "Curated deal flow, due diligence tools, and portfolio management in one place.",
              features: ["Smart Deals", "Analytics", "Portfolio Tracking", "Market Insights"]
            },
            {
              icon: <Shield className="w-8 h-8" />,
              title: "For Ecosystem",
              description: "Manage programs, events, and community engagement with powerful admin tools.",
              features: ["Program Management", "Event Coordination", "Community Building", "Analytics"]
            }
          ].map((item, idx) => (
            <GsapReveal key={idx} delay={idx * 0.2} y={30}>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 hover:shadow-xl transition-all duration-500 group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{item.description}</p>
                <ul className="space-y-2">
                  {item.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </GsapReveal>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="relative mx-auto max-w-7xl px-4 py-20 md:py-32">
        <GsapReveal y={40} duration={1}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Built for <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">Every Role</span>
            </h2>
            <p className="text-xl text-gray-600">
              Experience tailored interfaces and tools designed specifically for your needs in the innovation ecosystem.
            </p>
          </div>
        </GsapReveal>

        <RoleCards />
      </section>

      {/* Features Section */}
      <section id="features" className="relative mx-auto max-w-7xl px-4 py-20 md:py-32">
        <GsapReveal y={40} duration={1}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful <span className="bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">Features</span>
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to succeed, integrated into one seamless platform.
            </p>
          </div>
        </GsapReveal>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <MessageCircle className="w-8 h-8" />,
              title: "Real-time Chat",
              description: "Connect instantly with your network",
              gradient: "from-blue-400 to-cyan-500"
            },
            {
              icon: <BarChart3 className="w-8 h-8" />,
              title: "AI Analytics",
              description: "Smart insights and growth tracking",
              gradient: "from-green-400 to-emerald-500"
            },
            {
              icon: <Users className="w-8 h-8" />,
              title: "Event Hub",
              description: "Network and learn from experts",
              gradient: "from-purple-400 to-pink-500"
            },
            {
              icon: <Shield className="w-8 h-8" />,
              title: "Secure Platform",
              description: "Enterprise-grade security",
              gradient: "from-orange-400 to-red-500"
            }
          ].map((feature, idx) => (
            <GsapReveal key={idx} delay={idx * 0.15} y={20}>
              <div className="group text-center p-6 hover:transform hover:scale-105 transition-all duration-300">
                <div className={`w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center text-white mx-auto mb-6 group-hover:shadow-lg transition-all duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            </GsapReveal>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative mx-auto max-w-7xl px-4 py-20 md:py-32">
        <GsapReveal y={40} duration={1}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by <span className="bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent">Innovators</span>
            </h2>
            <p className="text-xl text-gray-600">
              Join hundreds of startups and investors who are building the future with StartHub.
            </p>
          </div>
        </GsapReveal>

        <Testimonials />
      </section>

      {/* Final CTA Section */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20 md:pb-32">
        <GsapReveal y={50} duration={1.2}>
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2" />
            
            <div className="relative z-10">
              <h3 className="text-3xl md:text-5xl font-bold mb-6">Ready to Launch Your Journey?</h3>
              <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
                Join the platform that's revolutionizing how startups grow and investors discover the next big thing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGetStarted}
                  className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Start Free Trial
                </button>
                <button
                  onClick={handleExploreDemo}
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-2xl font-bold hover:bg-white hover:text-blue-600 transition-all duration-300 hover:scale-105"
                >
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </GsapReveal>
      </section>

      <Footer />
    </main>
  );
};

export default LandingPage;