import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        Wanderly
        <span>.</span>
      </Link>

      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/explore">Explore</NavLink>
        <a href="#trips">My Trips</a>
      </nav>

      <div className="nav-actions">
        <button className="login-button">Log in</button>
        <button className="primary-button">Start planning</button>
      </div>
    </header>
  );
}

export default Navbar;
