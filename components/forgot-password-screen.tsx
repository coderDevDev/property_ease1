"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { ArrowLeft, Building, Home, Loader2, Mail, CheckCircle } from "lucide-react"

interface ForgotPasswordScreenProps {
  onBack: () => void
  selectedRole: "owner" | "tenant"
}

export function ForgotPasswordScreen({ onBack, selectedRole }: ForgotPasswordScreenProps) {
  const { authState, forgotPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const result = await forgotPassword({ email, role: selectedRole })

    if (result.success) {
      setIsSubmitted(true)
      setMessage(result.message)
    } else {
      setError(result.message)
    }
  }

  const roleConfig = {
    owner: {
      icon: Building,
      title: "Property Owner/Manager",
      color: "bg-property-action",
      description: "Reset your property management account password",
    },
    tenant: {
      icon: Home,
      title: "Tenant/Resident",
      color: "bg-purple-500",
      description: "Reset your tenant account password",
    },
  }

  const config = roleConfig[selectedRole]
  const Icon = config.icon

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-property-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-property-card shadow-lg border border-gray-100">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-property-text-primary mb-2">Check Your Email</h2>
            <p className="text-property-text-secondary text-sm mb-6">{message}</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-property-text-primary font-medium text-sm mb-1">Email sent to:</p>
              <p className="text-property-text-secondary text-sm">{email}</p>
            </div>
            <Button onClick={onBack} className="w-full bg-property-action hover:bg-property-action/90 text-white">
              Back to Sign In
            </Button>
            <p className="text-property-text-secondary text-xs mt-4">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-property-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-property-card shadow-lg border border-gray-100">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="p-2 hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <Badge className={`${config.color} text-white px-3 py-1`}>
                <Icon className="w-4 h-4 mr-2" />
                {config.title}
              </Badge>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-property-text-primary">Reset Password</CardTitle>
          <p className="text-property-text-secondary text-sm">{config.description}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-blue-900 font-medium text-sm mb-1">Password Reset Instructions</h4>
                <p className="text-blue-700 text-xs">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-property-text-primary font-medium">
                Email Address
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="pl-10 border-gray-300 focus:border-property-action"
                  disabled={authState.isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className={`w-full ${config.color} hover:opacity-90 text-white font-medium`}
              disabled={authState.isLoading || !email}
            >
              {authState.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="link"
              onClick={onBack}
              className="text-property-text-secondary hover:text-property-text-primary p-0 h-auto text-sm"
              disabled={authState.isLoading}
            >
              Back to Sign In
            </Button>
          </div>

          {/* Security Note */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-property-text-secondary text-xs">
              <strong>Security Note:</strong> For your protection, password reset links expire after 1 hour and can only
              be used once.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
