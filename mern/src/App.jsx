import { Link, Route, Routes } from "react-router-dom";

function MigrationLanding() {
  return (
    <main className="migration-shell">
      <header className="migration-header">
        <span className="migration-brand">Travel Qila</span>
        <span className="migration-label">React migration workspace</span>
      </header>
      <section className="migration-content">
        <p className="migration-eyebrow">MERN branch</p>
        <h1>Travel Qila is being migrated page by page.</h1>
        <p>
          This isolated React application is the migration target. The existing QA
          website remains intact while each route is ported and checked for visual,
          functional, and security parity.
        </p>
        <p className="migration-note">
          This workspace is not a replacement for the live QA pages yet.
        </p>
        <Link to="/migration-status">View migration status</Link>
      </section>
    </main>
  );
}

function MigrationStatus() {
  return (
    <main className="migration-shell">
      <header className="migration-header">
        <Link className="migration-brand" to="/">Travel Qila</Link>
        <span className="migration-label">Migration status</span>
      </header>
      <section className="migration-content">
        <h1>Parity-first migration</h1>
        <ul>
          <li>Source baseline: qa/bug-free-homepage-redesign</li>
          <li>Database and authentication: existing Supabase project</li>
          <li>Legacy QA pages: retained unchanged during migration</li>
          <li>Production cutover: not enabled</li>
        </ul>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MigrationLanding />} />
      <Route path="/migration-status" element={<MigrationStatus />} />
      <Route path="*" element={<MigrationLanding />} />
    </Routes>
  );
}
