import React from 'react';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  photo: string;
  content: string;
  rating: number;
  date: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Tendai Moyo",
    location: "Johannesburg",
    photo: "/api/placeholder/60/60",
    content: "I send money home to my family in Harare every month. PacheduConnect is the fastest and cheapest way. My family gets the money in minutes!",
    rating: 5,
    date: "2 days ago"
  },
  {
    id: 2,
    name: "Sarah Ndlovu",
    location: "Cape Town",
    photo: "/api/placeholder/60/60",
    content: "The exchange rates are unbeatable and the fees are so low. I've been using PacheduConnect for over a year now. Highly recommended!",
    rating: 5,
    date: "1 week ago"
  },
  {
    id: 3,
    name: "David Chikomba",
    location: "Durban",
    photo: "/api/placeholder/60/60",
    content: "Before PacheduConnect, I was struggling to send money to Zimbabwe. Now it's so easy and my family gets the money instantly.",
    rating: 5,
    date: "2 weeks ago"
  }
];

export default function CustomerTestimonials() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Don't take our word for it
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See what our customers have to say about their experience with PacheduConnect
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Customer Info */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-4">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.location}</div>
                  <div className="text-xs text-gray-500">{testimonial.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">50,000+</div>
            <div className="text-gray-600">Happy Customers</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">$50M+</div>
            <div className="text-gray-600">Total Transferred</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
            <div className="text-gray-600">Success Rate</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">2-5 min</div>
            <div className="text-gray-600">Average Transfer Time</div>
          </div>
        </div>
      </div>
    </section>
  );
} 