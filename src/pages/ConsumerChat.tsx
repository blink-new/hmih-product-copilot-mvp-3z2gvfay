import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { 
  MessageCircle, 
  Send, 
  ThumbsUp, 
  ThumbsDown, 
  FileText, 
  Download,
  AlertTriangle,
  Phone,
  Mail
} from 'lucide-react'
import blink from '../blink/client'
import { useToast } from '../hooks/use-toast'

interface Product {
  id: string
  name: string
  description: string
  price: number | null
  manualPdfUrl: string
  chosenModel: string
  businessId: string
}

interface Business {
  id: string
  name: string
  emailSupport: string
  phoneSupport: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  isHelpful?: boolean
}

const ConsumerChat: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showEscalation, setShowEscalation] = useState(false)
  const [unhelpfulCount, setUnhelpfulCount] = useState(0)
  const [sessionId] = useState(`session_${Date.now()}`)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadProductData = async () => {
    try {
      // Load product data
      const productData = await blink.db.products.list({
        where: { id: productId },
        limit: 1
      })

      if (productData.length === 0) {
        toast({
          title: 'Product not found',
          description: 'The requested product could not be found',
          variant: 'destructive'
        })
        return
      }

      const prod = productData[0]
      setProduct({
        id: prod.id,
        name: prod.name,
        description: prod.description || '',
        price: prod.price,
        manualPdfUrl: prod.manualPdfUrl || '',
        chosenModel: prod.chosenModel,
        businessId: prod.businessId
      })

      // Load business data
      const businessData = await blink.db.businesses.list({
        where: { id: prod.businessId },
        limit: 1
      })

      if (businessData.length > 0) {
        const biz = businessData[0]
        setBusiness({
          id: biz.id,
          name: biz.name,
          emailSupport: biz.emailSupport,
          phoneSupport: biz.phoneSupport || ''
        })
      }

      // Check for existing escalation
      const escalationCount = await blink.db.chatLogs.list({
        where: { 
          productId: productId,
          isHelpful: "0"
        }
      })

      if (escalationCount.length >= 20) {
        setShowEscalation(true)
      }

      // Add welcome message
      setMessages([{
        id: 'welcome',
        type: 'ai',
        content: `Hello! I'm here to help you with ${prod.name}. I can answer questions based on the product manual. What would you like to know?`,
        timestamp: new Date()
      }])

    } catch (error) {
      console.error('Failed to load product data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load product information',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

    if (productId) {
      loadProductData()
    }
  }, [productId, toast])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || !product || sending) return

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setSending(true)

    try {
      // Generate AI response
      const systemPrompt = `You are a helpful product support assistant for ${product.name}. 
      Use only the information from the product manual and description provided. 
      If you're unsure about something, say you're not certain and suggest contacting support.
      
      Product: ${product.name}
      Description: ${product.description}
      
      Keep responses concise and helpful. Always be polite and professional.`

      const { text } = await blink.ai.generateText({
        prompt: `${systemPrompt}\n\nCustomer question: ${userMessage.content}`,
        model: product.chosenModel === 'gpt4o' ? 'gpt-4o-mini' : 'gpt-4o-mini', // Fallback to available model
        maxTokens: 300
      })

      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: text,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])

      // Log the chat interaction
      await blink.db.chatLogs.create({
        id: `chat_${Date.now()}`,
        productId: product.id,
        question: userMessage.content,
        response: text,
        timestamp: new Date().toISOString(),
        sessionId
      })

    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again or contact our support team.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      
      toast({
        title: 'Error',
        description: 'Failed to get AI response',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
    }
  }

  const handleFeedback = async (messageId: string, isHelpful: boolean) => {
    try {
      // Update the message with feedback
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isHelpful } : msg
      ))

      // Find the corresponding chat log and update it
      const chatLogs = await blink.db.chatLogs.list({
        where: { productId: product?.id },
        orderBy: { timestamp: 'desc' },
        limit: 10
      })

      // Update the most recent AI response
      if (chatLogs.length > 0) {
        await blink.db.chatLogs.update(chatLogs[0].id, {
          isHelpful: isHelpful ? "1" : "0"
        })
      }

      if (!isHelpful) {
        const newCount = unhelpfulCount + 1
        setUnhelpfulCount(newCount)
        
        if (newCount >= 20) {
          setShowEscalation(true)
          
          // Create escalation record
          await blink.db.escalations.create({
            id: `esc_${Date.now()}`,
            productId: product?.id || '',
            reason: 'unhelpful_responses',
            status: 'pending'
          })
        }
      }

      toast({
        title: isHelpful ? 'Thank you!' : 'Feedback received',
        description: isHelpful ? 'Glad I could help!' : 'We\'ll work on improving our responses',
      })

    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground">
              The product you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Product Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{product.name}</CardTitle>
                {product.description && (
                  <p className="text-muted-foreground mb-3">{product.description}</p>
                )}
                {product.price && (
                  <Badge variant="secondary" className="mb-3">
                    ${product.price.toFixed(2)}
                  </Badge>
                )}
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    AI Support Available
                  </div>
                  {product.manualPdfUrl && (
                    <a 
                      href={product.manualPdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View Manual
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Escalation Banner */}
        {showEscalation && business && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="py-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-800 mb-1">
                    Need More Help?
                  </h3>
                  <p className="text-orange-700 text-sm mb-3">
                    It looks like our AI might not have all the answers you need. 
                    Please contact our human support team for personalized assistance.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={`mailto:${business.emailSupport}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        {business.emailSupport}
                      </a>
                    </Button>
                    {business.phoneSupport && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${business.phoneSupport}`}>
                          <Phone className="w-4 h-4 mr-2" />
                          {business.phoneSupport}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Interface */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Product Support Chat
            </CardTitle>
            <Separator />
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.type === 'ai' && message.id !== 'welcome' && (
                        <div className="flex space-x-1 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-6 w-6 p-0 ${
                              message.isHelpful === true ? 'text-green-600' : ''
                            }`}
                            onClick={() => handleFeedback(message.id, true)}
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-6 w-6 p-0 ${
                              message.isHelpful === false ? 'text-red-600' : ''
                            }`}
                            onClick={() => handleFeedback(message.id, false)}
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about this product..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={sending || !inputMessage.trim()}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send • This AI is trained on the product manual
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Powered by HMIH Platform • AI-Enhanced Customer Support</p>
        </div>
      </div>
    </div>
  )
}

export default ConsumerChat