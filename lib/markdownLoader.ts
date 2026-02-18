export interface BlogPostMetadata {
  title: string;
  subtitle: string;
  readTime: string;
  publishDate: string;
  author: {
    name: string;
    role: string;
    avatar: string;
    bio: string;
  };
  keyTakeaways: string[];
  breadcrumbs: Array<{
    label: string;
    href: string;
  }>;
  image?: string;
  tag?: string;
}

export interface BlogPostContent {
  metadata: BlogPostMetadata;
  content: string;
  headings: Array<{
    level: number;
    text: string;
    id: string;
    href: string;
  }>;
}

const blogPostMetadata: Record<string, BlogPostMetadata> = {
  "future-ai-business-comprehensive-guide": {
    title: "The Future of AI in Business: A Comprehensive Guide",
    subtitle:
      "Explore how artificial intelligence is transforming modern business operations and what it means for your company's future.",
    readTime: "12 min read",
    publishDate: "Aug 16, 2025",
    author: {
      name: "Sarah Chen",
      role: "AI Strategy Lead",
      avatar: "/api/placeholder/48/48",
      bio: "Sarah is a leading expert in AI strategy with over 10 years of experience helping businesses transform through artificial intelligence. She specializes in AI implementation and digital transformation.",
    },
    keyTakeaways: [
      "AI adoption is accelerating across industries, with 85% of companies planning to increase AI investments",
      "Successful AI implementation requires organizational readiness, not just technology",
      "The future of AI lies in human-AI collaboration rather than replacement",
      "Data quality and governance are critical foundations for AI success",
    ],
    breadcrumbs: [
      { label: "Resources", href: "/blog" },
      { label: "AI Strategy", href: "/blog?tag=ai-strategy" },
    ],
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    tag: "AI Strategy",
  },
  "building-scalable-machine-learning-pipelines": {
    title: "Building Scalable Machine Learning Pipelines",
    subtitle:
      "Learn the best practices for creating robust and scalable machine learning pipelines that can handle production workloads.",
    readTime: "15 min read",
    publishDate: "Aug 16, 2025",
    author: {
      name: "Michael Rodriguez",
      role: "ML Engineering Director",
      avatar: "/api/placeholder/48/48",
      bio: "Michael is a seasoned ML engineer with expertise in building production-ready machine learning systems. He has led ML infrastructure teams at several tech companies and is passionate about scalable AI solutions.",
    },
    keyTakeaways: [
      "Modularity and observability are key principles for scalable ML pipelines",
      "Feature stores centralize feature management and improve team collaboration",
      "Model monitoring is essential for maintaining performance in production",
      "Containerization and orchestration enable reliable model deployment",
    ],
    breadcrumbs: [
      { label: "Resources", href: "/blog" },
      { label: "ML Engineering", href: "/blog?tag=ml-engineering" },
    ],
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    tag: "ML Engineering",
  },
  "custom-llm-development-concept-deployment": {
    title: "Custom LLM Development: From Concept to Deployment",
    subtitle:
      "A deep dive into developing custom large language models tailored to your specific business needs and use cases.",
    readTime: "18 min read",
    publishDate: "Aug 16, 2025",
    author: {
      name: "Dr. Elena Vasquez",
      role: "Head of AI Research",
      avatar: "/api/placeholder/48/48",
      bio: "Dr. Vasquez is a leading researcher in natural language processing with over 15 years of experience in developing custom language models. She has published extensively on transformer architectures and model optimization.",
    },
    keyTakeaways: [
      "Custom LLMs provide domain-specific expertise that general models lack",
      "Data quality and curation are critical for successful custom model development",
      "Deployment considerations include infrastructure, optimization, and monitoring",
      "Iterative development and continuous evaluation ensure long-term success",
    ],
    breadcrumbs: [
      { label: "Resources", href: "/blog" },
      { label: "LLM Development", href: "/blog?tag=llm-development" },
    ],
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    tag: "LLM Development",
  },
};

export const parseMarkdownHeadings = (markdown: string) => {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2];
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    headings.push({
      level,
      text,
      id,
      href: `#${id}`,
    });
  }

  return headings;
};

