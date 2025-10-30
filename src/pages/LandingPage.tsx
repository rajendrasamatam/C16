import React, { useState, useEffect } from 'react';

/**
 * Component to inject all necessary CSS styles into the document head.
 * This combines the styles from LandingPage.css and DemoModal.css.
 */
const VitalrouteStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');

    body {
        font-family: 'Inter', sans-serif;
        background-color: #0a0a0a;
        color: #e5e7eb;
    }

    .gradient-text {
        background: linear-gradient(90deg, #3b82f6, #ef4444);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-fill-color: transparent;
    }

    .hero-glow {
        box-shadow: 0 0 80px 20px rgba(59, 130, 246, 0.2), 0 0 100px 30px rgba(239, 68, 68, 0.2);
    }

    .feature-card {
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
    }

    .feature-card:hover {
        transform: translateY(-5px);
        border-color: rgba(59, 130, 246, 0.5);
    }

    /* Styling for the modal overlay and content */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
    }

    .modal-content {
        background: #1a1a1a;
        padding: 2rem;
        border-radius: 1rem;
        width: 90%;
        max-width: 600px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        position: relative;
    }

    .modal-close-button {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        color: #fff;
        font-size: 2rem;
        cursor: pointer;
        line-height: 1;
    }

    /* Styling for the animation container */
    .demo-container {
        position: relative;
        height: 250px;
        background-color: #334155; /* slate-700 */
        border-radius: 0.5rem;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .road {
        position: absolute;
        bottom: 40%;
        left: 0;
        width: 100%;
        height: 60px;
        background-color: #475569; /* slate-600 */
        border-top: 2px dashed #94a3b8; /* slate-400 */
        border-bottom: 2px dashed #94a3b8; /* slate-400 */
    }

    /* --- Ambulance Animation --- */
    .ambulance {
        position: absolute;
        font-size: 2.5rem;
        bottom: calc(40% + 5px); /* Position slightly above the road */
        z-index: 10;
        right: -15%; /* Start off-screen right */
        left: auto; /* Ensure left property doesn't interfere */
        transform: translateX(50%); /* Only translate to center the emoji */
        transition: right 4.5s linear; /* Transition the 'right' property */
    }

    .ambulance.moving {
        right: 50%; /* Moves to the center from the right */
    }

    .ambulance.passed {
        right: 115%; /* Moves off-screen to the left */
    }

    /* Traffic light styling */
    .traffic-light-pole {
        position: absolute;
        bottom: 50%;
        left: 50%;
        transform: translateX(-50%);
        width: 10px;
        height: 50px;
        background-color: #1e293b; /* slate-800 */
    }

    .traffic-light {
        position: absolute;
        top: -65px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #0f172a; /* slate-900 */
        padding: 8px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .light {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: #4b5563; /* gray-600 */
        opacity: 0.3;
        transition: all 0.3s ease;
    }

    .light.red.active {
        background-color: #ef4444; /* red-500 */
        opacity: 1;
        box-shadow: 0 0 10px #ef4444;
    }

    .light.green.active {
        background-color: #22c55e; /* green-500 */
        opacity: 1;
        box-shadow: 0 0 10px #22c55e;
    }

    /* Geofence styling */
    .geofence {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 300px; /* Size of the geofence */
        height: 300px;
        border: 3px dashed #3b82f6; /* blue-500 */
        border-radius: 50%;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
    }

    .geofence.active {
        opacity: 0.7;
    }

    /* Text description */
    .demo-text {
        position: absolute;
        bottom: 1rem;
        left: 0;
        width: 100%;
        text-align: center;
        color: white;
        font-weight: 600;
        font-size: 1.1rem;
        background: rgba(0, 0, 0, 0.4);
        padding: 0.5rem 0;
    }
  `}</style>
);


// Define the props for the DemoModal component
interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  // This effect runs the animation sequence
  useEffect(() => {
    if (isOpen) {
      // Reset animation on open
      setStep(0);
      const timers = [
        setTimeout(() => setStep(1), 500),   // Ambulance starts moving
        setTimeout(() => setStep(2), 2500),  // Geofence appears
        setTimeout(() => setStep(3), 3000),  // Light turns green
        setTimeout(() => setStep(4), 5000),  // Ambulance passes
        setTimeout(() => setStep(5), 6000),  // Light turns red again
        setTimeout(() => setStep(6), 7000),  // Show "Completed" text
      ];
      // Cleanup timers when the component unmounts or modal closes
      return () => timers.forEach(clearTimeout);
    }
  }, [isOpen]);

  // If the modal is not open, render nothing
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold text-center text-white mb-4">How Vitalroute Works</h2>
        <div className="demo-container">
          {/* Road */}
          <div className="road"></div>

          {/* Ambulance: CSS classes are applied based on the current 'step' */}
          <div className={`ambulance ${step >= 1 ? 'moving' : ''} ${step >= 4 ? 'passed' : ''}`}>
            🚑
          </div>

          {/* Traffic Light: The 'active' class is toggled based on the step */}
          <div className="traffic-light-pole">
            <div className="traffic-light">
              <div className={`light red ${step < 3 || step >= 5 ? 'active' : ''}`}></div>
              <div className={`light green ${step >= 3 && step < 5 ? 'active' : ''}`}></div>
            </div>
          </div>

          {/* Geofence: The 'active' class is toggled based on the step */}
          <div className={`geofence ${step >= 2 ? 'active' : ''}`}></div>

          {/* Text Description */}
          <div className="demo-text">
            {step === 0 && 'An ambulance is en route...'}
            {step === 1 && 'The ambulance is approaching the junction.'}
            {step === 2 && 'It enters the 500m geofence.'}
            {step === 3 && 'Vitalroute turns the light green automatically!'}
            {step === 4 && 'A clear path is created, saving precious time.'}
            {step >= 5 && 'The system returns to normal after the ambulance passes.'}
          </div>
        </div>
      </div>
    </div>
  );
};


// Define the props for the LandingPage component
interface LandingPageProps {
  onNavigateToLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to handle smooth scrolling to a section
  const handleScroll = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <VitalrouteStyles /> {/* Inject styles */}
      <div className="antialiased">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10 py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">🚨 Vitalroute</h1>
            <button
              onClick={onNavigateToLogin}
              className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dashboard Login
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="relative overflow-hidden">
          <div className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 hero-glow opacity-50"></div>
            <div className="relative text-center z-10">
              <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
                Paving the Way for <span className="gradient-text">Life-Savers</span>
              </h2>
              <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-300">
                Vitalroute is a smart traffic management system that reduces ambulance response time by dynamically controlling traffic lights with geofencing and live GPS tracking.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <button
                  onClick={() => handleScroll('overview')}
                  className="bg-white text-gray-900 font-semibold px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Learn More
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="border border-gray-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  View Demo
                </button>
              </div>
            </div>
          </div>

          {/* Project Overview */}
          <section id="overview" className="py-20 sm:py-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-base font-semibold text-blue-400 tracking-wider uppercase">Project Overview</h2>
                <p className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                  Intelligent Traffic Flow for Critical Moments
                </p>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                  Our system ensures a clear, uninterrupted path for ambulances, drastically cutting down travel time during emergencies. By integrating GPS, geofencing, and cloud technology, we turn every traffic light into a life-saving checkpoint.
                </p>
              </div>
            </div>
          </section>

          {/* Key Features Section */}
          <section id="features" className="py-20 sm:py-24 bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-base font-semibold text-blue-400 tracking-wider uppercase">Smart Features</h2>
                <p className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                  A Future-Ready Solution
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="feature-card p-8 rounded-2xl text-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-500/20 mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Dynamic Signal Switching</h3>
                  <p className="mt-2 text-gray-400">Traffic lights automatically turn green for ambulances in real-time as they approach a junction.</p>
                </div>
                {/* Feature 2 */}
                <div className="feature-card p-8 rounded-2xl text-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-500/20 mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Live Geofencing</h3>
                  <p className="mt-2 text-gray-400">Junctions create a 500-meter virtual boundary, detecting ambulance approach with high precision.</p>
                </div>
                {/* Feature 3 */}
                <div className="feature-card p-8 rounded-2xl text-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Admin Dashboard</h3>
                  <p className="mt-2 text-gray-400">Monitor all assets on a live map, track ambulances, and manually override signals when needed.</p>
                </div>
              </div>
            </div>
          </section>

          {/* System Architecture Section */}
          <section id="architecture" className="py-20 sm:py-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-base font-semibold text-blue-400 tracking-wider uppercase">How It Works</h2>
                <p className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                  A Seamless Four-Step Process
                </p>
              </div>
              <div className="relative">
                {/* The connecting line */}
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 -translate-y-1/2"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                  <div className="relative p-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-800 border-2 border-blue-500 rounded-full text-blue-400 font-bold text-2xl">1</div>
                    <h3 className="font-bold text-white">Ambulance Unit</h3>
                    <p className="text-gray-400">ESP32 & GPS module send live coordinates to the cloud.</p>
                  </div>
                  <div className="relative p-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-800 border-2 border-blue-500 rounded-full text-blue-400 font-bold text-2xl">2</div>
                    <h3 className="font-bold text-white">Firebase Cloud</h3>
                    <p className="text-gray-400">Receives location data and processes geofencing logic.</p>
                  </div>
                  <div className="relative p-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-800 border-2 border-blue-500 rounded-full text-blue-400 font-bold text-2xl">3</div>
                    <h3 className="font-bold text-white">Web Dashboard</h3>
                    <p className="text-gray-400">Admins monitor the system and can send manual commands.</p>
                  </div>
                  <div className="relative p-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-800 border-2 border-blue-500 rounded-full text-blue-400 font-bold text-2xl">4</div>
                    <h3 className="font-bold text-white">Traffic Light Node</h3>
                    <p className="text-gray-400">ESP32 controller receives commands and switches the lights.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Technology Stack */}
          <section className="py-20 sm:py-24 bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold text-white">Technology Stack</h2>
                <p className="mt-4 text-lg text-gray-400">Built with modern, reliable, and scalable technologies.</p>
              </div>
              <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white">React.js</h3>
                  <p className="text-gray-400">Frontend</p>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white">Firebase</h3>
                  <p className="text-gray-400">Backend & DB</p>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white">ESP32</h3>
                  <p className="text-gray-400">Hardware</p>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white">Google Maps API</h3>
                  <p className="text-gray-400">Geolocation</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400">&copy; 2025 Vitalroute Project. All Rights Reserved.</p>
            <p className="text-gray-500 mt-2">A Smart Solution for a Safer Tomorrow.</p>
          </div>
        </footer>
      </div>

      {/* The DemoModal component is rendered here */}
      <DemoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default LandingPage;