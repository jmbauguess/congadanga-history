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
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const league = (ctx.query.league as string) ?? "Congadanga";
  const year = Number(ctx.params?.year);

  const { data, error } = await supabase
    .from("v_season_standings")
    .select("*")
    .eq("league", league)
    .eq("year", year);

  return {
    props: {
      league,
      year,
      rows: (data ?? []) as Row[],
      error: error?.message ?? null,
    },
  };
};

export default function SeasonPage({
  league,
  year,
  rows,
  error,
}: {
  league: string;
  year: number;
  rows: Row[];
  error: string | null;
}) {
  const sorted = [...rows].sort((a, b) => {
    const af = a.season_finish ?? 999;
    const bf = b.season_finish ?? 999;
    if (af !== bf) return af - bf;
    return (b.points_scored ?? 0) - (a.points_scored ?? 0);
  });

  const champ = sorted.find((r) => r.season_finish === 1);
  const second = sorted.find((r) => r.season_finish === 2);
  const third = sorted.find((r) => r.season_finish === 3);

  return (
    <Layout league={league}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link className="pill" href={`/seasons?league=${encodeURIComponent(league)}`}>
          ← Back
        </Link>
        <Link className="pill" href={`/managers?league=${encodeURIComponent(league)}`}>
          Managers
        </Link>
      </div>

      <h1 className="h1" style={{ marginTop: 14 }}>
        {league} — {year}
      </h1>

      {error ? <pre style={{ marginTop: 12 }}>{error}</pre> : null}

      {/* Podium */}
      <div className="kpiGrid" style={{ marginTop: 16 }}>
        <div className="kpi">
          <div className="label">Champion</div>
          <div className="value">
            {champ ? `🏆 ${champ.manager}` : "—"}
          </div>
          <div className="subtle" style={{ marginTop: 6 }}>
            {champ ? champ.team_name : ""}
          </div>
        </div>

        <div className="kpi">
          <div className="label">Runner-Up</div>
          <div className="value">
            {second ? `🥈 ${second.manager}` : "—"}
          </div>
          <div className="subtle" style={{ marginTop: 6 }}>
            {second ? second.team_name : ""}
          </div>
        </div>

        <div className="kpi">
          <div className="label">Third Place</div>
          <div className="value">
            {third ? `🥉 ${third.manager}` : "—"}
          </div>
          <div className="subtle" style={{ marginTop: 6 }}>
            {third ? third.team_name : ""}
          </div>
        </div>
      </div>

      <div className="tableWrap">
        <div
          className="row rowHeader"
          style={{
            gridTemplateColumns: "0.6fr 1.2fr 1.8fr 0.8fr 0.9fr 0.9fr 1fr 0.9fr",
          }}
        >
          <div>Finish</div>
          <div>Manager</div>
          <div>Team</div>
          <div>W-L</div>
          <div>PF</div>
          <div>PA</div>
          <div>Diff</div>
          <div>Reg</div>
        </div>

        {sorted.map((r) => {
          const diff = (r.points_scored ?? 0) - (r.points_against ?? 0);
          const diffRounded = Math.round(diff * 100) / 100;

          return (
            <div
              key={`${r.manager}-${r.team_name}-${r.season_finish}`}
              className="row"
              style={{
                gridTemplateColumns: "0.6fr 1.2fr 1.8fr 0.8fr 0.9fr 0.9fr 1fr 0.9fr",
                minWidth: 1100,
              }}
            >
              <div style={{ fontWeight: 900 }}>{r.season_finish ?? "—"}</div>
              <div style={{ fontWeight: 800 }}>{r.manager}</div>
              <div>{r.team_name}</div>
              <div>
                {r.wins}-{r.losses}
              </div>
              <div>{r.points_scored}</div>
              <div>{r.points_against}</div>
              <div style={{ color: diffRounded >= 0 ? "var(--good)" : "var(--bad)" }}>
                {diffRounded}
              </div>
              <div>{r.regular_season_finish ?? "—"}</div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
