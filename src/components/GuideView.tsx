// "How to use StudentNest" page. Screenshots are the same files the README uses.
import search from "../../docs/screenshots/01-search.jpg";
import costDetails from "../../docs/screenshots/02-cost-details.jpg";
import tracker from "../../docs/screenshots/03-tracker.jpg";
import compare from "../../docs/screenshots/04-compare.jpg";
import signIn from "../../docs/screenshots/05-sign-in.jpg";
import darkMode from "../../docs/screenshots/06-dark-mode.jpg";
import paste from "../../docs/screenshots/07-paste.jpg";
import aiResult from "../../docs/screenshots/08-ai-result.jpg";

interface Feature { icon: string; title: string; intro: string; steps: string[]; img: string; alt: string }

const FEATURES: Feature[] = [
  { icon: "🔍", title: "Search around your school",
    intro: "Find apartments near any school or address, filtered by commute, budget, unit type and move-in date. Every price is all-in per person, so listings with different fees compare fairly.",
    steps: ["Type your school or an address, or pick a quick chip such as Northeastern.",
      "Choose how you get to campus (Transit, Walk, Bike) and drag the Max commute and All-in budget sliders.",
      "Each card shows the price per person and travel time to campus; the map shows where each listing is (the green star is campus)."],
    img: search, alt: "Search page with filters, listing cards and map" },
  { icon: "💵", title: "See the real cost before you commit",
    intro: "Rent is only part of the cost. StudentNest adds up the cash you need on move-in day and gives tips specific to each listing.",
    steps: ["Click Cost details on a listing card.",
      "See the first month, last month, security deposit, broker and application fees, and the total cash needed to move in.",
      "Click Save to tracker to keep the listing."],
    img: costDetails, alt: "Cost details expanded on a listing card" },
  { icon: "✨", title: "Paste any listing and let AI read it",
    intro: "Listings are scattered across Zillow, Craigslist, Facebook, WeChat and WhatsApp groups. Paste any of them and AI turns the post into a listing you can compare with the others.",
    steps: ["Click + Paste a listing you found.", "Paste the post text, add screenshots, or paste a link.",
      "Click Convert with AI, or Enter details by hand instead."],
    img: paste, alt: "Paste a listing dialog" },
  { icon: "🚩", title: "Scam warnings",
    intro: "Students who can't visit in person are easy targets for rental scams. When a pasted post shows warning signs, StudentNest flags them before you send any money.",
    steps: ["After Convert with AI, a red box lists any scam signs, such as an owner who is abroad, payment before a viewing, gift cards or wire transfers, or pressure to decide today.",
      "Fields with a yellow edge were estimated because the post didn't say; fix them if you know better.",
      "Read the suggested questions to ask before paying, then save."],
    img: aiResult, alt: "AI result with scam warning and editable fields" },
  { icon: "📋", title: "Track and get a recommendation",
    intro: "Keep every apartment you're considering in one place. Tell StudentNest what matters most and it recommends the best match and explains why.",
    steps: ["Open Tracker at the top.", "Under What matters to you, set how much you care about all-in cost, commute and cash needed to move in.",
      "Move each apartment through Interested → Contacted → Toured → Applied, and add notes such as \"tour Sat 2pm\"."],
    img: tracker, alt: "Tracker with recommendation and saved apartments" },
  { icon: "⚖️", title: "Compare side by side",
    intro: "See your saved apartments in one table so the trade-offs are clear at a glance.",
    steps: ["Scroll down in Tracker to Compare side by side.", "The best value in each row is green."],
    img: compare, alt: "Side-by-side comparison table" },
  { icon: "🔐", title: "Sign in to keep your list everywhere",
    intro: "Signing in saves your tracker, notes and pasted listings to your account so they follow you across devices. AI pasting and real commute times need sign-in.",
    steps: ["Click Sign in in the top right and enter your email.", "Open the link in your inbox on the same device.",
      "Anything you saved before signing in moves into your account."],
    img: signIn, alt: "Sign-in dialog" },
  { icon: "🌙", title: "Light and dark mode",
    intro: "Switch themes with one click; the map switches too, and your choice is remembered.",
    steps: ["Click the moon (or sun) button in the top right."],
    img: darkMode, alt: "Dark mode" },
];

export function GuideView() {
  return (
    <section className="guide">
      <div className="summary"><h1>How to use StudentNest</h1>
        <p>Find apartments near your school, see the true cost, check pasted listings for scams, and compare your options. Open a feature to see the steps and a screenshot.</p></div>

      <div className="guide-quick">
        <a className="btn primary" href="#search">Start searching</a>
        <a className="btn" href="#tracker">Open my tracker</a>
      </div>

      {FEATURES.map((f, i) => (
        <article className="panel guide-item" key={f.title}>
          <h2><span className="guide-icon" aria-hidden="true">{f.icon}</span>{i + 1}. {f.title}</h2>
          <div className="guide-body">
            <p>{f.intro}</p>
            <details>
              <summary>How to use it</summary>
              <ol>{f.steps.map(s => <li key={s}>{s}</li>)}</ol>
              <img src={f.img} alt={f.alt} loading="lazy" width={1280} height={800} />
            </details>
          </div>
        </article>
      ))}
    </section>
  );
}
