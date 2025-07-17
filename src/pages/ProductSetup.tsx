import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Progress } from '../components/ui/progress'
import { ArrowLeft, Upload, Settings, QrCode, FileText, Download, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import blink from '../blink/client'
import { useToast } from '../hooks/use-toast'

interface ProductData {
  name: string
  description: string
  price: string
  manualFile: File | null
  chosenModel: string
}

const ProductSetup: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [productData, setProductData] = useState<ProductData>({
    name: '',
    description: '',
    price: '',
    manualFile: null,
    chosenModel: 'gpt4o'
  })
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [productId, setProductId] = useState<string>('')
  
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setProductData(prev => ({ ...prev, manualFile: file }))
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please upload a PDF file',
        variant: 'destructive'
      })
    }
  }, [toast])

  const handleStep1Submit = async () => {
    if (!productData.name || !productData.manualFile) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields and upload a manual',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      // Upload PDF to storage
      const { publicUrl } = await blink.storage.upload(
        productData.manualFile,
        `manuals/${Date.now()}_${productData.manualFile.name}`,
        { upsert: true }
      )

      setProductData(prev => ({ ...prev, manualFile: null }))
      // Store the URL for later use
      setProductData(prev => ({ ...prev, manualPdfUrl: publicUrl } as any))
      setCurrentStep(2)
      
      toast({
        title: 'Manual uploaded',
        description: 'Your manual has been uploaded successfully',
      })
    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        title: 'Upload failed',
        description: 'Failed to upload manual. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStep2Submit = () => {
    setCurrentStep(3)
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    try {
      const user = await blink.auth.me()
      
      // Get or create business
      const businessData = await blink.db.businesses.list({
        where: { userId: user.id },
        limit: 1
      })
      
      let businessId: string
      if (businessData.length === 0) {
        const newBusiness = await blink.db.businesses.create({
          id: `bus_${Date.now()}`,
          userId: user.id,
          name: user.displayName || 'My Business',
          emailSupport: user.email || 'support@example.com',
          phoneSupport: '+1-555-0123',
          defaultModel: 'gpt4o'
        })
        businessId = newBusiness.id
      } else {
        businessId = businessData[0].id
      }

      // Create product
      const newProductId = `prod_${Date.now()}`
      await blink.db.products.create({
        id: newProductId,
        businessId,
        userId: user.id,
        name: productData.name,
        description: productData.description,
        price: productData.price ? parseFloat(productData.price) : null,
        manualPdfUrl: (productData as any).manualPdfUrl,
        chosenModel: productData.chosenModel,
        isActive: true
      })

      // Generate QR code URL
      const baseUrl = window.location.origin
      const chatUrl = `${baseUrl}/p/${newProductId}`
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(chatUrl)}`
      
      // Update product with QR code URL
      await blink.db.products.update(newProductId, {
        qrCodeUrl: qrUrl
      })

      setProductId(newProductId)
      setQrCodeUrl(qrUrl)
      
      toast({
        title: 'Product created!',
        description: 'Your product has been set up successfully',
      })
    } catch (error) {
      console.error('Failed to create product:', error)
      toast({
        title: 'Creation failed',
        description: 'Failed to create product. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadQRCode = () => {
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `${productData.name}-qr-code.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStepProgress = () => {
    return (currentStep / 3) * 100
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Product Setup</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Add New Product</h1>
          <p className="text-muted-foreground">
            Set up your product with AI-powered customer support in just a few steps
          </p>
          <div className="mt-4">
            <Progress value={getStepProgress()} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>Step {currentStep} of 3</span>
              <span>{Math.round(getStepProgress())}% Complete</span>
            </div>
          </div>
        </div>

        {/* Setup Steps Indicator */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className={currentStep === 1 ? "border-primary bg-primary/5" : currentStep > 1 ? "border-green-500 bg-green-50" : ""}>
            <CardHeader className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                currentStep === 1 ? "bg-primary text-primary-foreground" : 
                currentStep > 1 ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {currentStep > 1 ? <Check className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
              </div>
              <CardTitle className="text-lg">1. Upload Manual</CardTitle>
              <CardDescription>
                Upload your product manual PDF and configure basic details
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className={currentStep === 2 ? "border-primary bg-primary/5" : currentStep > 2 ? "border-green-500 bg-green-50" : "opacity-50"}>
            <CardHeader className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                currentStep === 2 ? "bg-primary text-primary-foreground" : 
                currentStep > 2 ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {currentStep > 2 ? <Check className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
              </div>
              <CardTitle className="text-lg">2. Configure AI</CardTitle>
              <CardDescription>
                Choose your AI model and customize responses
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className={currentStep === 3 ? "border-primary bg-primary/5" : "opacity-50"}>
            <CardHeader className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                currentStep === 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <QrCode className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">3. Generate QR</CardTitle>
              <CardDescription>
                Generate and download your QR code for customers
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>
                Tell us about your product and upload the manual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="manual-upload" className="text-sm font-medium mb-2 block">
                  Product Manual (PDF) *
                </Label>
                <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors">
                  {productData.manualFile ? (
                    <div className="space-y-4">
                      <FileText className="w-12 h-12 text-green-500 mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold text-green-700">File Selected</h3>
                        <p className="text-muted-foreground">{productData.manualFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(productData.manualFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Upload Product Manual</h3>
                      <p className="text-muted-foreground mb-4">
                        Drag and drop your PDF manual here, or click to browse
                      </p>
                    </>
                  )}
                  <input
                    id="manual-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    onClick={() => document.getElementById('manual-upload')?.click()}
                    variant={productData.manualFile ? "outline" : "default"}
                  >
                    {productData.manualFile ? 'Change File' : 'Choose File'}
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-name">Product Name *</Label>
                  <Input 
                    id="product-name"
                    type="text" 
                    placeholder="Enter product name"
                    value={productData.name}
                    onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="product-price">Price (Optional)</Label>
                  <Input 
                    id="product-price"
                    type="number" 
                    placeholder="0.00"
                    step="0.01"
                    value={productData.price}
                    onChange={(e) => setProductData(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="product-description">Description</Label>
                <Textarea 
                  id="product-description"
                  placeholder="Brief description of your product"
                  rows={3}
                  value={productData.description}
                  onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex justify-between">
                <Link to="/dashboard">
                  <Button variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button onClick={handleStep1Submit} disabled={loading}>
                  {loading ? 'Uploading...' : 'Continue to AI Setup'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>
                Choose your AI model and customize how it responds to customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="ai-model">AI Model</Label>
                <Select 
                  value={productData.chosenModel} 
                  onValueChange={(value) => setProductData(prev => ({ ...prev, chosenModel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt4o">GPT-4o (Recommended)</SelectItem>
                    <SelectItem value="claude3">Claude 3</SelectItem>
                    <SelectItem value="mixtral">Mixtral</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  GPT-4o provides the best balance of accuracy and speed for customer support
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">AI Behavior Preview</h4>
                <p className="text-sm text-muted-foreground">
                  Your AI will be trained on the uploaded manual for "{productData.name}" and will:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Answer questions based only on the manual content</li>
                  <li>• Politely redirect when information isn't available</li>
                  <li>• Escalate to human support after multiple unhelpful responses</li>
                  <li>• Maintain a helpful and professional tone</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button onClick={handleStep2Submit}>
                  Continue to QR Generation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Generate QR Code</CardTitle>
              <CardDescription>
                Your QR code will link customers directly to your AI support chat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!qrCodeUrl ? (
                <>
                  <div className="text-center py-8">
                    <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Ready to Generate</h3>
                    <p className="text-muted-foreground mb-4">
                      Click the button below to create your product and generate the QR code
                    </p>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">What happens next:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Your product will be created and activated</li>
                      <li>• A unique QR code will be generated</li>
                      <li>• Customers can scan to access AI support instantly</li>
                      <li>• You can download and print the QR code</li>
                    </ul>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(2)}>
                      Back
                    </Button>
                    <Button onClick={handleFinalSubmit} disabled={loading}>
                      {loading ? 'Creating Product...' : 'Create Product & Generate QR'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center py-8">
                    <div className="inline-block p-4 bg-white rounded-lg shadow-lg mb-4">
                      <img src={qrCodeUrl} alt="Product QR Code" className="w-48 h-48 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-700 mb-2">
                      🎉 Product Created Successfully!
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Your QR code is ready. Customers can scan this to access AI support for "{productData.name}"
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={downloadQRCode}>
                      <Download className="w-4 h-4 mr-2" />
                      Download QR Code
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/dashboard')}>
                      Go to Dashboard
                    </Button>
                  </div>

                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Next Steps:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Print the QR code and place it on your product packaging</li>
                      <li>• Test the chat experience by scanning the code</li>
                      <li>• Monitor customer interactions in your dashboard</li>
                      <li>• Customize your business settings if needed</li>
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ProductSetup