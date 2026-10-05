import { Link } from 'react-router-dom'

const categories = [
  { title: 'Hoodies & Crewnecks', text: 'Heavyweight comfort for New Haven winters.' },
  { title: 'T-Shirts', text: 'Everyday tees from classic wordmarks to game-day graphics.' },
  { title: 'Residential Colleges', text: 'Rep your college — from Berkeley to Timothy Dwight.' },
  { title: 'Sports', text: 'Gear for fans of the Bulldogs’ varsity teams.' },
]

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <p className="eyebrow">Officially Licensed Merchandise</p>
          <h1>Big Pride, Big Yale.</h1>
          <p className="hero-text">
            Casual comfort and classic Bulldog pride for students, alumni, families, and fans — straight from
            our shop at 57 Broadway in New Haven.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-light">
              Shop Products
            </Link>
            <Link to="/about" className="btn btn-outline">
              Our Story
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Shop by Category</h2>
        <div className="card-grid">
          {categories.map((c) => (
            <Link to="/products" key={c.title} className="category-card">
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <span className="card-link">Browse →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section band">
        <div className="band-inner">
          <div>
            <h2>Gifts for every Bulldog in the family</h2>
            <p>Moms, dads, grandparents, siblings — find Yale gear for everyone cheering from the stands.</p>
          </div>
          <Link to="/create-account" className="btn btn-light">
            Create an Account
          </Link>
        </div>
      </section>
    </>
  )
}
