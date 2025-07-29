import { supabase } from "@/lib/supabase"
import type { RegisterData, LoginCredentials } from "@/types/auth"

export class AuthAPI {
  static async register(data: RegisterData) {
    try {
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            role: data.role,
            ...(data.role === "owner" && {
              company_name: data.companyName,
              business_license: data.businessLicense,
            }),
            ...(data.role === "tenant" && {
              emergency_contact_name: data.emergencyContactName,
              emergency_contact_phone: data.emergencyContactPhone,
              emergency_contact_relationship: data.emergencyContactRelationship,
            }),
          },
        },
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error("Registration failed")
      }

      // Update the users table with additional data
      const { error: profileError } = await supabase
        .from("users")
        .update({
          company_name: data.role === "owner" ? data.companyName : null,
          business_license: data.role === "owner" ? data.businessLicense : null,
          emergency_contact_name: data.role === "tenant" ? data.emergencyContactName : null,
          emergency_contact_phone: data.role === "tenant" ? data.emergencyContactPhone : null,
          emergency_contact_relationship: data.role === "tenant" ? data.emergencyContactRelationship : null,
        })
        .eq("id", authData.user.id)

      if (profileError) {
        console.error("Profile update error:", profileError)
      }

      return {
        success: true,
        message: "Registration successful! Please check your email to verify your account.",
        user: authData.user,
      }
    } catch (error) {
      console.error("Registration error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Registration failed",
      }
    }
  }

  static async login(credentials: LoginCredentials) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error("Login failed")
      }

      // Get user profile data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (userError) {
        console.error("User data fetch error:", userError)
      }

      // Check if role matches
      if (userData && userData.role !== credentials.role) {
        await supabase.auth.signOut()
        throw new Error(`Invalid credentials for ${credentials.role} account`)
      }

      // Update last login
      if (userData) {
        await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", authData.user.id)
      }

      return {
        success: true,
        message: "Login successful",
        user: userData,
        session: authData.session,
      }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Login failed",
      }
    }
  }

  static async logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(error.message)
      }
      return { success: true, message: "Logged out successfully" }
    } catch (error) {
      console.error("Logout error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Logout failed",
      }
    }
  }

  static async getCurrentUser() {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return { user: null, session: null }
      }

      const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (userError) {
        console.error("User data fetch error:", userError)
        return { user: null, session: null }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      return { user: userData, session }
    } catch (error) {
      console.error("Get current user error:", error)
      return { user: null, session: null }
    }
  }

  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        message: "Password reset email sent successfully",
      }
    } catch (error) {
      console.error("Password reset error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Password reset failed",
      }
    }
  }
}
