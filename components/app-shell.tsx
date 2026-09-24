import { projectDetails } from "@/lib/project";

const foundationItems = [
  "Responsive application shell",
  "TypeScript and quality checks",
  "Environment variable contract",
] as const;

export function AppShell() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">
          ED
        </div>
        <div>
          <p className="eyebrow">Emergency Department</p>
          <h1>{projectDetails.name}</h1>
        </div>
      </header>

      <section className="content" aria-labelledby="foundation-title">
        <div className="intro">
          <span className="status-badge">Foundation ready</span>
          <p className="eyebrow">Project setup</p>
          <h2 id="foundation-title">A calm, secure request workspace is taking shape.</h2>
          <p className="lede">
            The application foundation is ready. Authentication, the shared monthly calendar,
            and staff request controls will be added in their dedicated work cards.
          </p>
        </div>

        <aside className="foundation-card" aria-labelledby="included-title">
          <p className="card-kicker">Work Card 01</p>
          <h3 id="included-title">Included in this foundation</h3>
          <ul>
            {foundationItems.map((item) => (
              <li key={item}>
                <span aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="card-note">No staff or operational data is shown in this setup view.</p>
        </aside>
      </section>

      <footer>
        <p>{projectDetails.purpose}</p>
      </footer>
    </main>
  );
}
