import Link from "next/link";
import { GetServerSideProps } from "next";
import { useMemo, useState } from "react";
import Layout from "../../components/Layout";
import { fetchAllFromSupabase } from "../../lib/fetchAll";

type Row = {
  draft_pick_id: number;
  league: string;
  season: number;

  pick: number;
  round: number;
  pick_in_round: number | null;

  team: string;
  manager: string;

  player: string;
  position: string | null;
  player_id: string | null;
};

type SortKey = "season" | "pick" | "round" | "manager" | "team" | "position" | "player";

const toCsvValue = (v: any) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadTextFile = (filename: string, content: string, mime = "text/csv;charset=utf-8;") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const league = (ctx.query.league as string) ?? "Congadanga";

  const rows = await fetchAllFromSupabase<Row>(
    "v_draft_picks",
    (q) => q.eq("league", league).order("season", { ascending: true }).order("pick", { ascending: true }),
    1000
  );

  return { props: { league, rows } };
};

export default function DraftAllPage({ league, rows }: { league: string; rows: Row[] }) {
  const [q, setQ] = useState("");
  const [pos, setPos] = useState<string>("ALL");
  const [mgr, setMgr] = useState<string>("ALL");
  const [sort, setSort] = useState<SortKey>("season");

  // display pagination (client-side)
  const [pageSize, setPageSize] = useState(100);
  const [page, setPage] = useState(1);

  const positions = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.position && s.add(r.position));
    return Array.from(s).sort();
  }, [rows]);

  const managers = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.manager && s.add(r.manager));
    return Array.from(s).sort();
  }, [rows]);

  const filteredSorted = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let out = rows;

    if (pos !== "ALL") out = out.filter((r) => (r.position ?? "") === pos);
    if (mgr !== "ALL") out = out.filter((r) => (r.manager ?? "") === mgr);

    if (qq) {
      out = out.filter((r) => {
        return (
          String(r.season ?? "").includes(qq) ||
          String(r.pick ?? "").includes(qq) ||
          String(r.round ?? "").includes(qq) ||
          (r.player ?? "").toLowerCase().includes(qq) ||
          (r.team ?? "").toLowerCase().includes(qq) ||
          (r.manager ?? "").toLowerCase().includes(qq) ||
          (r.position ?? "").toLowerCase().includes(qq)
        );
      });
    }

    const sorted = [...out].sort((a, b) => {
      switch (sort) {
        case "pick":
          return (a.pick ?? 0) - (b.pick ?? 0);
        case "round":
          return (a.round ?? 0) - (b.round ?? 0) || (a.pick ?? 0) - (b.pick ?? 0);
        case "manager":
          return (a.manager ?? "").localeCompare(b.manager ?? "") || (a.season ?? 0) - (b.season ?? 0) || (a.pick ?? 0) - (b.pick ?? 0);
        case "team":
          return (a.team ?? "").localeCompare(b.team ?? "") || (a.season ?? 0) - (b.season ?? 0) || (a.pick ?? 0) - (b.pick ?? 0);
        case "position":
          return (a.position ?? "").localeCompare(b.position ?? "") || (a.season ?? 0) - (b.season ?? 0) || (a.pick ?? 0) - (b.pick ?? 0);
        case "player":
          return (a.player ?? "").localeCompare(b.player ?? "") || (a.season ?? 0) - (b.season ?? 0) || (a.pick ?? 0) - (b.pick ?? 0);
        case "season":
        default:
          return (a.season ?? 0) - (b.season ?? 0) || (a.pick ?? 0) - (b.pick ?? 0);
      }
    });

    return sorted;
  }, [rows, q, pos, mgr, sort]);

  // Reset page if filters change
  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filteredSorted.slice(start, start + pageSize);

  const exportCsv = () => {
    const header = ["Season", "Overall Pick", "Round", "Pick In Round", "Manager", "Team", "Player", "Position", "Player ID"];
    const lines = filteredSorted.map((r) =>
      [r.season, r.pick, r.round, r.pick_in_round ?? "", r.manager, r.team, r.player, r.position ?? "", r.player_id ?? ""]
        .map(toCsvValue)
        .join(",")
    );
    const csv = [header.map(toCsvValue).join(","), ...lines].join("\n");
    downloadTextFile(`draft_all_${league}.csv`, csv);
  };

  return (
    <Layout league={league}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link className="pill" href={`/drafts?league=${encodeURIComponent(league)}`}>← Back</Link>
        <button className="pill" type="button" onClick={exportCsv}>Export CSV</button>
      </div>

      <h1 className="h1" style={{ marginTop: 14 }}>Drafts — All Seasons</h1>
      <div className="subtle">
        {rows.length.toLocaleString()} picks loaded • Showing {total.toLocaleString()} after filters
      </div>

      <div className="controls">
        <input
          className="input"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Search season, player, manager, team, position..."
          style={{ minWidth: 320 }}
        />

        <select className="select" value={pos} onChange={(e) => { setPos(e.target.value); setPage(1); }}>
          <option value="ALL">All Positions</option>
          {positions.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select className="select" value={mgr} onChange={(e) => { setMgr(e.target.value); setPage(1); }}>
          <option value="ALL">All Managers</option>
          {managers.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="season">Sort: Season</option>
          <option value="pick">Sort: Overall Pick</option>
          <option value="round">Sort: Round</option>
          <option value="manager">Sort: Manager</option>
          <option value="team">Sort: Team</option>
          <option value="position">Sort: Position</option>
          <option value="player">Sort: Player</option>
        </select>

        <select className="select" value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
          <option value="200">200 / page</option>
          <option value="500">500 / page</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
        <button className="pill" type="button" onClick={() => setPage(1)} disabled={safePage === 1}>First</button>
        <button className="pill" type="button" onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage === 1}>Prev</button>
        <div className="badge">Page {safePage} / {totalPages}</div>
        <button className="pill" type="button" onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages}>Next</button>
        <button className="pill" type="button" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>Last</button>
      </div>

      <div className="tableWrap">
        <div
          className="row rowHeader"
          style={{ gridTemplateColumns: "0.8fr 0.9fr 0.8fr 1.2fr 1.6fr 2.2fr 0.8fr", minWidth: 1200 }}
        >
          <div>Season</div>
          <div>Pick</div>
          <div>Rnd</div>
          <div>Manager</div>
          <div>Team</div>
          <div>Player</div>
          <div>Pos</div>
        </div>

        {pageRows.map((r) => (
          <div
            key={r.draft_pick_id}
            className="row"
            style={{ gridTemplateColumns: "0.8fr 0.9fr 0.8fr 1.2fr 1.6fr 2.2fr 0.8fr", minWidth: 1200 }}
          >
            <div style={{ fontWeight: 900 }}>{r.season}</div>
            <div style={{ fontWeight: 900 }}>
              {r.pick}
              {r.pick_in_round ? <span style={{ opacity: 0.6, marginLeft: 8 }}>({r.pick_in_round})</span> : null}
            </div>
            <div>{r.round}</div>
            <div style={{ fontWeight: 800 }}>{r.manager}</div>
            <div>{r.team}</div>
            <div>{r.player}</div>
            <div>{r.position ?? "—"}</div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
