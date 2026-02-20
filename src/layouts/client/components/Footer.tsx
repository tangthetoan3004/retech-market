import { Link } from "react-router-dom";

export default function Footer({ settingGeneral }: { settingGeneral?: any }) {
  const websiteName = settingGeneral?.websiteName || "ReTech Market";

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl rt-gradient-brand flex items-center justify-center overflow-hidden">
                <span className="text-white font-black text-2xl leading-none">R</span>
              </div>
              <div>
                <div className="font-bold text-lg">{websiteName}</div>
                <div className="text-xs text-muted-foreground">Refurbished & Trade-in</div>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Certified refurbished devices with warranty. Trade in your old tech and upgrade with confidence.
            </p>

            <div className="mt-6 flex gap-2">
              <a
                href="#"
                className="h-9 w-9 rounded-md border border-border bg-background hover:bg-accent inline-flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-3h2.5V9.5C10.5 7 12 5.7 14.3 5.7c1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.5V12H17l-.5 3h-2.8v7A10 10 0 0 0 22 12z" />
                </svg>
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-md border border-border bg-background hover:bg-accent inline-flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm9 2h-9A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4Zm-4.5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm6-2.1a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
                </svg>
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-md border border-border bg-background hover:bg-accent inline-flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M22 5.8a8.4 8.4 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.4 8.4 0 0 1-2.7 1A4.2 4.2 0 0 0 11.4 9a12 12 0 0 1-8.7-4.4A4.2 4.2 0 0 0 4 10.6a4.1 4.1 0 0 1-1.9-.5v.1A4.2 4.2 0 0 0 5.5 14a4.2 4.2 0 0 1-1.9.1 4.2 4.2 0 0 0 3.9 2.9A8.4 8.4 0 0 1 2 18.7 12 12 0 0 0 8.5 20.6c7.8 0 12.1-6.6 12.1-12.3v-.6A8.7 8.7 0 0 0 22 5.8Z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <div className="font-semibold mb-4">Shop</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/products" className="hover:text-foreground">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-foreground">
                  Trade-In
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-foreground">
                  Deals
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-foreground">
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-semibold mb-4">Support</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground">
                  Warranty
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-foreground">
                  Returns
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-foreground">
                  Shipping
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-semibold mb-4">Newsletter</div>
            <div className="text-sm text-muted-foreground mb-4">
              Get updates on new arrivals and deals.
            </div>
            <div className="flex gap-2">
              <input
                className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none"
                placeholder="Your email"
              />
              <button className="h-10 px-4 rounded-md rt-bg-brand text-white hover:opacity-90">
                Subscribe
              </button>
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              By subscribing, you agree to receive emails.
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} {websiteName}. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-foreground">Privacy</Link>
            <Link to="/" className="hover:text-foreground">Terms</Link>
            <Link to="/" className="hover:text-foreground">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
