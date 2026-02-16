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

type SortKey = "year" | "finish" | "points_scored" | "wins";

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
          <option value="points_scored">Sort: Points Scored</option>
          <option value="wins">Sort: Wins</option>
        </select>
      </div>

      <div className="tableWrap">
        <div
          className="row rowHeader"
          style={{ gridTemplateColumns: "0.8fr 1.2fr 2fr 0.9fr 0.9fr 1fr 0.9fr", minWidth: 1100 }}
        >
          <div>Year</div>
          <div>Manager</div>
          <div>Team</div>
          <div>Finish</div>
          <div>W-L</div>
          <div>PF</div>
          <div>PA</div>
        </div>

        {filteredSorted.map((r) => (
          <Link
            key={r.team_season_id}
            className="row"
            href={`/teams/${r.team_season_id}?league=${encodeURIComponent(league)}`}
            style={{ gridTemplateColumns: "0.8fr 1.2fr 2fr 0.9fr 0.9fr 1fr 0.9fr", minWidth: 1100 }}
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
          </Link>
        ))}
      </div>
    </Layout>
  );
}
