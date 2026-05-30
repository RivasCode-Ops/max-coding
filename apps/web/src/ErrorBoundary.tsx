import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Max Stack UI:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-screen">
          <h1>Erro na interface</h1>
          <p>{this.state.error.message}</p>
          <p className="note">Tente recarregar a página (Ctrl+F5). Se persistir, rode <code>npm start</code> na raiz do max-coding.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
