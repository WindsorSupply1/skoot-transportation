'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Phone, Mail } from 'lucide-react';
import NavigationHeader from '../../components/layout/NavigationHeader';
import { useAuth } from '../../components/auth/AuthProvider';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showHeaderBooking, setShowHeaderBooking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const faqs = [
    {
      category: 'booking',
      question: 'How do I book a ride with Skoot?',
      answer: 'Booking is easy! Use our online booking form above, select your date, departure time, and number of passengers. Choose your ticket type (first 100, regular, student, military, or round trip). You\'ll receive a confirmation email with your reservation details and pickup instructions within minutes.'
    },
    {
      category: 'booking',
      question: 'Can I cancel or change my reservation?',
      answer: 'Yes! You can cancel up to 2 hours before your scheduled departure for a full refund. Changes can be made up to 4 hours before departure for a $5 fee. Cancellations made less than 2 hours before departure are subject to a $5 processing fee.'
    },
    {
      category: 'travel',
      question: 'Where exactly do you pick up and drop off?',
      answer: 'We pick up from two convenient locations in Columbia: across from Hotel Trundle downtown and at McDonald\'s on Parklane Road. Drop-off is directly at Charlotte Douglas International Airport terminals.'
    },
    {
      category: 'travel',
      question: 'How long does the trip take?',
      answer: 'The total journey takes 100-130 minutes including our 10-minute Rock Hill stop, depending on traffic conditions and time of day. Times are estimates only. We strongly recommend arriving at the airport at least 2 hours before your boarding time.'
    },
    {
      category: 'pricing',
      question: 'What\'s the difference between pricing tiers?',
      answer: 'First 100 customers get $31 forever - this rate is locked in permanently once you book. After that, regular rate is $35. Students and military personnel get $32 forever with valid ID. Round trip tickets save you $8 compared to two one-way tickets.'
    },
    {
      category: 'safety',
      question: 'Are your drivers licensed and insured?',
      answer: 'Yes, all Skoot drivers hold commercial driver\'s licenses with passenger endorsements, undergo comprehensive background checks and drug testing, and receive regular safety training. We carry $2M in commercial insurance coverage and are fully DOT certified.'
    }
  ];

  const filteredFaqs = selectedCategory === 'all' ? faqs : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const updateAvailability = (timeSelect: HTMLSelectElement, indicator: HTMLElement) => {
    const selectedTime = timeSelect.value;
    if (!selectedTime) {
      indicator.textContent = '';
      return;
    }
    
    const popularTimes = ['2:00 PM', '6:00 PM'];
    const limitedTimes = ['8:00 AM', '8:00 PM'];
    
    if (popularTimes.includes(selectedTime)) {
      indicator.textContent = '⚡ Popular time - 3 seats left';
      indicator.style.color = '#FF6600';
    } else if (limitedTimes.includes(selectedTime)) {
      indicator.textContent = '✅ 8 seats available';
      indicator.style.color = '#28A745';
    } else {
      indicator.textContent = '✅ 12 seats available';
      indicator.style.color = '#28A745';
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooking(true);
    
    // Simulate booking process
    setTimeout(() => {
      const ref = '#SK' + Date.now().toString().slice(-6);
      setBookingRef(ref);
      setIsBooking(false);
      setShowModal(true);
    }, 2000); // 2 second realistic booking time
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 800) {
        setShowHeaderBooking(true);
      } else {
        setShowHeaderBooking(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333333;
          overflow-x: hidden;
        }

        .header-booking {
          position: fixed;
          top: 0;
          width: 100%;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(15px);
          z-index: 1002;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
          border-bottom: 3px solid #FF6600;
          transform: translateY(-100%);
          transition: transform 0.3s ease;
        }
        
        .header-booking.show {
          transform: translateY(0);
        }


        .promo-banner {
          background: linear-gradient(135deg, #FF6600 0%, #CC5200 100%);
          color: white;
          text-align: center;
          padding: 12px;
          margin-top: 64px;
          font-weight: bold;
          animation: bannerPulse 2s infinite;
        }

        @keyframes bannerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }

        .hero {
          background: linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 50%, #C0C0C0 100%);
          min-height: 90vh;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(45deg, transparent 30%, rgba(255, 102, 0, 0.1) 100%);
          z-index: 1;
        }

        .booking-widget {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 102, 0, 0.2);
        }

        .schedule-card {
          background: #F5F5F5;
          padding: 40px;
          border-radius: 15px;
          text-align: center;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .schedule-card:hover {
          transform: translateY(-10px);
          border-color: #FF6600;
          box-shadow: 0 15px 30px rgba(255, 102, 0, 0.1);
        }

        .pricing-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 40px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border: 3px solid transparent;
        }

        .pricing-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .pricing-card.featured {
          border-color: #FF6600;
          background: linear-gradient(135deg, #FFF5F0 0%, #FFEBE0 100%);
          transform: scale(1.05);
          position: relative;
        }

        .pricing-card.featured::before {
          content: 'LIMITED TIME';
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: #FF6600;
          color: white;
          padding: 5px 20px;
          border-radius: 20px;
          font-size: 0.8em;
          font-weight: bold;
        }

        .faq-item {
          margin-bottom: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .faq-item:hover {
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
        }

        .faq-question {
          padding: 20px 25px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          transition: all 0.3s ease;
          font-weight: 500;
          color: #1f2937;
        }

        .faq-question:hover {
          background: #f9fafb;
        }

        .faq-item.active .faq-question {
          background: #f3f4f6;
          color: #FF6600;
        }

        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, padding 0.4s ease;
          background: #fafafa;
        }

        .faq-item.active .faq-answer {
          max-height: 300px;
          padding: 20px 25px;
        }

        .sticky-book-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(135deg, #28A745 0%, #218838 100%);
          color: white;
          padding: 15px 25px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: bold;
          z-index: 1001;
          box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
          transition: all 0.3s ease;
          animation: pulse 3s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .modal {
          display: ${showModal ? 'block' : 'none'};
          position: fixed;
          z-index: 2000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(5px);
        }

        .modal-content {
          background-color: white;
          margin: 5% auto;
          padding: 40px;
          border-radius: 20px;
          width: 90%;
          max-width: 500px;
          position: relative;
          animation: modalSlideIn 0.3s ease;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .hero-container {
            grid-template-columns: 1fr;
            gap: 40px;
            text-align: center;
          }
          
          .hero-content h1 {
            font-size: 2.5em;
          }
        }
      `}</style>

      {/* Header Booking Widget */}
      <div className={`header-booking ${showHeaderBooking ? 'show' : ''}`}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px 20px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '20px', alignItems: 'center' }}>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#FF6600' }}>SKOOT</div>
          <form style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '15px', alignItems: 'end' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>Date</label>
              <input type="date" style={{ padding: '10px', border: '2px solid #E8E8E8', borderRadius: '8px', fontSize: '14px' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>Time</label>
              <select style={{ padding: '10px', border: '2px solid #E8E8E8', borderRadius: '8px', fontSize: '14px' }} required>
                <option value="">Select</option>
                <option value="6:00 AM">6:00 AM</option>
                <option value="8:00 AM">8:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="2:00 PM">2:00 PM</option>
                <option value="6:00 PM">6:00 PM</option>
                <option value="8:00 PM">8:00 PM</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>Passengers</label>
              <select style={{ padding: '10px', border: '2px solid #E8E8E8', borderRadius: '8px', fontSize: '14px' }} required>
                <option value="">Select</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5+">5+</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>Rate</label>
              <select style={{ padding: '10px', border: '2px solid #E8E8E8', borderRadius: '8px', fontSize: '14px' }} required>
                <option value="">Select Rate</option>
                <option value="firsthundred">First 100 - $31</option>
                <option value="regular">Regular - $35</option>
                <option value="student">Student - $32</option>
                <option value="military">Military - $32</option>
              </select>
            </div>
            <button type="submit" disabled={isBooking} style={{ background: isBooking ? '#ccc' : 'linear-gradient(135deg, #28A745 0%, #218838 100%)', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isBooking ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {isBooking ? (
                <>
                  <div className="skoot-loader"></div>
                  Processing...
                </>
              ) : 'Book Now'}
            </button>
          </form>
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            <strong>550+</strong> Happy Customers
          </div>
        </div>
      </div>

      {/* Sticky Book Now Button */}
      <Link href="/booking" className="sticky-book-btn">
        {isAuthenticated ? 'Book Another Trip' : 'Book Now - Starting $31'}
      </Link>

      {/* Navigation */}
      <NavigationHeader transparent={!showHeaderBooking} />

      {/* Promo Banner */}
      <div className="promo-banner">
        🎉 First 100 Customers Lock in $31 Rate FOREVER! After that: Regular $35, Student/Military $32 🎉
      </div>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
          <div>
            <h1 style={{ fontSize: '3.5em', color: '#333333', marginBottom: '20px', lineHeight: '1.2' }}>
              Columbia, SC to <span style={{ color: '#FF6600', fontWeight: 'bold' }}>Charlotte Airport</span> Shuttle
            </h1>
            <p style={{ fontSize: '1.4em', color: '#666666', marginBottom: '30px' }}>
              Reliable shuttle service every even hour - starting at just $31
            </p>
            
            <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '24px', height: '24px', background: '#FF6600', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>⏰</div>
                <span>Every Even Hour</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '24px', height: '24px', background: '#FF6600', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>💰</div>
                <span>Starting $31</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '24px', height: '24px', background: '#FF6600', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>🛡️</div>
                <span>Safe & Reliable</span>
              </div>
            </div>
          </div>
          
          <div className="booking-widget" id="book">
            <h3 style={{ color: '#FF6600', marginBottom: '25px', fontSize: '1.5em', textAlign: 'center' }}>Ready to Book Your Trip?</h3>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px', fontSize: '1.1em' }}>
              Secure booking with real-time availability, pickup location selection, and instant confirmation.
            </p>
            {isAuthenticated ? (
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ color: '#666', marginBottom: '15px', fontSize: '1em' }}>
                  Welcome back, {user?.name?.split(' ')[0]}! 
                </p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link 
                    href="/booking"
                    style={{ 
                      background: 'linear-gradient(135deg, #FF6600 0%, #E55A00 100%)', 
                      color: 'white', 
                      padding: '15px 30px', 
                      border: 'none', 
                      borderRadius: '12px', 
                      fontSize: '1.1em', 
                      fontWeight: 'bold', 
                      textDecoration: 'none',
                      display: 'inline-block',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(255, 102, 0, 0.3)'
                    }}
                  >
                    Book New Trip
                  </Link>
                  <Link 
                    href="/bookings"
                    style={{ 
                      background: 'white', 
                      color: '#FF6600', 
                      padding: '15px 30px', 
                      border: '2px solid #FF6600', 
                      borderRadius: '12px', 
                      fontSize: '1.1em', 
                      fontWeight: 'bold', 
                      textDecoration: 'none',
                      display: 'inline-block',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    My Bookings
                  </Link>
                </div>
              </div>
            ) : (
              <Link 
                href="/booking" 
                style={{ 
                  background: 'linear-gradient(135deg, #FF6600 0%, #E55A00 100%)', 
                  color: 'white', 
                  padding: '20px 40px', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontSize: '1.3em', 
                  fontWeight: 'bold', 
                  textDecoration: 'none',
                  display: 'block',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(255, 102, 0, 0.3)'
                }}
              >
                Book Your Seat - Starting $31
              </Link>
            )}
            <p style={{ textAlign: 'center', color: '#888', marginTop: '15px', fontSize: '0.9em' }}>
              ✓ Secure Payment ✓ Instant Confirmation ✓ Choose Pickup Location
            </p>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section style={{ padding: '80px 0', background: 'white' }} id="schedule">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5em', color: '#333333', marginBottom: '15px' }}>Daily Schedule & Estimated Arrivals</h2>
            <p style={{ fontSize: '1.2em', color: '#666666' }}>Columbia departures with estimated CLT arrival times (includes Rock Hill stop)</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', marginTop: '40px' }}>
            <div className="schedule-card">
              <h3 style={{ color: '#FF6600', marginBottom: '15px', fontSize: '1.5em' }}>Morning Departures</h3>
              <p>Early departure times</p>
              <div style={{ display: 'grid', gap: '10px', margin: '20px 0' }}>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', fontWeight: 'bold', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>6:00 AM Departure</span>
                  <span style={{ fontSize: '0.9em', color: '#666', fontWeight: 'normal' }}>Arrives ~7:45-8:20 AM</span>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', fontWeight: 'bold', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>8:00 AM Departure</span>
                  <span style={{ fontSize: '0.9em', color: '#666', fontWeight: 'normal' }}>Arrives ~9:45-10:20 AM</span>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', fontWeight: 'bold', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>10:00 AM Departure</span>
                  <span style={{ fontSize: '0.9em', color: '#666', fontWeight: 'normal' }}>Arrives ~11:45 AM-12:20 PM</span>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', fontWeight: 'bold', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>12:00 PM Departure</span>
                  <span style={{ fontSize: '0.9em', color: '#666', fontWeight: 'normal' }}>Arrives ~1:45-2:20 PM</span>
                </div>
              </div>
            </div>
            
            <div className="schedule-card">
              <h3 style={{ color: '#FF6600', marginBottom: '15px', fontSize: '1.5em' }}>Evening Departures</h3>
              <p>Afternoon & evening times</p>
              <div style={{ display: 'grid', gap: '10px', margin: '20px 0' }}>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', fontWeight: 'bold', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>2:00 PM Departure</span>
                  <span style={{ fontSize: '0.9em', color: '#666', fontWeight: 'normal' }}>Arrives ~3:45-4:20 PM</span>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', fontWeight: 'bold', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>6:00 PM Departure</span>
                  <span style={{ fontSize: '0.9em', color: '#666', fontWeight: 'normal' }}>Arrives ~7:45-8:20 PM</span>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', fontWeight: 'bold', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>8:00 PM Departure</span>
                  <span style={{ fontSize: '0.9em', color: '#666', fontWeight: 'normal' }}>Arrives ~9:45-10:20 PM</span>
                </div>
              </div>
            </div>
            
            <div className="schedule-card">
              <h3 style={{ color: '#FF6600', marginBottom: '15px', fontSize: '1.5em' }}>⚠️ Important Reminder</h3>
              <p style={{ color: '#FF6600', fontWeight: 'bold' }}>Plan Your Flight Accordingly</p>
              <div style={{ textAlign: 'left', margin: '20px 0', padding: '20px', background: '#FFF5F0', borderRadius: '10px' }}>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '10px' }}>🚨 <strong>Arrive 2+ hours before boarding time</strong></li>
                  <li style={{ marginBottom: '10px' }}>🛑 <strong>Includes 10-min Rock Hill stop</strong></li>
                  <li style={{ marginBottom: '10px' }}>🚦 Traffic + stop can extend travel time</li>
                  <li style={{ marginBottom: '10px' }}>⏰ Times are estimates, not guarantees</li>
                  <li>✈️ We recommend earlier shuttles for important flights</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ padding: '80px 0', background: 'linear-gradient(135deg, #E8E8E8 0%, #C0C0C0 100%)' }} id="pricing">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5em', color: '#333333', marginBottom: '15px' }}>Simple, Fair Pricing</h2>
            <p style={{ fontSize: '1.2em', color: '#666666' }}>No surge pricing, no hidden fees</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginTop: '40px' }}>
            <div className="pricing-card featured">
              <h3>First 100 Customers</h3>
              <div style={{ fontSize: '3em', fontWeight: 'bold', color: '#FF6600', margin: '20px 0' }}>$31</div>
              <p style={{ color: '#666', marginBottom: '20px', fontWeight: '500' }}>FOREVER - Lock in this rate!</p>
              <ul style={{ listStyle: 'none', margin: '20px 0' }}>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Reserved seat</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ WiFi & charging ports</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Professional driver</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Up to 2 bags included</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Rate locked permanently</li>
              </ul>
            </div>
            
            <div className="pricing-card">
              <h3>Regular Rate</h3>
              <div style={{ fontSize: '3em', fontWeight: 'bold', color: '#FF6600', margin: '20px 0' }}>$35</div>
              <p style={{ color: '#666', marginBottom: '20px', fontWeight: '500' }}>Per person, one way</p>
              <ul style={{ listStyle: 'none', margin: '20px 0' }}>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Reserved seat</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ WiFi & charging ports</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Professional driver</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Up to 2 bags included</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Door-to-terminal service</li>
              </ul>
            </div>
            
            <div className="pricing-card">
              <h3>Student & Military</h3>
              <div style={{ fontSize: '3em', fontWeight: 'bold', color: '#FF6600', margin: '20px 0' }}>$32</div>
              <p style={{ color: '#666', marginBottom: '20px', fontWeight: '500' }}>With valid ID - Forever rate!</p>
              <ul style={{ listStyle: 'none', margin: '20px 0' }}>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Same great service</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Valid student/military ID</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Rate locked permanently</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ No expiration date</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Transferable to family</li>
              </ul>
            </div>
            
            <div className="pricing-card">
              <h3>Round Trip</h3>
              <div style={{ fontSize: '3em', fontWeight: 'bold', color: '#FF6600', margin: '20px 0' }}>$62</div>
              <p style={{ color: '#666', marginBottom: '20px', fontWeight: '500' }}>Save $8 on return</p>
              <ul style={{ listStyle: 'none', margin: '20px 0' }}>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Flexible return date</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Valid for 30 days</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Any available departure</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Best value option</li>
                <li style={{ padding: '8px 0', color: '#333' }}>✓ Change return for $5</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '80px 0', background: 'white' }} id="faq">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5em', color: '#333333', marginBottom: '15px' }}>Frequently Asked Questions</h2>
            <p style={{ fontSize: '1.2em', color: '#666666' }}>Everything you need to know about Skoot</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['all', 'booking', 'travel', 'pricing', 'safety'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '8px 20px',
                  border: '2px solid #FF6600',
                  background: selectedCategory === category ? '#FF6600' : 'white',
                  color: selectedCategory === category ? 'white' : '#FF6600',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '0.95em',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
          
          <div>
            {filteredFaqs.map((faq, index) => (
              <div key={index} className={`faq-item ${openFaq === index ? 'active' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(index)}>
                  <span>{faq.question}</span>
                  <span style={{ fontSize: '1.5em', color: '#FF6600', transition: 'transform 0.3s ease', transform: openFaq === index ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
                </div>
                <div className="faq-answer">
                  <p style={{ color: '#4b5563', lineHeight: '1.7' }}>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Early Bird CTA */}
      <section style={{ padding: '80px 0', background: 'linear-gradient(135deg, #FF6600 0%, #CC5200 100%)', color: 'white', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ fontSize: '2.5em', marginBottom: '20px' }}>First 100 Customers Special</h2>
          <p style={{ fontSize: '1.2em', marginBottom: '30px', opacity: 0.9 }}>Lock in the $31 rate forever! Join our founding members and never pay more.</p>
          <Link href="/booking" style={{ background: 'white', color: '#FF6600', padding: '18px 40px', border: 'none', borderRadius: '30px', fontSize: '1.2em', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none', display: 'inline-block', transition: 'all 0.3s ease' }}>
            {isAuthenticated ? 'Book Your Next Trip' : 'Secure Your Spot'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#333333', color: 'white', padding: '40px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '30px' }}>
            <div>
              <h3 style={{ color: '#FF6600', marginBottom: '15px' }}>Contact Info</h3>
              <p style={{ color: '#C0C0C0', marginBottom: '5px' }}>📞 +1-803-SKOOT-SC</p>
              <p style={{ color: '#C0C0C0', marginBottom: '5px' }}>✉️ hello@skoot.bike</p>
              <p style={{ color: '#C0C0C0', marginBottom: '5px' }}>🕐 Customer Service: 6am-10pm</p>
            </div>
            
            <div>
              <h3 style={{ color: '#FF6600', marginBottom: '15px' }}>Service Area</h3>
              <p style={{ color: '#C0C0C0', marginBottom: '5px' }}>Columbia to CLT Airport</p>
              <p style={{ color: '#C0C0C0', marginBottom: '5px' }}>Downtown Columbia Pickup</p>
              <p style={{ color: '#C0C0C0', marginBottom: '5px' }}>Parklane Road Pickup</p>
              <p style={{ color: '#C0C0C0', marginBottom: '5px' }}>Rock Hill Stop (10 min)</p>
            </div>
            
            <div>
              <h3 style={{ color: '#FF6600', marginBottom: '15px' }}>Quick Links</h3>
              <a href="#schedule" style={{ color: '#C0C0C0', textDecoration: 'none', marginBottom: '5px', display: 'block' }}>Schedule</a>
              <a href="#pricing" style={{ color: '#C0C0C0', textDecoration: 'none', marginBottom: '5px', display: 'block' }}>Pricing</a>
              <a href="/booking" style={{ color: '#C0C0C0', textDecoration: 'none', marginBottom: '5px', display: 'block' }}>Book Now</a>
              <a href="#faq" style={{ color: '#C0C0C0', textDecoration: 'none', marginBottom: '5px', display: 'block' }}>FAQ</a>
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid #666666', paddingTop: '20px', color: '#8C8C8C' }}>
            <p>&copy; 2025 Skoot Transportation. All rights reserved. Licensed and insured shuttle service.</p>
          </div>
        </div>
      </footer>

      {/* Success Modal */}
      <div className="modal" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <span style={{ color: '#aaa', float: 'right', fontSize: '28px', fontWeight: 'bold', cursor: 'pointer', position: 'absolute', top: '15px', right: '20px' }} onClick={() => setShowModal(false)}>&times;</span>
          <div style={{ textAlign: 'center', fontSize: '4em', color: '#28A745', marginBottom: '20px' }}>✅</div>
          <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>Booking Confirmed!</h2>
          <p style={{ textAlign: 'center', color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
            Your reservation has been submitted successfully. You'll receive a confirmation email with pickup details and driver contact information within 5 minutes.
          </p>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
            <strong>Booking Reference:</strong> <span>{bookingRef}</span>
          </p>
          <button onClick={() => setShowModal(false)} style={{ background: '#FF6600', color: 'white', padding: '15px 30px', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', display: 'block', margin: '0 auto', transition: 'all 0.3s ease' }}>
            Great, Thanks!
          </button>
        </div>
      </div>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Skoot Shuttle",
            "image": "https://skoot.bike/logo.jpg",
            "url": "https://skoot.bike",
            "telephone": "+1-803-SKOOT-SC",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Columbia Area",
              "addressLocality": "Columbia",
              "addressRegion": "SC",
              "postalCode": "29201",
              "addressCountry": "US"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 34.0007,
              "longitude": -81.0348
            },
            "openingHours": "Mo-Su 06:00-20:00",
            "priceRange": "$31-$62",
            "description": "Professional shuttle service from Columbia, SC to Charlotte Douglas International Airport with hourly departures.",
            "serviceArea": {
              "@type": "GeoCircle",
              "geoMidpoint": {
                "@type": "GeoCoordinates",
                "latitude": 34.0007,
                "longitude": -81.0348
              },
              "geoRadius": "50000"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Shuttle Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Columbia to Charlotte Airport Shuttle",
                    "description": "Reliable shuttle service to Charlotte Douglas International Airport"
                  },
                  "price": "31",
                  "priceCurrency": "USD"
                }
              ]
            },
            "sameAs": [
              "https://facebook.com/skoottransportation",
              "https://twitter.com/skoottransport"
            ]
          })
        }}
      />

      {/* Custom Loading Animation Styles */}
      <style jsx global>{`
        .skoot-loader {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: skoot-spin 1s linear infinite;
          position: relative;
        }

        .skoot-loader::before {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border: 2px solid transparent;
          border-top: 2px solid #FF6600;
          border-radius: 50%;
          animation: skoot-spin 1.5s linear infinite reverse;
        }

        @keyframes skoot-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .skoot-loader-bus {
          width: 24px;
          height: 24px;
          background: #FF6600;
          border-radius: 4px;
          position: relative;
          animation: skoot-move 2s ease-in-out infinite;
        }

        .skoot-loader-bus::before {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          right: 3px;
          height: 8px;
          background: white;
          border-radius: 2px;
        }

        .skoot-loader-bus::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 2px;
          width: 4px;
          height: 4px;
          background: #333;
          border-radius: 50%;
          box-shadow: 14px 0 0 #333;
        }

        @keyframes skoot-move {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(10px); }
        }

        .modal {
          display: ${showModal ? 'block' : 'none'};
          position: fixed;
          z-index: 2000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
          backdrop-filter: blur(5px);
        }

        .modal-content {
          background-color: white;
          margin: 10% auto;
          padding: 40px;
          border-radius: 15px;
          width: 90%;
          max-width: 500px;
          position: relative;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .sticky-book-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(135deg, #FF6600 0%, #E55A00 100%);
          color: white;
          padding: 15px 25px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: bold;
          box-shadow: 0 4px 15px rgba(255, 102, 0, 0.4);
          z-index: 1000;
          animation: pulse 2s infinite;
          transition: all 0.3s ease;
        }

        .sticky-book-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 102, 0, 0.6);
        }

        @keyframes pulse {
          0% { box-shadow: 0 4px 15px rgba(255, 102, 0, 0.4); }
          50% { box-shadow: 0 4px 25px rgba(255, 102, 0, 0.8); }
          100% { box-shadow: 0 4px 15px rgba(255, 102, 0, 0.4); }
        }

        .header-booking {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          z-index: 1500;
          padding: 15px 0;
          transform: translateY(${showHeaderBooking ? '0' : '-100%'});
          transition: transform 0.3s ease;
        }

        .booking-widget {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          margin-top: 40px;
        }

        .faq-category-btn {
          background: transparent;
          border: 2px solid #E8E8E8;
          padding: 8px 16px;
          border-radius: 20px;
          margin: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #666;
          font-weight: 500;
        }

        .faq-category-btn.active {
          background: #FF6600;
          border-color: #FF6600;
          color: white;
        }

        .faq-category-btn:hover {
          border-color: #FF6600;
          color: #FF6600;
        }

        .faq-item {
          border: 1px solid #E8E8E8;
          border-radius: 10px;
          margin-bottom: 15px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .faq-item:hover {
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .faq-question {
          background: white;
          padding: 20px;
          cursor: pointer;
          border: none;
          width: 100%;
          text-align: left;
          font-size: 1.1em;
          font-weight: 600;
          color: #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .faq-question:hover {
          background: #f8f9fa;
        }

        .faq-answer {
          padding: 0 20px 20px;
          color: #666;
          line-height: 1.6;
        }

        .pricing-card {
          background: white;
          padding: 40px;
          border-radius: 15px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
          text-align: center;
          transition: transform 0.3s ease;
        }

        .pricing-card:hover {
          transform: translateY(-5px);
        }

        @media (max-width: 768px) {
          .sticky-book-btn {
            bottom: 10px;
            right: 10px;
            padding: 12px 20px;
            font-size: 14px;
          }
          
          .booking-widget {
            padding: 20px;
            margin-top: 20px;
          }
          
          .modal-content {
            margin: 20% auto;
            padding: 20px;
            width: 95%;
          }
        }
      `}</style>
    </>
  );
}