export default function About() {
  return (
    <section className="section page">
      <h1 className="page-title">About Us</h1>
      <p className="lead">
        Yale Bulldog Blue by Campus Customs is a New Haven shop for officially licensed Yale apparel and gifts,
        located at 57 Broadway, just steps from campus.
      </p>

      <div className="about-grid">
        <div className="info-card">
          <h3>What we carry</h3>
          <p>
            Hoodies, crewnecks, quarter-zips, T-shirts, and jackets — plus collections for the residential
            colleges, varsity sports, alumni class years, and the whole Yale family.
          </p>
        </div>
        <div className="info-card">
          <h3>Who we serve</h3>
          <p>
            Students gearing up for The Game, parents and grandparents visiting campus, alumni coming back for
            reunions, and Bulldog fans everywhere.
          </p>
        </div>
        <div className="info-card">
          <h3>Returns</h3>
          <p>
            Unworn items with original tags can be returned within 30 days of shipping. Custom alumni items are
            final sale.
          </p>
        </div>
        <div className="info-card">
          <h3>Visit or contact us</h3>
          <p>
            57 Broadway, New Haven, CT 06511
            <br />
            <a href="mailto:orderdept@campuscustoms.com">orderdept@campuscustoms.com</a>
          </p>
        </div>
      </div>
    </section>
  )
}
