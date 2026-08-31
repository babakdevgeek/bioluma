import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="listing-page">
      <div className="listing-shell stack-lg">
        <span className="section-kicker">404</span>
        <h1>Pressure drop.</h1>
        <p className="lede">That page does not exist, or it sank somewhere weird.</p>
        <div>
          <Link className="button" to="/en">go home</Link>
        </div>
      </div>
    </div>
  );
}
