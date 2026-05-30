import { motion } from "motion/react";
import {
  Search,
  Upload,
  Smartphone,
  Laptop,
  Tablet,
  Headphones,
  ChevronRight,
  Star,
  Shield,
  Truck,
  RefreshCw,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { showAlert } from "../../../features/ui/uiSlice";
import { getHomeProducts } from "../../../services/client/products/productsService";
import ProductGrid from "../../../features/client/products/components/ProductGrid";

export default function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [featured, setFeatured] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const searchSuggestions = useMemo(
    () => [
      "iPhone",
      "MacBook",
      "Samsung",
      "iPad",
      "AirPods",
      "Apple Watch",
      "Dell XPS",
      "ThinkPad",
      "PlayStation 5",
      "Nintendo Switch",
    ],
    []
  );

  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [suggestionPhase, setSuggestionPhase] = useState<"show" | "hide">("show");
  const hideTimeoutRef = useRef<number | null>(null);
  const switchTimeoutRef = useRef<number | null>(null);

  const categories = useMemo(
    () => [
      { name: "Smartphones", icon: Smartphone, count: 156 },
      { name: "Laptops", icon: Laptop, count: 89 },
      { name: "Tablets", icon: Tablet, count: 45 },
      { name: "Headphones", icon: Headphones, count: 112 },
    ],
    []
  );

  const features = useMemo(
    () => [
      { icon: Shield, title: "12-Month Warranty", description: "All devices come with comprehensive warranty coverage" },
      { icon: RefreshCw, title: "Easy Trade-In", description: "Get instant quotes and upgrade to better devices" },
      { icon: Truck, title: "Free Shipping", description: "Fast and secure delivery to your doorstep" },
      { icon: Star, title: "Certified Quality", description: "Every device is tested and certified by experts" },
    ],
    []
  );

  const testimonials = useMemo(
    () => [
      {
        name: "Sarah Johnson",
        rating: 5,
        text: "Amazing experience! Got a Grade A iPhone that looks brand new. The trade-in process was seamless.",
        date: "2 days ago",
      },
      {
        name: "Michael Chen",
        rating: 5,
        text: "Best place to buy refurbished tech. Saved $500 on a MacBook Pro that works perfectly!",
        date: "1 week ago",
      },
      {
        name: "Emma Davis",
        rating: 5,
        text: "Great customer service and quality products. Will definitely buy again.",
        date: "2 weeks ago",
      },
    ],
    []
  );

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getHomeProducts();
        setFeatured(Array.isArray(data?.productsFeatured) ? data.productsFeatured : []);
        setNews(Array.isArray(data?.productsNew) ? data.productsNew : []);
      } catch (e: any) {
        dispatch(showAlert({ type: "error", message: e?.message || "Không tải được trang chủ", timeout: 1000 }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [dispatch]);

  useEffect(() => {
    const HIDE_DURATION = 1000;
    const TOTAL_DURATION = 4500;

    const clearTimers = () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      if (switchTimeoutRef.current) {
        window.clearTimeout(switchTimeoutRef.current);
        switchTimeoutRef.current = null;
      }
    };

    const runCycle = () => {
      setSuggestionPhase("show");

      hideTimeoutRef.current = window.setTimeout(() => {
        setSuggestionPhase("hide");
      }, TOTAL_DURATION - HIDE_DURATION);

      switchTimeoutRef.current = window.setTimeout(() => {
        setSuggestionIndex((prev) => (prev + 1) % searchSuggestions.length);
        runCycle();
      }, TOTAL_DURATION);
    };

    clearTimers();
    setSuggestionIndex(0);
    setSuggestionPhase("show");
    runCycle();

    return () => {
      clearTimers();
    };
  }, [searchSuggestions]);

  const onSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/search?keyword=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1d2e] via-[#1a1d2e] to-[#0f1117] text-white">
        <div className="absolute inset-0 rt-gradient-brand opacity-30" />

        <div className="relative z-10 mx-auto w-full max-w-[1260px] px-5 py-20 lg:px-7 xl:px-9 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 inline-block rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm"
            >
              ✨ Premium Refurbished Tech at Unbeatable Prices
            </motion.div>

            <h1 className="mb-6 text-4xl font-bold md:text-6xl">
              Trade Smart,
              <br />
              <span className="bg-gradient-to-r from-[#0066ff] to-[#00d9a3] bg-clip-text text-transparent dark:from-[#3b8eff] dark:to-[#00edb7]">
                Buy Smarter
              </span>
            </h1>

            <p className="mb-8 text-lg text-white/80 md:text-xl">
              Discover certified refurbished devices with warranty. Trade in your old tech and upgrade with confidence.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mx-auto flex max-w-2xl gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 z-20 h-5 w-5 -translate-y-1/2 text-foreground" />

                {!searchQuery && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-12 right-4 top-1/2 z-10 inline-flex max-w-[calc(100%-4rem)] -translate-y-1/2 items-center overflow-hidden"
                  >
                    <span className="shrink-0 whitespace-nowrap text-white/55">
                      Search for iPhone, MacBook, Samsung...
                    </span>
                  </span>
                )}

                <input
                  aria-label="Search products"
                  placeholder=""
                  className="h-14 w-full rounded-md border-0 bg-card pl-12 text-foreground shadow-xl outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) onSearch();
                  }}
                />
              </div>

              <Button
                size="lg"
                className="h-14 bg-card text-foreground hover:bg-card"
                onClick={() => navigate("/")}
                type="button"
              >
                <Upload className="h-5 w-5" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex flex-wrap justify-center gap-4"
            >
              <Button size="lg" className="rt-bg-brand text-white hover:opacity-90" onClick={() => navigate("/products")} type="button">
                Browse Products
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-foreground hover:bg-white/10"
                onClick={() => navigate("/")}
                type="button"
              >
                Get Trade-In Quote
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto w-full max-w-[1260px] px-5 lg:px-7 xl:px-9">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {categories.map((category, index) => (
              <motion.button
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/products")}
                className="group rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-[#0066ff] dark:hover:border-[#3b8eff]"
                type="button"
              >
                <category.icon className="mx-auto mb-3 h-12 w-12 text-muted-foreground transition-colors group-hover:text-[#0066ff] dark:group-hover:text-[#3b8eff]" />
                <h3 className="mb-1 font-medium">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.count} items</p>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto w-full max-w-[1260px] px-5 lg:px-7 xl:px-9">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="mb-2 text-3xl font-bold">Featured Deals</h2>
              <p className="text-muted-foreground">Handpicked premium devices at great prices</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/products")} type="button">
              View All
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {loading ? <div className="text-muted-foreground">Loading...</div> : <ProductGrid items={featured} />}
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto w-full max-w-[1260px] px-5 lg:px-7 xl:px-9">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold">How Trade-In Works</h2>
            <p className="text-muted-foreground">Get instant value for your old devices in 3 easy steps</p>
          </motion.div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {[
              { step: "1", title: "Get Estimate", desc: "Answer a few questions about your device" },
              { step: "2", title: "Ship for Free", desc: "We'll send you a prepaid shipping label" },
              { step: "3", title: "Get Paid", desc: "Receive payment or credit within 48 hours" },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full rt-bg-brand text-2xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
                {index < 2 && (
                  <ChevronRight className="absolute -right-4 top-8 hidden h-6 w-6 text-muted-foreground md:block" />
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" className="rt-bg-brand text-white hover:opacity-90" onClick={() => navigate("/")} type="button">
              Start Trade-In
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto w-full max-w-[1260px] px-5 lg:px-7 xl:px-9">
          <div className="grid gap-6 md:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0066ff]/10 text-[#0066ff] dark:bg-[#3b8eff]/10 dark:text-[#3b8eff]">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto w-full max-w-[1260px] px-5 lg:px-7 xl:px-9">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold">Trusted by Thousands</h2>
            <p className="text-muted-foreground">See what our customers say about us</p>
          </motion.div>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-3 flex items-center gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#fbbf24] text-[#fbbf24]" />
                  ))}
                </div>
                <p className="mb-4 text-foreground">{testimonial.text}</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{testimonial.name}</span>
                  <span className="text-xs text-muted-foreground">{testimonial.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto w-full max-w-[1260px] px-5 lg:px-7 xl:px-9">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="mb-2 text-3xl font-bold">New Arrivals</h2>
              <p className="text-muted-foreground">Fresh inventory, just landed</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/products")} type="button">
              View All
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {loading ? <div className="text-muted-foreground">Loading...</div> : <ProductGrid items={news} />}
        </div>
      </section>
    </div>
  );
}