// components/Footer.tsx
export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Room Rental
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Find your perfect room in the city. Fast, easy, and reliable room rental service.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.611-3.192-1.551-.745-.94-1.084-2.165-.917-3.433.167-1.268.846-2.373 1.857-3.118 1.012-.745 2.28-1.084 3.548-.917 1.268.167 2.373.846 3.118 1.857.745 1.012 1.084 2.28.917 3.548-.167 1.268-.846 2.373-1.857 3.118-.745.611-1.685.917-2.653.917zm7.718 0c-.945 0-1.835-.389-2.503-1.084-.668-.695-1.028-1.64-1.028-2.613 0-.973.36-1.918 1.028-2.613.668-.695 1.558-1.084 2.503-1.084.945 0 1.835.389 2.503 1.084.668.695 1.028 1.64 1.028 2.613 0 .973-.36 1.918-1.028 2.613-.668.695-1.558 1.084-2.503 1.084z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Contact Us
            </h3>
            <div className="space-y-2 text-gray-600 dark:text-gray-300">
              <p>📧 roomrental.team@gmail.com</p>
              <p>📞 +1 (555) 123-4567</p>
              <p>📍 123 Rental Street, City, Country</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><a href="/about" className="hover:text-gray-900 dark:hover:text-white">About Us</a></li>
              <li><a href="/contact" className="hover:text-gray-900 dark:hover:text-white">Contact</a></li>
              <li><a href="/privacy" className="hover:text-gray-900 dark:hover:text-white">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-gray-900 dark:hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} Room Rental. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}