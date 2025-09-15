"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, Wand2, Pencil, ArrowRight } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
// Framer Motion variant for the container that staggers the children animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // Each child will be animated 0.2s after the previous one
    },
  },
};

// Framer Motion variant for the children (e.g., words in the headline)
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function LandingPage() {
  const headline = "Unlock Your Invoice Data. Instantly.";

  return (
     <html lang="en" suppressHydrationWarning>
    <div className="flex flex-col min-h-screen">
       <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="text-center py-20 sm:py-28 lg:py-36">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
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
                  variants={itemVariants}
                  className="inline-block mr-2 lg:mr-4" // Add spacing between words
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-8"
            >
              Our AI-powered platform extracts invoice details with incredible accuracy.
              Say goodbye to manual data entry.
            </motion.p>
            
            <motion.div variants={itemVariants}>
              <Button size="lg" asChild>
                <Link href="/invoices">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="bg-muted py-20 sm:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1: Upload */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} // Animate only once when it comes into view
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="text-center h-full">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                      <UploadCloud className="h-8 w-8" />
                    </div>
                    <CardTitle className="mt-4">1. Upload PDF</CardTitle>
                  </CardHeader>
                  <CardContent>
                    Securely upload your invoice documents in PDF format. Our system is ready to process them instantly.
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Feature 2: Extract */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="text-center h-full">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                        <Wand2 className="h-8 w-8" />
                    </div>
                    <CardTitle className="mt-4">2. AI Extraction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    Our powerful AI analyzes the document, accurately extracting key information like vendor, totals, and line items.
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feature 3: Review */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Card className="text-center h-full">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                      <Pencil className="h-8 w-8" />
                    </div>
                    <CardTitle className="mt-4">3. Review & Save</CardTitle>
                  </CardHeader>
                  <CardContent>
                    Easily review the extracted data, make edits if needed, and save the structured information to your database.
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-6">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()}Invoice. All Rights Reserved.
        </p>
      </footer>
      </ThemeProvider>
    </div>
    </html>
  );
}