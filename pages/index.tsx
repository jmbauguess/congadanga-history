import Link from "next/link";
import Layout from "../components/Layout";

export default function Home() {
  const league = "Congadanga";

  return (
    <Layout league={league}>
      <h1 className="h1">Congadanga History</h1>
      <div className="subtle">Browse seasons, managers, and all-time stats.</div>

      <div className="controls" style={{ marginTop: 22 }}>
        <Link className="pill" href={`/seasons?league=${encodeURIComponent(league)}`}>
          Explore Seasons →
        </Link>
        <Link className="pill" href={`/managers?league=${encodeURIComponent(league)}`}>
          Explore Managers →
        </Link>
      </div>

      <div className="kpiGrid">
        <div className="kpi">
          <div className="label">Tip</div>
          <div className="value">Use search + sort</div>
        </div>
        <div className="kpi">
          <div className="label">Shareable</div>
          <div className="value">Copy URLs</div>
        </div>
        <div className="kpi">
          <div className="label">Next</div>
          <div className="value">Charts</div>
        </div>
      </div>
    </Layout>
  );
}
