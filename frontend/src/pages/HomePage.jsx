import { useState } from "react";
import Header from "../components/Header";
import MilestoneBar from "../components/MilestoneBar";
import Leaderboard from "../components/Leaderboard";
import ReferralCard from "../components/ReferralCard";
import DonateModal from "../components/DonateModal";
import useLeaderboard from "../hooks/useLeaderboard";
import "./HomePage.css";

// Section 2. This is the simplified landing/donation page -- the deep-dive
// content (build plan, parts list, full bio) lives on About Us instead.
export default function HomePage() {
  const [donateOpen, setDonateOpen] = useState(false);
  const leaderboard = useLeaderboard();

  return (
    <div className="app-shell">
      <Header />

      <section className="home-hero">
        <h1>Fundraising: Street-legal F1 2026 car</h1>
        <p className="home-hero__tagline">Help make history.</p>
      </section>

      <MilestoneBar
        totalRaisedCents={leaderboard.data?.total_raised_cents}
        fundingGoalCents={leaderboard.data?.funding_goal_cents}
        loading={leaderboard.loading}
      />

      <div className="home-donate-secondary">
        <button type="button" className="btn-primary" onClick={() => setDonateOpen(true)}>
          Donate
        </button>
      </div>

      <section className="home-section">
        <div className="home-leaderboard-heading-row">
          <h2>Leaderboard</h2>
        </div>
        <Leaderboard
          entries={leaderboard.data?.entries}
          loading={leaderboard.loading}
          error={leaderboard.error}
        />
      </section>

      <section className="home-section home-car-description">
        <div className="home-car-description__text">
          <h2>Street-legal 2026 F1 car</h2>
          <p>
            This build starts from a real Formula 1-style chassis and pairs it with a
            transplanted Nissan GT-R engine, chosen after months of research into
            performance, transplantability, and fuel economy. Target numbers (subject to
            change as the build progresses): placeholder horsepower, placeholder top
            speed. Paddle shifters, carbon fiber covers, adjustable ride height, and a
            full brake system round out the spec.
          </p>
          <p>
            Most people assume something like this takes a professional team and a
            professional budget. This build is proof that a determined teenager, real
            volunteer mentors, and a community of donors can create a genuine world
            first.
          </p>
        </div>
      </section>

      <p className="home-about-link">
        Want the full story, parts list, and build plan? Head to{" "}
        <a href="/about-us">About Us</a>.
      </p>

      <section className="home-section home-two-column">
        <div>
          <h2>How ranking works</h2>
          <ul className="home-ranking-list">
            <li>Every $0.50 you donate is worth 1 point.</li>
            <li>A referral is worth 5 points -- but only once your friend actually donates.</li>
            <li>Referral points never count just from a link click, only a confirmed donation.</li>
            <li>Ranking is by total points, not raw dollars, so referrals genuinely matter.</li>
            <li>Gold, Silver, and Bronze are relative -- tiers update live as more people join.</li>
          </ul>
        </div>
        <ReferralCard />
      </section>

      <section className="home-section home-reward-explainer">
        <h2>Rewards</h2>
        <p>$75+ donated puts your name on the car.</p>
        <p>The top 3 all-time donors get a major sponsorship-style spot -- our most prominent recognition.</p>
      </section>

      <div className="home-donate-primary">
        <button type="button" className="btn-primary" onClick={() => setDonateOpen(true)}>
          Donate
        </button>
        <p className="home-security-line">
          Payments securely processed by Stripe -- we never see or store your card details.
        </p>
      </div>

      {donateOpen && <DonateModal onClose={() => setDonateOpen(false)} />}
    </div>
  );
}
