import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#3a3a3a] mt-12 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} Xperience Living. All rights reserved.
          </div>
          
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <Link 
              href="/terms" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              href="/privacy" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/contact" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>
        
      </div>
    </footer>
  );
}