export const markdownToHTML = (markdown: string) => {
  const html = markdown
    .replace(
      /^### (.*$)/gim,
      '<h3 id="$1" class="scroll-mt-24 text-xl font-semibold mb-4 mt-8 text-foreground">$1</h3>'
    )
    .replace(
      /^## (.*$)/gim,
      '<h2 id="$1" class="scroll-mt-24 text-2xl font-semibold mb-6 mt-10 text-foreground">$1</h2>'
    )
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-8 text-foreground">$1</h1>')
    // Lists
    .replace(/^\* (.*$)/gim, '<li class="mb-2 text-muted-foreground">$1</li>')
    .replace(/(<li.*<\/li>)/g, '<ul class="list-disc list-inside mb-4 space-y-1">$1</ul>')
    // Numbered lists
    .replace(/^\d+\. (.*$)/gim, '<li class="mb-2 text-muted-foreground">$1</li>')
    // Paragraphs
    .replace(/^([^\n#*\-].*)$/gm, '<p class="mb-4 leading-7 text-muted-foreground">$1</p>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em class="italic text-foreground">$1</em>')
    // Code blocks
    .replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-muted p-4 rounded-lg overflow-x-auto mb-4"><code class="text-sm">$1</code></pre>'
    )
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-2 py-1 rounded text-sm font-mono">$1</code>');

  return html;
};

export const loadBlogPost = async (slug: string): Promise<BlogPostContent> => {
  try {
    let markdownContent = "";

    if (slug === "future-ai-business-comprehensive-guide") {
      markdownContent = `# The Future of AI in Business: A Comprehensive Guide

Artificial Intelligence is no longer a futuristic concept—it's a present reality that's transforming how businesses operate, compete, and grow. From small startups to enterprise giants, organizations are leveraging AI to streamline operations, enhance customer experiences, and drive innovation.

## The Current State of AI in Business

### AI Adoption Trends

The business world has witnessed unprecedented AI adoption in recent years. Companies across industries are implementing AI solutions to:

- **Automate repetitive tasks** and improve operational efficiency
- **Enhance decision-making** through data-driven insights
- **Personalize customer experiences** at scale
- **Optimize supply chains** and reduce costs
- **Accelerate innovation** in product development

### Key AI Technologies Driving Change

Several AI technologies are at the forefront of business transformation:

1. **Machine Learning (ML)** - Enables systems to learn and improve from experience
2. **Natural Language Processing (NLP)** - Powers chatbots, sentiment analysis, and content generation
3. **Computer Vision** - Automates visual inspection and image recognition tasks
4. **Predictive Analytics** - Forecasts trends and behaviors to inform strategic decisions
5. **Robotic Process Automation (RPA)** - Automates rule-based business processes

## Strategic Implementation of AI

### Building an AI-Ready Organization

Successfully implementing AI requires more than just technology—it demands organizational readiness:

#### 1. Data Infrastructure
- Establish robust data collection and storage systems
- Ensure data quality and accessibility
- Implement proper data governance frameworks

#### 2. Talent Development
- Hire AI specialists and data scientists
- Upskill existing employees
- Foster a culture of continuous learning

#### 3. Change Management
- Communicate AI benefits clearly to stakeholders
- Address concerns about job displacement
- Provide adequate training and support

## Conclusion

The future of AI in business is not just about technology—it's about transformation. Organizations that successfully integrate AI into their operations will gain significant competitive advantages, from improved efficiency and customer satisfaction to new revenue streams and market opportunities.`;
    } else if (slug === "building-scalable-machine-learning-pipelines") {
      markdownContent = `# Building Scalable Machine Learning Pipelines

In today's data-driven world, the ability to build and deploy machine learning models at scale is crucial for business success. However, moving from experimental Jupyter notebooks to production-ready ML pipelines presents unique challenges that require careful planning and robust architecture.

## Understanding ML Pipeline Architecture

### Core Components of ML Pipelines

A well-designed ML pipeline consists of several interconnected components:

1. **Data Ingestion** - Collecting data from various sources
2. **Data Validation** - Ensuring data quality and consistency
3. **Feature Engineering** - Creating meaningful features from raw data
4. **Model Training** - Training ML models with validated data
5. **Model Validation** - Testing model performance and accuracy
6. **Model Deployment** - Serving models in production environments
7. **Monitoring** - Tracking model performance and data drift
8. **Retraining** - Updating models with new data

## Data Pipeline Architecture

### Data Ingestion Strategies

Effective data ingestion is the foundation of any ML pipeline:

#### Batch Processing
- **Scheduled data loads** from databases and APIs
- **File-based ingestion** from cloud storage
- **Data warehouse integration** for structured data
- **ETL processes** for data transformation

#### Real-time Processing
- **Stream processing** with Apache Kafka or similar
- **Event-driven architecture** for immediate data updates
- **API-based ingestion** for real-time data feeds
- **Message queues** for asynchronous processing

## Conclusion

Building scalable machine learning pipelines is a complex but rewarding endeavor. Success requires careful planning, robust architecture, and continuous monitoring. By following best practices and leveraging the right tools, organizations can create ML pipelines that not only scale with their data and model complexity but also deliver reliable, high-performance results in production.`;
    } else if (slug === "custom-llm-development-concept-deployment") {
      markdownContent = `# Custom LLM Development: From Concept to Deployment

Large Language Models (LLMs) have revolutionized the AI landscape, but off-the-shelf solutions often fall short of meeting specific business requirements. Custom LLM development offers the opportunity to create models tailored to your unique use cases, data, and performance needs.

## Understanding Custom LLM Development

### What Makes an LLM "Custom"?

A custom LLM is specifically designed and trained for particular business needs, incorporating:

- **Domain-specific knowledge** from your industry or organization
- **Custom vocabulary** and terminology relevant to your use case
- **Specialized capabilities** not available in general-purpose models
- **Optimized performance** for your specific hardware and deployment constraints
- **Compliance requirements** for regulated industries

### When to Consider Custom LLM Development

Custom LLM development is ideal when:

- **General models lack domain expertise** in your specific field
- **Data privacy requirements** prevent using external APIs
- **Performance optimization** is critical for your use case
- **Cost considerations** make on-premises deployment more economical
- **Regulatory compliance** requires full control over model behavior

## The Custom LLM Development Process

### 1. Requirements Analysis

#### Define Your Objectives
- **Use case identification** - What specific problems will the LLM solve?
- **Performance requirements** - What accuracy, speed, and resource constraints do you have?
- **Data requirements** - What type and volume of data do you need?
- **Deployment constraints** - Where and how will the model be deployed?

### 2. Data Preparation and Curation

#### Data Collection
- **Internal data sources** - Company documents, customer interactions, product information
- **External data** - Public datasets, research papers, industry reports
- **Synthetic data** - Generated examples to augment training data
- **Data partnerships** - Collaborations with other organizations

### 3. Model Architecture Design

#### Base Model Selection
- **Pre-trained models** - Start with existing architectures (GPT, BERT, T5)
- **Model size** - Choose appropriate scale for your requirements
- **Architecture modifications** - Adapt for specific use cases
- **Multi-modal capabilities** - Add vision, audio, or other modalities

## Conclusion

Custom LLM development represents a significant opportunity for organizations to create AI solutions that are perfectly tailored to their specific needs. While the process is complex and resource-intensive, the benefits of having a model that understands your domain, respects your data privacy requirements, and delivers optimal performance for your use case can be substantial.`;
    } else {
      // Default content for unknown slugs
      markdownContent = `# Blog Post Not Found

The requested blog post could not be found. Please check the URL and try again.

## What to do next?

- Return to the [blog listing](/blog)
- Search for other articles
- Contact us if you believe this is an error`;
    }

    const metadata = blogPostMetadata[slug] || {
      title: "Blog Post Not Found",
      subtitle: "The requested blog post could not be found.",
      readTime: "1 min read",
      publishDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      author: {
        name: "Ionio Team",
        role: "Content Team",
        avatar: "/api/placeholder/48/48",
        bio: "The Ionio team creates content to help businesses understand and implement AI solutions.",
      },
      keyTakeaways: ["The requested blog post could not be found"],
      breadcrumbs: [
        { label: "Resources", href: "/blog" },
        { label: "Blog", href: "/blog" },
      ],
    };

    const headings = parseMarkdownHeadings(markdownContent);
    const htmlContent = markdownToHTML(markdownContent);

    return {
      metadata,
      content: htmlContent,
      headings,
    };
  } catch (error) {
    console.error("Error loading blog post:", error);
    throw new Error("Failed to load blog post");
  }
};
