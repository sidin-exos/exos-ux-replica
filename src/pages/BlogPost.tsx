import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CalendarDays, Clock, ArrowLeft, User2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getBlogPost } from "@/lib/blog-data";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <>
      <Helmet>
        <title>{post.title} — EXOS Blog</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
      </Helmet>
      <Header />

      <main className="min-h-screen">
        {/* Hero image */}
        <div className="w-full h-56 md:h-80 lg:h-96 overflow-hidden relative">
          <img
            src={post.heroImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        <article className="container max-w-3xl -mt-20 relative z-10 pb-16">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> All articles
          </Link>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-medium">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold text-foreground leading-tight mb-3">
            {post.title}
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            {post.subtitle}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-border pb-6 mb-8">
            <span className="flex items-center gap-1.5">
              <User2 className="w-4 h-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readingTime}
            </span>
          </div>

          {/* Body */}
          <MarkdownRenderer
            content={post.content}
            className="prose-lg"
          />

          {/* Bottom CTA */}
          <div className="mt-12 p-6 rounded-xl border border-border bg-muted/30 text-center">
            <p className="font-display font-bold text-foreground text-lg mb-2">
              Ready to move from tail-spend automation to margin protection?
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Explore EXOS scenarios — the analytical toolkit built for Category Engineers.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              Explore Scenarios
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
};

export default BlogPost;
