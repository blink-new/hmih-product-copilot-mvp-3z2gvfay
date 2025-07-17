import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from '../components/ui/dialog'
import { QrCode, MessageCircle, Zap, Shield } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import EmailAuthForm from '../components/auth/EmailAuthForm'

const LandingPage: React.FC = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  // Redirect authenticated users to dashboard
  React.useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard')
    }
  }, [user, isLoading, navigate])

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard')
    } else {
      setShowAuthDialog(true)
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthDialog(false)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">HMIH</span>
          </div>
          <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleGetStarted}>
                {user ? 'Go to Dashboard' : 'Get Started'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="sr-only">Authentication</DialogTitle>
              </DialogHeader>
              <EmailAuthForm onSuccess={handleAuthSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI-Powered Product Support
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your product manuals into intelligent QR-code powered customer support. 
            Upload your PDFs, generate QR codes, and let AI handle customer questions 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
              <DialogTrigger asChild>
                <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-3">
                  {user ? 'Go to Dashboard' : 'Start Free Trial'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="sr-only">Authentication</DialogTitle>
                </DialogHeader>
                <EmailAuthForm onSuccess={handleAuthSuccess} />
              </DialogContent>
            </Dialog>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to transform your product support experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Upload & Generate</CardTitle>
              <CardDescription>
                Upload your product manual PDF and instantly generate a QR code
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>AI Chat Support</CardTitle>
              <CardDescription>
                Customers scan QR codes to chat with AI trained on your manual
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Smart Escalation</CardTitle>
              <CardDescription>
                Automatic escalation to human support when AI can't help
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose HMIH?</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Instant Setup</h3>
              <p className="text-sm text-muted-foreground">Get started in minutes, not hours</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">24/7 Support</h3>
              <p className="text-sm text-muted-foreground">AI never sleeps, always helping</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">QR Integration</h3>
              <p className="text-sm text-muted-foreground">Seamless mobile experience</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Smart Escalation</h3>
              <p className="text-sm text-muted-foreground">Human backup when needed</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Support?</h2>
          <p className="text-muted-foreground mb-8">
            Join hundreds of brands already using HMIH to provide better customer support
          </p>
          <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
            <DialogTrigger asChild>
              <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-3">
                {user ? 'Go to Dashboard' : 'Get Started Now'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="sr-only">Authentication</DialogTitle>
              </DialogHeader>
              <EmailAuthForm onSuccess={handleAuthSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 HMIH Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage