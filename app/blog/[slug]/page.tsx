import { AnimatedHeroSection } from "@/components/custom/AnimatedHeroSection";
import { AnimatedMainContent } from "@/components/custom/AnimatedMainContent";
import { getBlogPosts, getPost } from "@/lib/blog";
import { generateBlogPostMetadata, generateBlogPostStructuredData } from "@/lib/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: {
    slug: string;
  };
}): Promise<Metadata | undefined> {
  const post = await getPost(params.slug);

  const { title, publishedAt: publishedTime, summary: description, image } = post.metadata;

  return generateBlogPostMetadata(title, description, publishedTime, params.slug, image);
}

export default async function Blog({
  params,
}: {
  params: {
    slug: string;
  };
}) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  const structuredData = generateBlogPostStructuredData(
    post.metadata.title,
    post.metadata.summary,
    post.metadata.publishedAt,
    params.slug
  );

  return (
    <div className="min-h-screen w-full relative">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      {/* Header Section */}
      <AnimatedHeroSection post={post} />

      {/* Main Content Section */}
      <AnimatedMainContent content={post.source} />
    </div>
  );
}
