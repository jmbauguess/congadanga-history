import Link from "next/link";
import { GetServerSideProps } from "next";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabaseClient";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const league = (ctx.query.league as string) ?? "Congadanga";

  const { data, error } = await supabase
  .from("v_draft_seasons")
  .select("season")
  .eq("league", league);

  if (error) {
    return { props: { league, seasons: [], error: error.message } };
  }

  const set = new Set<number>((data ?? []).map((r: any) => Number(r.season)));
  const seasons = Array.from(set).filter(Number.isFinite).sort((a, b) => b - a);

  return { props: { league, seasons, error: null } };
};

export default function DraftsIndex({
  league,
  seasons,
  error,
}: {
  league: string;
  seasons: number[];
  error: string | null;
}) {
  return (
    <Layout league={league}>
      <h1 className="h1">Drafts</h1>
      <div className="subtle">
        League: <strong>{league}</strong> • Draft boards by season <Link className="pill" href={`/drafts/all?league=${encodeURIComponent(league)}`}>
  View All Draft Picks →
</Link>

      </div>

      {error ? <pre style={{ marginTop: 12 }}>{error}</pre> : null}

      <div className="tableWrap" style={{ marginTop: 18 }}>
        <div
          className="row rowHeader"
          style={{ gridTemplateColumns: "1fr 1fr", minWidth: 0 }}
        >
          <div>Season</div>
          <div style={{ textAlign: "right" }}>Open</div>
        </div>



        {seasons.map((s) => (
          <Link
            key={s}
            className="row"
            href={`/drafts/${s}?league=${encodeURIComponent(league)}`}
            style={{ gridTemplateColumns: "1fr 1fr", minWidth: 0 }}
          >
            <div style={{ fontWeight: 900 }}>{s}</div>
            <div style={{ textAlign: "right", color: "rgba(230,237,247,0.7)" }}>
              View draft →
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
