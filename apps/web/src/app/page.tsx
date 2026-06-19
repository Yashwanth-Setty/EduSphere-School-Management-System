import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-spira-700 flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="font-semibold text-text-900 text-lg tracking-tight">SPIRA</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-700">
            <a href="#features" className="hover:text-spira-700 transition-colors">Features</a>
            <a href="#modules" className="hover:text-spira-700 transition-colors">Modules</a>
            <a href="#security" className="hover:text-spira-700 transition-colors">Security</a>
            <a href="#contact" className="hover:text-spira-700 transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-text-700 hover:text-spira-700 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 transition-colors"
            >
              Request demo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-spira-500/10 text-spira-800 text-sm font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-spira-700 inline-block" />
          School operations, reimagined
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-900 tracking-tight leading-tight max-w-4xl mx-auto">
          The complete school operating system
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-text-500 max-w-2xl mx-auto leading-relaxed">
          SPIRA connects administration, academics, finance, parents and students in a single secure platform. Built for modern schools with FERPA, GDPR, and WCAG 2.2 AA compliance.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/login"
            className="px-6 py-3 text-base font-semibold text-white bg-spira-700 rounded-md hover:bg-spira-800 transition-colors shadow-md"
          >
            Get started
          </Link>
          <a
            href="#modules"
            className="px-6 py-3 text-base font-semibold text-spira-700 bg-spira-500/10 rounded-md hover:bg-spira-500/20 transition-colors"
          >
            Explore modules
          </a>
        </div>
      </section>

      {/* Module grid */}
      <section id="modules" className="bg-surface-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-text-900 text-center mb-4">Everything your school needs</h2>
          <p className="text-text-500 text-center mb-12 max-w-xl mx-auto">
            Twelve integrated modules covering every aspect of school operations.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MODULES.map((m) => (
              <div
                key={m.name}
                className="bg-white rounded-lg p-5 border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-3">{m.icon}</div>
                <h3 className="font-semibold text-text-900 text-sm">{m.name}</h3>
                <p className="text-text-500 text-xs mt-1 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-text-900 mb-4">Built for trust</h2>
          <p className="text-text-500 max-w-2xl mx-auto mb-12">
            SPIRA is designed privacy-first and access-control-first. Every authorization decision is enforced server-side.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {["FERPA Ready", "GDPR Compliant", "WCAG 2.2 AA", "RBAC Enforced", "OpenID Connect SSO", "Audit Logging"].map(
              (badge) => (
                <span
                  key={badge}
                  className="px-4 py-2 bg-spira-500/10 text-spira-800 rounded-full text-sm font-medium border border-spira-300/30"
                >
                  {badge}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-spira-700 flex items-center justify-center text-white text-xs font-bold">
              S
            </div>
            <span className="text-sm text-text-500">SPIRA — School Parent Interaction & Resource Access</span>
          </div>
          <p className="text-xs text-text-500">© {new Date().getFullYear()} SPIRA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const MODULES = [
  { name: "Student Management", icon: "🎓", desc: "Admission records, profiles, section placement, parent links" },
  { name: "Faculty Management", icon: "👨‍🏫", desc: "Staff records, course assignments, timetable ownership" },
  { name: "Attendance", icon: "📋", desc: "Session-based marking, bulk submission, trend summaries" },
  { name: "Timetable", icon: "📅", desc: "Conflict-free weekly schedules, section and teacher views" },
  { name: "Course & Assignment", icon: "📚", desc: "Course offerings, assignment posting, submissions" },
  { name: "Examination & Results", icon: "📊", desc: "Exam entry, GPA calculation, controlled publication" },
  { name: "Fee Management", icon: "💰", desc: "Fee plans, invoice generation, gateway payments, receipts" },
  { name: "Communication", icon: "📢", desc: "Role-scoped announcements, delivery logs, read tracking" },
  { name: "Document Management", icon: "📄", desc: "Secure uploads, signed URLs, retention policies" },
  { name: "Analytics & Reports", icon: "📈", desc: "KPI dashboards, CSV/PDF exports, role-based views" },
  { name: "Parent Portal", icon: "👨‍👩‍👧", desc: "Linked children overview, attendance, fees, documents" },
  { name: "AI Features", icon: "🤖", desc: "Risk scoring, performance summaries (feature-flagged)" },
];
