'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ColorShowcase() {
  const colors = [
    { name: 'Silver', hex: '#b5b1b2', hsl: 'hsla(345, 3%, 70%, 1)', class: 'bg-silver' },
    { name: 'Rose Quartz', hex: '#ada9b7', hsl: 'hsla(257, 9%, 69%, 1)', class: 'bg-rose-quartz' },
    { name: 'Periwinkle', hex: '#a9afd1', hsl: 'hsla(231, 30%, 74%, 1)', class: 'bg-periwinkle' },
    { name: 'Light Sky Blue', hex: '#a1cdf4', hsl: 'hsla(208, 79%, 79%, 1)', class: 'bg-light-sky-blue' },
    { name: 'Cool Gray', hex: '#7c809b', hsl: 'hsla(232, 13%, 55%, 1)', class: 'bg-cool-gray' },
  ]

  const gradients = [
    { name: 'Top', class: 'gradient-top' },
    { name: 'Right', class: 'gradient-right' },
    { name: 'Bottom', class: 'gradient-bottom' },
    { name: 'Left', class: 'gradient-left' },
    { name: 'Top Right', class: 'gradient-top-right' },
    { name: 'Bottom Right', class: 'gradient-bottom-right' },
    { name: 'Top Left', class: 'gradient-top-left' },
    { name: 'Bottom Left', class: 'gradient-bottom-left' },
    { name: 'Radial', class: 'gradient-radial' },
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="font-serif text-4xl md:text-6xl text-primary">
            Color Palette Showcase
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Elegant wedding color palette featuring Silver, Rose Quartz, Periwinkle, Light Sky Blue, and Cool Gray
          </p>
        </div>

        {/* Color Swatches */}
        <section>
          <h2 className="text-2xl font-serif text-foreground mb-6">Primary Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {colors.map((color) => (
              <Card key={color.name} className="overflow-hidden">
                <div className={`h-32 ${color.class}`} />
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{color.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Hex:</span> {color.hex}
                  </div>
                  <div>
                    <span className="font-medium">HSL:</span> {color.hsl}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Semantic Colors */}
        <section>
          <h2 className="text-2xl font-serif text-foreground mb-6">Semantic Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <div className="h-24 bg-primary" />
              <CardHeader>
                <CardTitle>Primary</CardTitle>
                <CardDescription>Main brand color (Periwinkle)</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <div className="h-24 bg-secondary" />
              <CardHeader>
                <CardTitle>Secondary</CardTitle>
                <CardDescription>Complementary color (Rose Quartz)</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <div className="h-24 bg-accent" />
              <CardHeader>
                <CardTitle>Accent</CardTitle>
                <CardDescription>Highlight color (Light Sky Blue)</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <div className="h-24 bg-muted" />
              <CardHeader>
                <CardTitle>Muted</CardTitle>
                <CardDescription>Neutral background (Silver)</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Gradients */}
        <section>
          <h2 className="text-2xl font-serif text-foreground mb-6">Gradient Collection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gradients.map((gradient) => (
              <Card key={gradient.name} className="overflow-hidden">
                <div className={`h-32 ${gradient.class}`} />
                <CardHeader>
                  <CardTitle>{gradient.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    .{gradient.class}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Button Variants */}
        <section>
          <h2 className="text-2xl font-serif text-foreground mb-6">Button Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="wedding">Wedding</Button>
            <Button variant="elegant">Elegant</Button>
            <Button variant="romantic">Romantic</Button>
            <Button variant="dreamy">Dreamy</Button>
          </div>
        </section>

        {/* Wedding-specific Elements */}
        <section>
          <h2 className="text-2xl font-serif text-foreground mb-6">Wedding Elements</h2>
          <div className="space-y-6">
            <div className="wedding-hero-bg p-8 rounded-lg text-center">
              <h3 className="font-script text-4xl text-primary mb-4">Hero Background</h3>
              <p className="text-muted-foreground">Subtle gradient background for hero sections</p>
            </div>
            
            <div className="wedding-gradient p-8 rounded-lg text-center">
              <h3 className="font-serif text-2xl text-foreground mb-4">Wedding Gradient</h3>
              <p className="text-muted-foreground">Elegant gradient for section backgrounds</p>
            </div>

            <div className="gradient-subtle p-8 rounded-lg text-center border">
              <h3 className="font-serif text-2xl text-foreground mb-4">Subtle Gradient</h3>
              <p className="text-muted-foreground">Very subtle gradient overlay</p>
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section>
          <h2 className="text-2xl font-serif text-foreground mb-6">Usage Examples</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>CSS Custom Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-4 rounded overflow-x-auto">
{`/* Direct color access */
background-color: var(--periwinkle);
color: var(--cool-gray);

/* Semantic colors */
background-color: hsl(var(--primary));
color: hsl(var(--foreground));`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tailwind Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-4 rounded overflow-x-auto">
{`<!-- Wedding colors -->
<div class="bg-wedding-periwinkle-400">
<div class="text-wedding-cool-gray-600">

<!-- Semantic colors -->
<div class="bg-primary text-primary-foreground">
<div class="bg-secondary text-secondary-foreground">`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
