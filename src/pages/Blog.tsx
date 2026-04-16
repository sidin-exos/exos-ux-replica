import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CalendarDays, Clock, ArrowRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { blogPosts } from "@/lib/blog-data";
import { Badge } from "@/components/ui/badge";

const Blog = () => {
  return (
    <>
      <Helmet>
        <title>Blog — EXOS Procurement Intelligence</title>
        <meta name="description" content="Insights on strategic procurement, supply chain risk, and AI-driven category management from the EXOS research team." />
      </Helmet>
      <Header />

      <main className="min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="container relative py-16 md:py-24">
            <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">EXOS Blog</p>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground max-w-3xl leading-tight">
              Strategic Procurement Thinking
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Research, frameworks, and analysis from the EXOS team — helping Category Managers move from transactional purchasing to strategic margin protection.
            </p>
          </div>
        </section>

        {/* Articles grid */}
        <section className="container py-12 md:py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group flex flex-col rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                <img
                  src={post.heroImage}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <div className="p-5 flex flex-col gap-2 flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <h3 className="font-display font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{post.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readingTime}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-muted/30">
          <div className="container py-12 text-center">
            <p className="text-muted-foreground mb-4">Want to see these frameworks in action?</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Try EXOS Scenarios <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Blog;
