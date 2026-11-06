import * as React from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { FiAlertCircle, FiCreditCard, FiEye, FiEyeOff, FiLock, FiMail, FiShield } from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/forms/FormInput"

export function Login() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  const [email, setEmail] = React.useState("admin@hotelpilot.com")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [remember, setRemember] = React.useState(true)
  const [errors, setErrors] = React.useState<{ email?: string; password?: string; form?: string }>({})
  const [submitting, setSubmitting] = React.useState(false)

  if (isAuthenticated) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard"
    return <Navigate to={redirectTo} replace />
  }

  function validate(): boolean {
    const nextErrors: typeof errors = {}
    if (!email.trim()) {
      nextErrors.email = "Email address is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email address."
    }
    if (!password) {
      nextErrors.password = "Password is required."
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    window.setTimeout(() => {
      const result = login(email, password, remember)
      setSubmitting(false)
      if (!result.success) {
        setErrors({ form: result.message })
        return
      }
      showToast({ title: "Welcome back", description: "You have signed in successfully.", variant: "success" })
      navigate("/dashboard", { replace: true })
    }, 400)
  }

  return (
    <div className="flex min-h-svh bg-background">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #16A6A0 0, transparent 45%), radial-gradient(circle at 80% 70%, #16A6A0 0, transparent 40%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-lg bg-sidebar-primary text-base font-bold text-sidebar-primary-foreground">
            HP
          </span>
          <span className="text-lg font-semibold tracking-wide">HotelPilot</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl leading-snug font-semibold">
            Smart Hotel Management &amp; Access Control
          </h2>
          <p className="mt-3 text-sm text-sidebar-foreground/70">
            Manage reservations, guests, rooms, RFID access and payments from a single,
            unified operations console built for hospitality teams.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-sidebar-border bg-white/5 p-3">
              <FiShield className="size-5 text-sidebar-primary" />
              <p className="mt-2 text-xs text-sidebar-foreground/80">
                Secure, role-based staff access
              </p>
            </div>
            <div className="rounded-lg border border-sidebar-border bg-white/5 p-3">
              <FiCreditCard className="size-5 text-sidebar-primary" />
              <p className="mt-2 text-xs text-sidebar-foreground/80">
                Reusable RFID card inventory
              </p>
            </div>
          </div>
        </div>
        <p className="relative z-10 text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} HotelPilot. Internal staff portal.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <span className="mb-3 flex size-11 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground lg:hidden">
              HP
            </span>
            <h1 className="text-xl font-semibold text-foreground">Sign in to HotelPilot</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your staff credentials to access the management console.
            </p>
          </div>

          {errors.form && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
              <FiAlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{errors.form}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="relative">
              <FormInput
                label="Email or username"
                type="email"
                name="email"
                autoComplete="username"
                placeholder="you@hotelpilotgrand.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                className="pl-9"
                required
              />
              <FiMail className="pointer-events-none absolute top-[34px] left-3 size-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <FormInput
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                className="pr-9 pl-9"
                required
              />
              <FiLock className="pointer-events-none absolute top-[34px] left-3 size-4 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-[30px] right-2.5 flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {showPassword ? <FiEyeOff className="size-4" /> : <FiEye className="size-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 rounded border-border accent-primary"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() =>
                  showToast({
                    title: "Password reset unavailable",
                    description: "This is a frontend prototype. Contact an administrator to reset your password.",
                    variant: "info",
                  })
                }
                className="font-medium text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" size="lg" disabled={submitting} className="mt-1 w-full justify-center">
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">Demo accounts (password: password123)</p>
            <ul className="space-y-0.5">
              <li>admin@hotelpilot.com — Administrator</li>
              <li>manager@hotelpilot.com — Manager</li>
              <li>reception@hotelpilot.com — Receptionist</li>
              <li>accounts@hotelpilot.com — Accountant</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
