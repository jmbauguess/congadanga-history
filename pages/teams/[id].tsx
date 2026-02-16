import Link from "next/link";
import { GetServerSideProps } from "next";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabaseClient";

type Row = {
  team_season_id: number;
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

  post_season_wins: number;
  post_season_losses: number;
  playoff_wins: number;
  playoff_losses: number;
  consolation_wins: number;
  consolation_losses: number;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const league = (ctx.query.league as string) ?? "Congadanga";
  const id = Number(ctx.params?.id);

  const { data, error } = await supabase
    .from("v_teams")
    .select("*")
    .eq("league", league)
    .eq("team_season_id", id)
    .maybeSingle();

  return {
    props: {
      league,
      row: (data ?? null) as Row | null,
      error: error?.message ?? null,
    },
  };
};

export default function TeamSeasonPage({
  league,
  row,
  error,
}: {
  league: string;
  row: Row | null;
  error: string | null;
}) {
  if (error) {
    return (
      <Layout league={league}>
        <Link className="pill" href={`/teams?league=${encodeURIComponent(league)}`}>
          ← Back
        </Link>
        <h1 className="h1" style={{ marginTop: 14 }}>Error</h1>
        <pre style={{ marginTop: 12 }}>{error}</pre>
      </Layout>
    );
  }

  if (!row) {
    return (
      <Layout league={league}>
        <Link className="pill" href={`/teams?league=${encodeURIComponent(league)}`}>
          ← Back
        </Link>
        <h1 className="h1" style={{ marginTop: 14 }}>Team not found</h1>
      </Layout>
    );
  }

  const diff = Math.round(((row.points_scored ?? 0) - (row.points_against ?? 0)) * 100) / 100;

  return (
    <Layout league={league}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link className="pill" href={`/teams?league=${encodeURIComponent(league)}`}>← Back</Link>
        <Link className="pill" href={`/seasons/${row.year}?league=${encodeURIComponent(league)}`}>Season</Link>
        <Link className="pill" href={`/managers?league=${encodeURIComponent(league)}`}>Managers</Link>
      </div>

      <h1 className="h1" style={{ marginTop: 14 }}>
        {row.team_name}
      </h1>
      <div className="subtle">
        {row.manager} • {league} • {row.year}
      </div>

      <div className="kpiGrid">
        <div className="kpi">
          <div className="label">Finish</div>
          <div className="value">{row.season_finish ?? "—"}</div>
        </div>
        <div className="kpi">
          <div className="label">Record</div>
          <div className="value">{row.wins}-{row.losses}</div>
        </div>
        <div className="kpi">
          <div className="label">Point Diff</div>
          <div className="value">{diff}</div>
        </div>
      </div>

      <div className="kpiGrid" style={{ marginTop: 12 }}>
        <div className="kpi">
          <div className="label">PF</div>
          <div className="value">{row.points_scored}</div>
        </div>
        <div className="kpi">
          <div className="label">PA</div>
          <div className="value">{row.points_against}</div>
        </div>
        <div className="kpi">
          <div className="label">Postseason</div>
          <div className="value">{row.post_season_wins}-{row.post_season_losses}</div>
        </div>
      </div>

      <div className="tableWrap" style={{ marginTop: 18 }}>
        <div
          className="row rowHeader"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", minWidth: 800 }}
        >
          <div>Regular Finish</div>
          <div>Playoffs</div>
          <div>Consolation</div>
          <div>Postseason Total</div>
        </div>
        <div
          className="row"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", minWidth: 800 }}
        >
          <div>{row.regular_season_finish ?? "—"}</div>
          <div>{row.playoff_wins}-{row.playoff_losses}</div>
          <div>{row.consolation_wins}-{row.consolation_losses}</div>
          <div>{row.post_season_wins}-{row.post_season_losses}</div>
        </div>
      </div>
    </Layout>
  );
}
