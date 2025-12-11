export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
        
        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Get in Touch</h2>
            <p className="mb-6">
              We're here to help! Reach out to us through any of the following methods:
            </p>
          </section>

          <section className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Email</h3>
            <p className="mb-2">
              For general inquiries, support, or questions:
            </p>
            <a 
              href="mailto:support@xperiencelivinginc.com" 
              className="text-[#0D6B4D] hover:text-[#0b5940] transition-colors"
            >
              support@xperiencelivinginc.com
            </a>
          </section>

          <section className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Phone</h3>
            <p className="mb-2">
              Call us to place your order or for customer support:
            </p>
            <a 
              href="tel:+12027967881" 
              className="text-[#0D6B4D] hover:text-[#0b5940] transition-colors text-lg font-semibold"
            >
              (202) 796-7881
            </a>
            <p className="text-sm text-gray-400 mt-2">
              Monday - Friday: 9:00 AM - 5:00 PM EST
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-4">Response Time</h3>
            <p>
              We aim to respond to all inquiries within 24-48 hours during business days.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-4">Live Chat</h3>
            <p>
              For immediate assistance, use our AI-powered chat assistant available on the homepage. 
              Our assistant is available 24/7 to help answer your questions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

