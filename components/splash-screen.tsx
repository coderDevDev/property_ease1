"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Building, Home, Users, Shield, Sparkles } from "lucide-react"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentFeature, setCurrentFeature] = useState(0)

  const features = [
    { icon: Building, text: "Property Management", color: "text-blue-400" },
    { icon: Users, text: "Tenant Relations", color: "text-purple-400" },
    { icon: Home, text: "Smart Solutions", color: "text-green-400" },
    { icon: Shield, text: "Secure Platform", color: "text-orange-400" },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 2
      })
    }, 50)

    const featureTimer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 800)

    return () => {
      clearInterval(timer)
      clearInterval(featureTimer)
    }
  }, [onComplete])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Mobile-optimized Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      <Card className="w-full max-w-xs bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 relative z-10">
        <CardContent className="p-6 text-center">
          {/* Mobile-optimized Logo */}
          <div className="mb-6">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl blur-lg opacity-75 animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-2xl">
                <Building className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-bounce" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-1">
              PropertEase
            </h1>
            <p className="text-white/80 text-sm font-medium">Smart Property Management</p>
          </div>

          {/* Mobile-optimized Animated Features */}
          <div className="mb-6 h-16 flex items-center justify-center">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className={`transition-all duration-700 ${
                    currentFeature === index ? "opacity-100 scale-100" : "opacity-0 scale-75 absolute"
                  }`}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-md" />
                    <Icon className={`relative w-8 h-8 ${feature.color} mb-2 mx-auto`} />
                  </div>
                  <p className="text-white font-medium text-sm">{feature.text}</p>
                </div>
              )
            })}
          </div>

          {/* Mobile-optimized Progress Bar */}
          <div className="mb-6">
            <div className="relative w-full bg-white/20 rounded-full h-2 mb-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-full" />
              <div
                className="relative bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 h-2 rounded-full transition-all duration-100 ease-out shadow-lg"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse" />
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium">Loading... {progress}%</p>
          </div>

          {/* Mobile-optimized Features List */}
          <div className="space-y-2 text-left">
            {["Multi-property management", "Real-time notifications", "Secure document storage"].map(
              (feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-white/80 text-xs"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse" />
                  <span>{feature}</span>
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
