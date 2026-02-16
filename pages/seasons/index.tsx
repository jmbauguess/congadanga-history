import Link from "next/link";
import { GetServerSideProps } from "next";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabaseClient";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const league = (ctx.query.league as string) ?? "Congadanga";

  const { data, error } = await supabase
    .from("v_season_standings")
    .select("year")
    .eq("league", league);

  if (error) {
    return { props: { league, years: [], error: error.message } };
  }

  const yearSet = new Set<number>((data ?? []).map((r: any) => Number(r.year)));
  const years = Array.from(yearSet).filter(Number.isFinite).sort((a, b) => b - a);

  return { props: { league, years, error: null } };
};

export default function SeasonsPage({
  league,
  years,
  error,
}: {
  league: string;
  years: number[];
  error: string | null;
}) {
  return (
    <Layout league={league}>
      <h1 className="h1">Seasons</h1>
      <div className="subtle">
        League: <strong>{league}</strong>
      </div>

      {error ? <pre style={{ marginTop: 12 }}>{error}</pre> : null}

      <div className="tableWrap" style={{ marginTop: 18 }}>
        <div
          className="row rowHeader"
          style={{
            gridTemplateColumns: "1fr 1fr",
            minWidth: 0,
          }}
        >
          <div>Year</div>
          <div style={{ textAlign: "right" }}>Open</div>
        </div>

        {years.map((y) => (
          <Link
            key={y}
            className="row"
            href={`/seasons/${y}?league=${encodeURIComponent(league)}`}
            style={{
              gridTemplateColumns: "1fr 1fr",
              minWidth: 0,
            }}
          >
            <div style={{ fontWeight: 900 }}>{y}</div>
            <div style={{ textAlign: "right", color: "rgba(230,237,247,0.7)" }}>
              View standings →
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
