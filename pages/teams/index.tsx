import Link from "next/link";
import { GetServerSideProps } from "next";
import { useMemo, useState } from "react";
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
};

type SortKey =
  | "year"
  | "finish"
  | "points_scored"
  | "points_against"
  | "avg_points_scored"
  | "avg_points_against"
  | "wins";


export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const league = (ctx.query.league as string) ?? "Congadanga";

  const { data, error } = await supabase
    .from("v_teams")
    .select(
      "team_season_id, league, year, manager, team_name, wins, losses, points_scored, points_against, season_finish"
    )
    .eq("league", league);

  return {
    props: {
      league,
      rows: (data ?? []) as Row[],
      error: error?.message ?? null,
    },
  };
};

export default function TeamsPage({
  league,
  rows,
  error,
}: {
  league: string;
  rows: Row[];
  error: string | null;
}) {

  const exportTeamsXlsx = async (rowsToExport: Row[]) => {
  const XLSX = await import("xlsx");

  const sheetRows = rowsToExport.map((r) => {
    const games = (r.wins ?? 0) + (r.losses ?? 0);
    const avgPF = games ? Number(r.points_scored ?? 0) / games : 0;
    const avgPA = games ? Number(r.points_against ?? 0) / games : 0;

    return {
      Year: r.year,
      Manager: r.manager,
      Team: r.team_name,
      Finish: r.season_finish ?? "",
      Wins: r.wins,
      Losses: r.losses,
      "Points Scored": r.points_scored,
      "Points Against": r.points_against,
      "Avg Points Scored": Math.round(avgPF * 100) / 100,
      "Avg Points Against": Math.round(avgPA * 100) / 100,
      "Team Season ID": r.team_season_id,
    };
  });

  const ws = XLSX.utils.json_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Teams");

  XLSX.writeFile(wb, `teams_${league}.xlsx`);
};


  const gamesPlayed = (r: Row) => {
  const g = (r.wins ?? 0) + (r.losses ?? 0);
  return g > 0 ? g : 0;
};

const avgPF = (r: Row) => {
  const g = gamesPlayed(r);
  return g ? Number(r.points_scored ?? 0) / g : 0;
};

const avgPA = (r: Row) => {
  const g = gamesPlayed(r);
  return g ? Number(r.points_against ?? 0) / g : 0;
};

const fmt2 = (n: number) => Math.round(n * 100) / 100;


  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("year");



  const filteredSorted = useMemo(() => {
    const qq = q.trim().toLowerCase();

    const filtered = qq
      ? rows.filter(
          (r) =>
            r.team_name?.toLowerCase().includes(qq) ||
            r.manager?.toLowerCase().includes(qq) ||
            String(r.year).includes(qq)
        )
      : rows;

    return [...filtered].sort((a, b) => {
  switch (sort) {
    case "finish": {
      const af = a.season_finish ?? 999;
      const bf = b.season_finish ?? 999;
      if (af !== bf) return af - bf; // lower is better
      return (b.points_scored ?? 0) - (a.points_scored ?? 0);
    }
    case "points_scored":
      return (b.points_scored ?? 0) - (a.points_scored ?? 0);
    case "points_against":
      return (b.points_against ?? 0) - (a.points_against ?? 0);
    case "avg_points_scored":
      return avgPF(b) - avgPF(a);
    case "avg_points_against":
      return avgPA(b) - avgPA(a);
    case "wins":
      return (b.wins ?? 0) - (a.wins ?? 0);
    case "year":
    default:
      return (b.year ?? 0) - (a.year ?? 0); // newest first
  }
});
  }, [rows, q, sort]);

  return (
    <Layout league={league}>
      <h1 className="h1">Teams</h1>
      <div className="subtle">
        League: <strong>{league}</strong> • Every team-season (year + manager)
      </div>

      {error ? <pre style={{ marginTop: 12 }}>{error}</pre> : null}

      <div className="controls">
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search team, manager, or year..."
          style={{ minWidth: 320 }}
        />

        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as any)}>
  <option value="year">Sort: Year (newest)</option>
  <option value="finish">Sort: Finish (best)</option>
  <option value="points_scored">Sort: Points Scored (PF)</option>
  <option value="points_against">Sort: Points Against (PA)</option>
  <option value="avg_points_scored">Sort: Avg Points Scored (per game)</option>
  <option value="avg_points_against">Sort: Avg Points Against (per game)</option>
  <option value="wins">Sort: Wins</option>
</select>


<button className="pill" type="button" onClick={() => exportTeamsXlsx(filteredSorted)}>
  Export Excel
</button>


      </div>

      <div className="tableWrap">
        <div
  className="row rowHeader"
  style={{
    gridTemplateColumns: "0.8fr 1.2fr 2fr 0.9fr 0.9fr 1fr 1fr 1fr 1fr",
    minWidth: 1050,
  }}
>
  <div>Year</div>
  <div>Manager</div>
  <div>Team</div>
  <div>Finish</div>
  <div>W-L</div>
  <div>PF</div>
  <div>PA</div>
  <div>Avg PF</div>
  <div>Avg PA</div>
</div>


        {filteredSorted.map((r) => (
  <Link
    key={r.team_season_id}
    className="row"
    href={`/teams/${r.team_season_id}?league=${encodeURIComponent(league)}`}
    style={{
      gridTemplateColumns: "0.8fr 1.2fr 2fr 0.9fr 0.9fr 1fr 1fr 1fr 1fr",
      minWidth: 1050,
    }}
  >
    <div style={{ fontWeight: 900 }}>{r.year}</div>
    <div style={{ fontWeight: 800 }}>{r.manager}</div>
    <div>{r.team_name}</div>
    <div>{r.season_finish ?? "—"}</div>
    <div>
      {r.wins}-{r.losses}
    </div>
    <div>{r.points_scored}</div>
    <div>{r.points_against}</div>
    <div>{fmt2(avgPF(r))}</div>
    <div>{fmt2(avgPA(r))}</div>
  </Link>
))}

      </div>
    </Layout>
  );
}
