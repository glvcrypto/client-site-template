-- SEO keyword rankings (populated by Mission Control / GSC sync)
CREATE TABLE IF NOT EXISTS public.seo_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  position numeric,
  previous_position numeric,
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  ctr numeric,
  page_url text,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Blog post performance (populated by Mission Control / GA4 sync)
CREATE TABLE IF NOT EXISTS public.blog_posts_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  published_date date,
  pageviews integer DEFAULT 0,
  sessions integer DEFAULT 0,
  avg_time_on_page numeric,
  bounce_rate numeric,
  top_keyword text,
  top_keyword_position numeric,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read keywords" ON public.seo_keywords
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read blog perf" ON public.blog_posts_performance
  FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_seo_keywords_date ON public.seo_keywords(snapshot_date DESC);
CREATE INDEX idx_seo_keywords_keyword ON public.seo_keywords(keyword);
CREATE INDEX idx_blog_perf_date ON public.blog_posts_performance(snapshot_date DESC);
