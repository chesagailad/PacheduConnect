/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: CustomerTestimonials - handles frontend functionality
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CustomerTestimonialsProps {
  className?: string;
}

export default function CustomerTestimonials({ className = '' }: CustomerTestimonialsProps) {
  const testimonials = [
    {
      name: 'Sarah M.',
      location: 'Johannesburg',
      rating: 5,
      text: 'Pachedu made sending money to my family in Harare so easy. The rates are unbeatable!',
      avatar: '👩‍💼'
    },
    {
      name: 'David K.',
      location: 'Cape Town',
      rating: 5,
      text: 'Fast, secure, and reliable. My money arrived in under 3 hours. Highly recommended!',
      avatar: '👨‍💼'
    },
    {
      name: 'Maria T.',
      location: 'Durban',
      rating: 5,
      text: 'Best exchange rates I\'ve found. Customer service is excellent too.',
      avatar: '👩‍💼'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  return (
    <motion.section
      className={`py-16 bg-gradient-to-br from-gray-50 to-white ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by 50,000+ Customers
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See what our customers say about their experience with Pachedu
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-8"
          variants={containerVariants}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100 hover:shadow-medium transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">{testimonial.avatar}</div>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.location}</p>
                </div>
              </div>
              
              <div className="flex mb-3">
                {renderStars(testimonial.rating)}
              </div>
              
              <p className="text-gray-700 leading-relaxed">
                "{testimonial.text}"
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="text-center mt-12"
          variants={itemVariants}
        >
          <div className="inline-flex items-center space-x-4 bg-white rounded-xl px-6 py-3 shadow-soft">
            <div className="flex items-center space-x-1">
              <span className="text-2xl">⭐</span>
              <span className="font-semibold text-gray-900">4.9/5</span>
            </div>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">Based on 2,847 reviews</span>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
} 