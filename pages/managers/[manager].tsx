import Link from "next/link";
import { GetServerSideProps } from "next";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabaseClient";

type Row = {
  league: string;
  year: number;
  manager: string;
  team_name: string;

  wins: number;
  losses: number;

  points_scored: number;
  points_against: number;

  season_finish: number | null;
  regular_season_finish: number | null;

  post_season_wins?: number;
  post_season_losses?: number;
  playoff_wins?: number;
  playoff_losses?: number;
  consolation_wins?: number;
  consolation_losses?: number;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const league = (ctx.query.league as string) ?? "Congadanga";
  const slug = String(ctx.params?.manager ?? "");

  const { data, error } = await supabase
    .from("v_team_seasons")
    .select("*")
    .eq("league", league)
    .order("year", { ascending: true });

  if (error) {
    return { props: { league, slug, managerActual: null, rows: [], error: error.message } };
  }

  const allRows = (data ?? []) as Row[];
  const match = allRows.find((r) => r?.manager && slugify(r.manager) === slug);
  const managerActual = match?.manager ?? null;
  const rows = managerActual ? allRows.filter((r) => r.manager === managerActual) : [];

  return {
    props: { league, slug, managerActual, rows, error: null },
  };
};

export default function ManagerPage({
  league,
  managerActual,
  rows,
  error,
}: {
  league: string;
  managerActual: string | null;
  rows: Row[];
  error: string | null;
}) {
  if (error) {
    return (
      <Layout league={league}>
        <Link className="pill" href={`/managers?league=${encodeURIComponent(league)}`}>
          ← Back
        </Link>
        <h1 className="h1" style={{ marginTop: 14 }}>
          Error
        </h1>
        <pre style={{ marginTop: 12 }}>{error}</pre>
      </Layout>
    );
  }

  if (!managerActual || rows.length === 0) {
    return (
      <Layout league={league}>
        <Link className="pill" href={`/managers?league=${encodeURIComponent(league)}`}>
          ← Back
        </Link>
        <h1 className="h1" style={{ marginTop: 14 }}>
          Manager not found
        </h1>
        <div className="subtle" style={{ marginTop: 8 }}>
          This can happen if a name changed across seasons.
        </div>
      </Layout>
    );
  }

  const championships = rows.filter((r) => r.season_finish === 1).length;

  const totalWins = rows.reduce((s, r) => s + (r.wins ?? 0), 0);
  const totalLosses = rows.reduce((s, r) => s + (r.losses ?? 0), 0);
  const totalPF = rows.reduce((s, r) => s + Number(r.points_scored ?? 0), 0);
  const totalPA = rows.reduce((s, r) => s + Number(r.points_against ?? 0), 0);

  const avgFinish =
    Math.round(
      (rows.reduce((sum, r) => sum + (r.season_finish ?? 0), 0) / rows.length) * 100
    ) / 100;

  return (
    <Layout league={league}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link className="pill" href={`/managers?league=${encodeURIComponent(league)}`}>
          ← Back
        </Link>
        <Link className="pill" href={`/seasons?league=${encodeURIComponent(league)}`}>
          Seasons
        </Link>
      </div>

      <h1 className="h1" style={{ marginTop: 14 }}>
        {managerActual}
      </h1>
      <div className="subtle">Career view • {league}</div>

      <div className="kpiGrid">
        <div className="kpi">
          <div className="label">Seasons</div>
          <div className="value">{rows.length}</div>
        </div>
        <div className="kpi">
          <div className="label">Championships</div>
          <div className="value">🏆 {championships}</div>
        </div>
        <div className="kpi">
          <div className="label">Avg Finish</div>
          <div className="value">{avgFinish}</div>
        </div>
      </div>

      <div className="kpiGrid" style={{ marginTop: 12 }}>
        <div className="kpi">
          <div className="label">Total Record</div>
          <div className="value">
            {totalWins}-{totalLosses}
          </div>
        </div>
        <div className="kpi">
          <div className="label">PF</div>
          <div className="value">{Math.round(totalPF * 100) / 100}</div>
        </div>
        <div className="kpi">
          <div className="label">PA</div>
          <div className="value">{Math.round(totalPA * 100) / 100}</div>
        </div>
      </div>

      <h2 style={{ marginTop: 22, fontSize: 22, fontWeight: 900 }}>Seasons</h2>

      <div className="tableWrap">
        <div
          className="row rowHeader"
          style={{
            gridTemplateColumns: "0.7fr 1.8fr 0.9fr 0.9fr 1fr 1fr 0.9fr 1.1fr",
          }}
        >
          <div>Year</div>
          <div>Team</div>
          <div>Finish</div>
          <div>W-L</div>
          <div>PF</div>
          <div>PA</div>
          <div>Reg</div>
          <div>Post</div>
        </div>

        {rows.map((r) => (
          <div
            key={`${r.year}-${r.team_name}`}
            className="row"
            style={{
              gridTemplateColumns: "0.7fr 1.8fr 0.9fr 0.9fr 1fr 1fr 0.9fr 1.1fr",
            }}
          >
            <div style={{ fontWeight: 900 }}>{r.year}</div>
            <div style={{ fontWeight: 800 }}>{r.team_name}</div>
            <div>{r.season_finish ?? "—"}</div>
            <div>
              {r.wins}-{r.losses}
            </div>
            <div>{r.points_scored}</div>
            <div>{r.points_against}</div>
            <div>{r.regular_season_finish ?? "—"}</div>
            <div>
              {(r.post_season_wins ?? 0)}-{(r.post_season_losses ?? 0)}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
