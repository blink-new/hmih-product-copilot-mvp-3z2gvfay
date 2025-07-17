import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Separator } from '../components/ui/separator'
import { 
  ArrowLeft, 
  Settings, 
  Palette, 
  Upload, 
  Save,
  Building,
  Mail,
  Phone,
  Bot
} from 'lucide-react'
import blink from '../blink/client'
import { useToast } from '../hooks/use-toast'

interface BusinessSettings {
  id: string
  name: string
  emailSupport: string
  phoneSupport: string
  defaultModel: string
  brandLogoUrl?: string
  brandPrimaryColor: string
  brandAccentColor: string
}

const BusinessSettings: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const loadSettings = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      
      const businessData = await blink.db.businesses.list({
        where: { userId: user.id },
        limit: 1
      })

      if (businessData.length > 0) {
        const business = businessData[0]
        setSettings({
          id: business.id,
          name: business.name,
          emailSupport: business.emailSupport,
          phoneSupport: business.phoneSupport || '',
          defaultModel: business.defaultModel,
          brandLogoUrl: business.brandLogoUrl,
          brandPrimaryColor: business.brandPrimaryColor || '#FFD700',
          brandAccentColor: business.brandAccentColor || '#FF3333'
        })
      } else {
        // Create default business settings
        const newBusiness = await blink.db.businesses.create({
          id: `bus_${Date.now()}`,
          userId: user.id,
          name: user.displayName || 'My Business',
          emailSupport: user.email || 'support@example.com',
          phoneSupport: '+1-555-0123',
          defaultModel: 'gpt4o',
          brandPrimaryColor: '#FFD700',
          brandAccentColor: '#FF3333'
        })
        
        setSettings({
          id: newBusiness.id,
          name: newBusiness.name,
          emailSupport: newBusiness.emailSupport,
          phoneSupport: newBusiness.phoneSupport || '',
          defaultModel: newBusiness.defaultModel,
          brandPrimaryColor: newBusiness.brandPrimaryColor || '#FFD700',
          brandAccentColor: newBusiness.brandAccentColor || '#FF3333'
        })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load business settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file)
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive'
      })
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      let logoUrl = settings.brandLogoUrl

      // Upload logo if a new file was selected
      if (logoFile) {
        const { publicUrl } = await blink.storage.upload(
          logoFile,
          `logos/${Date.now()}_${logoFile.name}`,
          { upsert: true }
        )
        logoUrl = publicUrl
      }

      // Update business settings
      await blink.db.businesses.update(settings.id, {
        name: settings.name,
        emailSupport: settings.emailSupport,
        phoneSupport: settings.phoneSupport,
        defaultModel: settings.defaultModel,
        brandLogoUrl: logoUrl,
        brandPrimaryColor: settings.brandPrimaryColor,
        brandAccentColor: settings.brandAccentColor,
        updatedAt: new Date().toISOString()
      })

      setSettings(prev => prev ? { ...prev, brandLogoUrl: logoUrl } : null)
      setLogoFile(null)

      toast({
        title: 'Settings saved',
        description: 'Your business settings have been updated successfully',
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        title: 'Save failed',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Settings Not Found</h2>
            <p className="text-muted-foreground mb-4">
              Unable to load your business settings.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
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
              <span className="text-xl font-bold">Business Settings</span>
            </div>
          </div>
          
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Business Settings</h1>
          <p className="text-muted-foreground">
            Customize your business information and brand appearance
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="ai">AI Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Basic information about your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    value={settings.name}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter your business name"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Support Contact Information
                </CardTitle>
                <CardDescription>
                  Contact details shown to customers when they need human support
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={settings.emailSupport}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, emailSupport: e.target.value } : null)}
                    placeholder="support@yourcompany.com"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This email will be shown to customers when they need human support
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="support-phone">Support Phone (Optional)</Label>
                  <Input
                    id="support-phone"
                    type="tel"
                    value={settings.phoneSupport}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, phoneSupport: e.target.value } : null)}
                    placeholder="+1-555-0123"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Brand Logo
                </CardTitle>
                <CardDescription>
                  Upload your business logo to customize the customer chat experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  {(settings.brandLogoUrl || logoFile) && (
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      <img 
                        src={logoFile ? URL.createObjectURL(logoFile) : settings.brandLogoUrl} 
                        alt="Brand logo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {settings.brandLogoUrl ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended: Square image, at least 200x200px
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Brand Colors
                </CardTitle>
                <CardDescription>
                  Customize the colors used in your customer chat interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="primary-color"
                        type="color"
                        value={settings.brandPrimaryColor}
                        onChange={(e) => setSettings(prev => prev ? { ...prev, brandPrimaryColor: e.target.value } : null)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={settings.brandPrimaryColor}
                        onChange={(e) => setSettings(prev => prev ? { ...prev, brandPrimaryColor: e.target.value } : null)}
                        placeholder="#FFD700"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Used for buttons and highlights
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="accent-color">Accent Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="accent-color"
                        type="color"
                        value={settings.brandAccentColor}
                        onChange={(e) => setSettings(prev => prev ? { ...prev, brandAccentColor: e.target.value } : null)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={settings.brandAccentColor}
                        onChange={(e) => setSettings(prev => prev ? { ...prev, brandAccentColor: e.target.value } : null)}
                        placeholder="#FF3333"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Used for alerts and secondary elements
                    </p>
                  </div>
                </div>

                <Separator />
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Color Preview</h4>
                  <div className="flex space-x-2">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: settings.brandPrimaryColor }}
                    ></div>
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: settings.brandAccentColor }}
                    ></div>
                    <span className="text-sm text-muted-foreground self-center ml-2">
                      These colors will appear in your customer chat interface
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="w-5 h-5 mr-2" />
                  Default AI Model
                </CardTitle>
                <CardDescription>
                  Choose the default AI model for new products. You can override this for individual products.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="default-model">Default AI Model</Label>
                  <Select 
                    value={settings.defaultModel} 
                    onValueChange={(value) => setSettings(prev => prev ? { ...prev, defaultModel: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default AI model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt4o">GPT-4o (Recommended)</SelectItem>
                      <SelectItem value="claude3">Claude 3</SelectItem>
                      <SelectItem value="mixtral">Mixtral</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    GPT-4o provides the best balance of accuracy and speed for customer support
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">AI Model Comparison</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">GPT-4o:</span>
                      <span className="text-muted-foreground">Fast, accurate, great for support</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Claude 3:</span>
                      <span className="text-muted-foreground">Thoughtful, detailed responses</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Mixtral:</span>
                      <span className="text-muted-foreground">Open source, cost-effective</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default BusinessSettings