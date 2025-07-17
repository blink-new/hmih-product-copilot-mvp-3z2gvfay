import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Plus, Settings, QrCode, MessageCircle, TrendingUp, AlertTriangle } from 'lucide-react'
import blink from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/use-toast'

interface Business {
  id: string
  name: string
  emailSupport: string
  phoneSupport: string
  defaultModel: string
}

interface Product {
  id: string
  name: string
  chosenModel: string
  isActive: boolean
  createdAt: string
}

const BusinessDashboard: React.FC = () => {
  const [business, setBusiness] = useState<Business | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const loadDashboardData = useCallback(async () => {
    if (!user) return
    
    try {
      // Try to load business data, create if doesn't exist
      const businessData = await blink.db.businesses.list({
        where: { userId: user.id },
        limit: 1
      })
      
      let business: Business
      if (businessData.length === 0) {
        // Create default business for new user
        const newBusiness = await blink.db.businesses.create({
          id: `bus_${Date.now()}`,
          userId: user.id,
          name: user.name || 'My Business',
          emailSupport: user.email || 'support@example.com',
          phoneSupport: '+1-555-0123',
          defaultModel: 'gpt4o',
          brandPrimaryColor: '#FFD700',
          brandAccentColor: '#FF3333'
        })
        business = {
          id: newBusiness.id,
          name: newBusiness.name,
          emailSupport: newBusiness.emailSupport,
          phoneSupport: newBusiness.phoneSupport || '',
          defaultModel: newBusiness.defaultModel
        }
      } else {
        const b = businessData[0]
        business = {
          id: b.id,
          name: b.name,
          emailSupport: b.emailSupport,
          phoneSupport: b.phoneSupport || '',
          defaultModel: b.defaultModel
        }
      }
      
      // Load products
      const productsData = await blink.db.products.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      
      const products: Product[] = productsData.map(p => ({
        id: p.id,
        name: p.name,
        chosenModel: p.chosenModel,
        isActive: Number(p.isActive) > 0,
        createdAt: p.createdAt
      }))
      
      setBusiness(business)
      setProducts(products)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      // Fallback to mock data if database operations fail
      const mockBusiness: Business = {
        id: 'bus_1',
        name: user.name || 'Demo Business',
        emailSupport: user.email || 'support@demo.com',
        phoneSupport: '+1-555-0123',
        defaultModel: 'gpt4o'
      }
      setBusiness(mockBusiness)
      setProducts([])
      
      toast({
        title: 'Notice',
        description: 'Using demo mode - database setup pending',
        variant: 'default'
      })
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">HMIH</span>
            </div>
            {business && (
              <div className="hidden md:block">
                <span className="text-muted-foreground">|</span>
                <span className="ml-4 font-medium">{business.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/settings">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back{business ? `, ${business.name}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Manage your products and monitor customer support performance
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">Active products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escalations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Products</h2>
            <Button onClick={() => navigate('/setup')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <QrCode className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Get started by adding your first product with a manual
                </p>
                <Button onClick={() => navigate('/setup')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Product
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {product.name}
                          {product.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          AI Model: {product.chosenModel.toUpperCase()} • 
                          Created {new Date(product.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <QrCode className="w-4 h-4 mr-2" />
                          QR Code
                        </Button>
                        <Button variant="outline" size="sm">
                          View Analytics
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BusinessDashboard