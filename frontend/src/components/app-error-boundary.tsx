import React from "react"
import type { ErrorInfo, ReactNode } from "react"
import UnhandledErrorPage from "@/pages/UnhandledErrorPage"

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
}

class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled application error", error, errorInfo)
  }

  private resetError = () => {
    this.setState({ hasError: false })
  }

  public render() {
    if (this.state.hasError) {
      return <UnhandledErrorPage onRetry={this.resetError} />
    }

    return this.props.children
  }
}

export default AppErrorBoundary
