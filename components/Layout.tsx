import Link from "next/link";
import { ReactNode, useMemo } from "react";
import { useRouter } from "next/router";

const LEAGUES = ["Congadanga"]; // add more later, e.g. "Feetball"

export default function Layout({
  children,
  league = "Congadanga",
}: {
  children: ReactNode;
  league?: string;
}) {
  const router = useRouter();

  const currentLeague = useMemo(() => {
    const qLeague = router.query?.league;
    if (typeof qLeague === "string" && qLeague.trim()) return qLeague;
    return league;
  }, [router.query?.league, league]);

  function onLeagueChange(newLeague: string) {
    // Preserve current route + params, just update the league query param
    const nextQuery = { ...router.query, league: newLeague };
    router.push({ pathname: router.pathname, query: nextQuery });
  }

  return (
    <>
      <header className="header">
        <nav className="nav">
          <Link className="brand" href={`/?league=${encodeURIComponent(currentLeague)}`}>
            <h1>Congadanga History</h1>
            <span className="badge">v1</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="navLinks">
              <Link className="pill" href={`/seasons?league=${encodeURIComponent(currentLeague)}`}>
                Seasons
              </Link>
              <Link className="pill" href={`/managers?league=${encodeURIComponent(currentLeague)}`}>
                Managers
              </Link>
              <Link className="pill" href={`/teams?league=${encodeURIComponent(currentLeague)}`}>
  Teams
</Link>
            </div>

            {/* League selector */}
            <select
              className="select"
              value={currentLeague}
              onChange={(e) => onLeagueChange(e.target.value)}
              aria-label="Select league"
              style={{ padding: "8px 10px", borderRadius: 999 }}
            >
              {LEAGUES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </nav>
      </header>

      <div className="container">{children}</div>

      <footer className="footer">Built for friends • Data nerd edition</footer>
    </>
  );
}
