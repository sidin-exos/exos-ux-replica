import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CalendarDays, Clock, ArrowRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { blogPosts } from "@/lib/blog-data";
import { Badge } from "@/components/ui/badge";

const Blog = () => {
  const featured = blogPosts[0];
  const rest = blogPosts.slice(1);

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

        {/* Featured post */}
        {featured && (
          <section className="container py-12 md:py-16">
            <Link
              to={`/blog/${featured.slug}`}
              className="group grid md:grid-cols-2 gap-8 items-center"
            >
              <div className="overflow-hidden rounded-xl border border-border">
                <img
                  src={featured.heroImage}
                  alt={featured.title}
                  className="w-full h-64 md:h-80 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {featured.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs font-medium">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {featured.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {featured.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" />
                    {new Date(featured.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {featured.readingTime}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary mt-2 group-hover:gap-2.5 transition-all">
                  Read article <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </section>
        )}

        {/* Additional posts grid (for future) */}
        {rest.length > 0 && (
          <section className="container pb-16">
            <h2 className="text-xl font-display font-bold text-foreground mb-8">More Articles</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
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
                      <span>{new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span>{post.readingTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

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
