import { Link } from 'react-router-dom'

function Layout({ children }) {
  return (
    <div className="layout">
      <header className="header">
        <nav className="nav">
          <Link to="/" className="logo">
            Dobeu.info
          </Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/reviews">Reviews</Link>
            <Link to="/submit">Submit Product</Link>
          </div>
        </nav>
      </header>
      <main className="main">
        {children}
      </main>
      <footer className="footer">
        <p>© {new Date().getFullYear()} Dobeu Tech Solutions. Independent software reviews.</p>
        <p>Run by Jeremy Williams — zero vendor bias, real-world testing.</p>
      </footer>
    </div>
  )
}

export default Layout

