import Layout from "../../components/Layout";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Row = {
  league: string;
  manager: string;

  seasons: number;
  championships: number;
  playoff_appearances: number;
  consolation_appearances: number;

  wins: number;
  losses: number;
  avg_wins: number;
  avg_losses: number;

  points_scored: number;
  points_against: number;
  avg_points_scored: number;
  avg_points_against: number;

  avg_finish: number;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

type SortKey =
  | "championships"
  | "avg_finish"
  | "wins"
  | "points_scored"
  | "playoff_appearances";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const league = (ctx.query.league as string) ?? "Congadanga";

  const { data, error } = await supabase
    .from("v_manager_career_summary")
    .select("*")
    .eq("league", league);

  return {
    props: {
      league,
      rows: (data ?? []) as Row[],
      error: error?.message ?? null,
    },
  };
};

export default function ManagersPage({
  league,
  rows,
  error,
}: {
  league: string;
  rows: Row[];
  error: string | null;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("championships");

  const filteredSorted = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const filtered = qq
      ? rows.filter((r) => r.manager.toLowerCase().includes(qq))
      : rows;

    const get = (r: Row, key: SortKey) => {
      switch (key) {
        case "avg_finish":
          // lower is better; handled in comparator
          return r.avg_finish ?? 999;
        case "championships":
          return r.championships ?? 0;
        case "wins":
          return r.wins ?? 0;
        case "points_scored":
          return r.points_scored ?? 0;
        case "playoff_appearances":
          return r.playoff_appearances ?? 0;
        default:
          return 0;
      }
    };

    return [...filtered].sort((a, b) => {
      if (sort === "avg_finish") return get(a, sort) - get(b, sort);
      return get(b, sort) - get(a, sort);
    });
  }, [rows, q, sort]);

  return (
  <Layout league={league}>
    <h1 className="h1">Managers</h1>
    <div className="subtle">League: <strong>{league}</strong></div>

    {error ? <pre style={{ marginTop: 12 }}>{error}</pre> : null}

    <div className="controls">
      <input
        className="input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search managers..."
      />
      <select className="select" value={sort} onChange={(e) => setSort(e.target.value as any)}>
        <option value="championships">Sort: Championships</option>
        <option value="avg_finish">Sort: Avg Finish (lower better)</option>
        <option value="wins">Sort: Wins</option>
        <option value="points_scored">Sort: Points Scored</option>
        <option value="playoff_appearances">Sort: Playoff Appearances</option>
      </select>
    </div>

    <div className="tableWrap">
      <div
        className="row rowHeader"
        style={{
          gridTemplateColumns:
            "1.6fr 0.7fr 0.7fr 1fr 1.2fr 0.8fr 0.8fr 1fr 1fr 1.1fr 1.1fr 1.2fr 1.2fr 1fr",
        }}
      >
        <div>Name</div>
        <div>Seasons</div>
        <div>🏆</div>
        <div>Playoffs</div>
        <div>Consolation</div>
        <div>Wins</div>
        <div>Losses</div>
        <div>Avg W</div>
        <div>Avg L</div>
        <div>PF</div>
        <div>PA</div>
        <div>Avg PF</div>
        <div>Avg PA</div>
        <div>Avg Finish</div>
      </div>

      {filteredSorted.map((r) => (
        <Link
          key={r.manager}
          href={`/managers/${slugify(r.manager)}?league=${encodeURIComponent(league)}`}
          className="row"
          style={{
            gridTemplateColumns:
              "1.6fr 0.7fr 0.7fr 1fr 1.2fr 0.8fr 0.8fr 1fr 1fr 1.1fr 1.1fr 1.2fr 1.2fr 1fr",
          }}
        >
          <div style={{ fontWeight: 900 }}>{r.manager}</div>
          <div>{r.seasons}</div>
          <div>{r.championships}</div>
          <div>{r.playoff_appearances}</div>
          <div>{r.consolation_appearances}</div>
          <div>{r.wins}</div>
          <div>{r.losses}</div>
          <div>{r.avg_wins}</div>
          <div>{r.avg_losses}</div>
          <div>{r.points_scored}</div>
          <div>{r.points_against}</div>
          <div>{r.avg_points_scored}</div>
          <div>{r.avg_points_against}</div>
          <div>{r.avg_finish}</div>
        </Link>
      ))}
    </div>
  </Layout>
);

}
