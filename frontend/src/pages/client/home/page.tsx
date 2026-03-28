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
      <section className="relative bg-gradient-to-br from-[#1a1d2e] via-[#1a1d2e] to-[#0f1117] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30 rt-gradient-brand" />

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm"
            >
              ✨ Premium Refurbished Tech at Unbeatable Prices
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Trade Smart,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066ff] to-[#00d9a3] dark:from-[#3b8eff] dark:to-[#00edb7]">
                Buy Smarter
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/80 mb-8">
              Discover certified refurbished devices with warranty. Trade in your old tech and upgrade with confidence.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-2 max-w-2xl mx-auto"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 z-20 -translate-y-1/2 h-5 w-5 text-foreground" />

                {!searchQuery && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-12 right-4 top-1/2 z-10 inline-flex max-w-[calc(100%-4rem)] -translate-y-1/2 items-center overflow-hidden"
                  >
                    <span className="shrink-0 whitespace-nowrap text-foreground">
                      Search for
                    </span>

                    <span
                      key={`${suggestionIndex}-${suggestionPhase}`}
                      className={`ml-1.5 inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap bg-[linear-gradient(to_left,transparent_0%,transparent_33%,var(--gradient-color)_50%,#0e1016_66%,#0e1016_100%)] bg-[length:300%_100%] bg-clip-text text-transparent [-webkit-text-fill-color:transparent] ${suggestionPhase === "hide" ? "gradient-conceal" : "gradient-reveal"
                        }`}
                      style={
                        {
                          "--show-duration": "2000ms",
                          "--hide-duration": "1000ms",
                          "--gradient-color": "#3F55BF",
                        } as CSSProperties
                      }
                    >
                      {searchSuggestions[suggestionIndex]}
                    </span>
                  </span>
                )}

                <input
                  aria-label="Search products"
                  placeholder=""
                  className="pl-12 h-14 w-full bg-card text-foreground border-0 shadow-xl rounded-md outline-none"
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
              className="flex flex-wrap gap-4 justify-center mt-8"
            >
              <Button size="lg" className="rt-bg-brand hover:opacity-90 text-white" onClick={() => navigate("/products")} type="button">
                Browse Products
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 hover:bg-white/10 text-foreground"
                onClick={() => navigate("/")}
                type="button"
              >
                Get Trade-In Quote
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                className="bg-card border border-border rounded-xl p-6 text-center hover:border-[#0066ff] dark:hover:border-[#3b8eff] transition-all group"
                type="button"
              >
                <category.icon className="h-12 w-12 mx-auto mb-3 text-muted-foreground group-hover:text-[#0066ff] dark:group-hover:text-[#3b8eff] transition-colors" />
                <h3 className="font-medium mb-1">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.count} items</p>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Deals</h2>
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

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">How Trade-In Works</h2>
            <p className="text-muted-foreground">Get instant value for your old devices in 3 easy steps</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                <div className="w-16 h-16 rounded-full rt-bg-brand text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
                {index < 2 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-4 h-6 w-6 text-muted-foreground" />
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="rt-bg-brand hover:opacity-90 text-white" onClick={() => navigate("/")} type="button">
              Start Trade-In
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-14 h-14 rounded-full bg-[#0066ff]/10 text-[#0066ff] dark:bg-[#3b8eff]/10 dark:text-[#3b8eff] flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Trusted by Thousands</h2>
            <p className="text-muted-foreground">See what our customers say about us</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#fbbf24] text-[#fbbf24]" />
                  ))}
                </div>
                <p className="text-foreground mb-4">{testimonial.text}</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{testimonial.name}</span>
                  <span className="text-xs text-muted-foreground">{testimonial.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">New Arrivals</h2>
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