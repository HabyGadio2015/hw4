import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <h4>Yale Bulldog Blue by Campus Customs</h4>
          <p>57 Broadway, New Haven, CT 06511</p>
          <p>
            Order help: <a href="mailto:orderdept@campuscustoms.com">orderdept@campuscustoms.com</a>
          </p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/products">All Products</Link>
          <Link to="/about">About Us</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/login">Log in</Link>
          <Link to="/create-account">Create Account</Link>
        </div>
      </div>
      <p className="footer-note">Officially licensed Yale merchandise · Class project demo site</p>
    </footer>
  )
}
