"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, Wand2, Pencil, ArrowRight } from "lucide-react";

// Animation variants for cleaner code
const motionProps = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  },
  item: {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" as const }, // Fix: Added 'as const'
    },
  },
  featureCard: (delay: number) => ({
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, delay },
  }),
};

// A simple Header component for better structure
function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Invoice AI</h1>
        <Button variant="ghost" asChild>
          <Link href="/invoices">Sign In</Link>
        </Button>
      </div>
    </header>
  );
}

export default function LandingPage() {
  const headline = "Unlock Your Invoice Data. Instantly.";
  const features = [
    {
      icon: <UploadCloud className="h-8 w-8" />,
      title: "1. Upload PDF",
      description: "Securely upload your invoice documents in PDF format. Our system is ready to process them instantly.",
      delay: 0.2,
    },
    {
      icon: <Wand2 className="h-8 w-8" />,
      title: "2. AI Extraction",
      description: "Our powerful AI analyzes the document, accurately extracting key information like vendor, totals, and line items.",
      delay: 0.4,
    },
    {
      icon: <Pencil className="h-8 w-8" />,
      title: "3. Review & Save",
      description: "Easily review the extracted data, make edits if needed, and save the structured information to your database.",
      delay: 0.6,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="text-center pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-48 lg:pb-36">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={motionProps.container}
            className="container mx-auto px-4"
          >
            {/* Staggered Headline */}
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter mb-4"
              aria-label={headline}
            >
              {headline.split(" ").map((word, index) => (
                <motion.span
                  key={index}
                  variants={motionProps.item}
                  className="inline-block mr-2 lg:mr-4"
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              variants={motionProps.item}
              className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-8"
            >
              Our AI-powered platform extracts invoice details with incredible
              accuracy. Say goodbye to manual data entry.
            </motion.p>
            
            <motion.div variants={motionProps.item}>
              <Button size="lg" asChild>
                <Link href="/invoices">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted py-20 sm:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <motion.div key={feature.title} {...motionProps.featureCard(feature.delay)}>
                  <Card className="text-center h-full">
                    <CardHeader>
                      <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                        {feature.icon}
                      </div>
                      <CardTitle className="mt-4">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>{feature.description}</CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-6">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Invoice AI. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}