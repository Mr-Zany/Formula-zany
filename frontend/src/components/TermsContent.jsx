// The Terms of Service draft body (Section 5c), shared between the
// standalone /terms page and the re-consent pop-up so the two never drift
// out of sync. Kept as a draft, not presented as finalized, matching the
// source document's own framing. Placeholders (LLC name, contact email,
// effective date) are left as brackets rather than invented.
export default function TermsContent() {
  return (
    <>
      <h1>Terms of Service — DRAFT</h1>

      <div className="terms-page__notice">
        <p>
          <strong>Important notice before you use this document:</strong>
        </p>
        <p>
          This is a starting draft, not a finished legal document. Before this goes live for
          real, it needs review by an actual adult/parent and ideally a lawyer, including:
        </p>
        <ol>
          <li>
            The Site is intended to be operated by a formal LLC (not yet formed) on behalf of a
            minor; who legally holds that responsibility needs to be settled with a
            parent/guardian before anything goes live.
          </li>
          <li>
            Refund and liability language has real limits on what it can actually protect
            against, especially once a physical car exists that could eventually be driven on
            public roads.
          </li>
          <li>
            Remaining placeholder fields still need real information filled in: the LLC's legal
            name (once formed), and a contact email/effective date once ready to publish.
          </li>
        </ol>
      </div>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By creating an account, donating, or otherwise using the Formula Zany website (the
        "Site"), you agree to these Terms of Service ("Terms"). If you do not agree, please do
        not use the Site.
      </p>
      <p>
        The Site is operated by <strong>[LLC Name — to be formed]</strong>, a limited liability
        company ("we," "us," "the Operator") on behalf of the Formula Zany build project.
      </p>

      <h2>2. What This Site Is</h2>
      <p>
        Formula Zany is a fundraiser supporting the construction of a street-legal,
        Formula-style car build. The Site allows visitors to make donations, view a public
        leaderboard of donors, participate in a referral program, and follow build progress and
        updates.
      </p>
      <p>
        <strong>This project is not a registered nonprofit organization.</strong> Donations are
        not tax-deductible unless explicitly stated otherwise in writing.
      </p>

      <h2>3. Eligibility</h2>
      <ul>
        <li>
          You must be able to form a legally binding agreement to make a donation. If you are
          under the age of majority in your jurisdiction, a parent or guardian should make the
          donation or supervise the transaction.
        </li>
        <li>
          <strong>You must be at least 13 years old to create an account.</strong> This is
          confirmed via a checkbox at sign-up, self-attesting your age.
        </li>
        <li>You must provide accurate information when creating an account and keep it up to date.</li>
        <li>
          One account per person. Creating multiple accounts to manipulate the leaderboard,
          referral system, or points totals is prohibited (see Section 7).
        </li>
      </ul>

      <h2>4. Donations</h2>
      <ul>
        <li>
          <strong>Donations are voluntary contributions, not purchases.</strong> You are not
          buying a good or service; you are supporting a personal project.
        </li>
        <li>
          <strong>You do not need to create an account to donate.</strong> Donations can be
          made anonymously with no account at all. Anonymous donations do not appear on the
          public leaderboard and do not earn points, rank, or referral credit. Anonymous donors
          explicitly agree to these Terms via a checkbox at the point of donation.
        </li>
        <li>
          <strong>Donations are final and non-refundable</strong>, except where required by
          applicable law.
        </li>
        <li>
          We are committed to using donations solely for costs directly related to the build —
          parts, tools, materials, and associated project expenses.
        </li>
        <li>
          <strong>Public accountability:</strong> build progress, the parts list, and milestone
          status are tracked publicly on the Site and updated as work happens.
        </li>
        <li>
          <strong>If the project cannot be completed as planned:</strong> we will post a public
          update explaining what happened and providing an accounting of how funds were used.
          Any funds not yet spent will be either applied to the closest reasonably achievable
          version of the project, or directed toward continued Formula Zany build documentation
          and video production costs — whichever is communicated publicly at the time.
        </li>
        <li>
          Recognition rewards described below will be honored as described in Section 5,
          subject only to reasonable practical constraints (e.g. physical space on the livery,
          final build timeline).
        </li>
        <li>
          All names, logos, and content displayed on the car, leaderboard, or Site must be
          appropriate. The Operator reserves the right to reject, edit, or remove any content
          that is crude, contains slurs, is offensive, discriminatory, or otherwise
          inappropriate, without refund. Disputes go through Contact (Section 17).
        </li>
      </ul>

      <h2>5. Recognition Rewards, Ranks, and Points</h2>
      <ul>
        <li>
          Donors who give $75 or more <strong>will</strong> have their name included on the car,
          subject to reasonable practical constraints.
        </li>
        <li>The top 3 all-time donors <strong>will</strong> receive a prominent sponsorship-style recognition spot on the car.</li>
        <li>
          The leaderboard, tiers (Bronze/Silver/Gold), points, and Placement numbers are for
          recognition and engagement purposes only.{" "}
          <strong>Points have no cash value and cannot be redeemed, transferred, sold, or
          exchanged for money or anything else.</strong>
        </li>
        <li>The Operator reserves the right to correct, adjust, or reset leaderboard data in the case of technical errors, fraud, or abuse.</li>
      </ul>

      <h2>6. Referral Program</h2>
      <ul>
        <li>
          Users may receive a personal referral link. Referral points are only credited when
          someone who used your link completes a confirmed donation — not simply by clicking
          the link.
        </li>
        <li>
          Attempting to manipulate the referral system (fake accounts, self-referral schemes,
          automated/bot traffic, etc.) is prohibited and may result in forfeiture of points,
          referral credit, or account suspension.
        </li>
      </ul>

      <h2>7. Prohibited Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Attempt to defraud the donation system (e.g., disputing legitimate charges in bad faith, using stolen payment information)</li>
        <li>Create multiple accounts to manipulate rankings, points, or referral credit</li>
        <li>Harass, threaten, or abuse other users or the Operator</li>
        <li>Attempt to gain unauthorized access to the Site, other users' accounts, or backend systems</li>
        <li>Use the Site for any unlawful purpose</li>
      </ul>
      <p>Violation of these terms may result in account suspension, forfeiture of points/rank, and/or removal from the leaderboard.</p>

      <h2>8. Names, Display Names, and Profile Pictures</h2>
      <ul>
        <li><strong>Your full name must be your actual real name.</strong> This is what's used by default for public recognition and account records.</li>
        <li><strong>Your display name</strong> must not be crude, offensive, discriminatory, contain slurs, or otherwise violate the appropriateness standard in Section 5.</li>
        <li><strong>Your profile picture</strong> is held to the same standard.</li>
        <li>
          Violating this section may result in your display name or profile picture being
          removed or reset by the Operator, and your account may be suspended or permanently
          taken down for repeated or severe violations. Disputes go through Contact (Section
          17).
        </li>
      </ul>

      <h2>9. Accounts and Security</h2>
      <ul>
        <li>You are responsible for keeping your login credentials confidential.</li>
        <li>
          Profile picture and display name changes are limited to once every two weeks (a brief
          grace window immediately after a change allows fixing an obvious mistake without
          counting as a separate change).
        </li>
        <li>The Operator may suspend or terminate accounts that violate these Terms.</li>
      </ul>

      <h2>10. Third-Party Services</h2>
      <p>The Site uses third-party services to operate, including but not limited to:</p>
      <ul>
        <li><strong>Stripe</strong> for payment processing</li>
        <li><strong>Brevo</strong> and <strong>Resend</strong> for account/email communications</li>
        <li><strong>Google Analytics</strong> for site traffic and usage analytics</li>
        <li>Embedded content from YouTube, TikTok, Instagram, and Facebook</li>
      </ul>
      <p>Your use of these features is also subject to those companies' own terms of service and privacy policies, which the Operator does not control.</p>

      <h2>11. Intellectual Property</h2>
      <ul>
        <li>Content on the Site (text, images, build updates, design) belongs to the Operator unless otherwise credited.</li>
        <li>
          <strong>Formula Zany is not affiliated with, endorsed by, or sponsored by Formula 1,
          FIA, or Formula One Group in any way, shape, or form.</strong> All references to
          F1-style design are inspirational only.
        </li>
      </ul>

      <h2>12. Disclaimer of Warranties</h2>
      <p>
        The Site and the project are provided "as is." Because this is a novel, ambitious
        build, we can't guarantee an exact timeline, that the vehicle will be street-legal in
        every jurisdiction, or an exact final specification. What we do guarantee is what's
        already promised in Section 4: donations are used for their stated purpose, progress is
        tracked publicly, and if plans change, that will be communicated honestly.
      </p>

      <h2>13. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, the Operator shall not be liable for indirect,
        incidental, special, or consequential damages arising from your use of the Site or
        participation in this fundraiser. This section does not apply to, and does not limit
        liability arising from, the design, construction, or operation of the physical vehicle
        itself — that liability requires dedicated legal and insurance review well before the
        vehicle is ever driven.
      </p>

      <h2>14. Privacy</h2>
      <p>
        [Placeholder — a separate Privacy Policy describing what data is collected and how it's
        used/stored/shared will be linked here. This document does not currently serve as a
        Privacy Policy.]
      </p>

      <h2>15. Changes to These Terms</h2>
      <p>
        The Operator may update these Terms from time to time. When a material change is made,
        users will be shown a pop-up displaying the updated Terms, with a notice that they have
        changed. You will be given two options: <strong>"Agree to Continue"</strong>, or{" "}
        <strong>"Log Out Instead."</strong> There is no other way to dismiss this notice.
        Choosing to log out will not delete your account or any rewards, points, or recognition
        already earned. <strong>Changes will not be applied retroactively to strip away
        rewards, recognition, or points already earned at the time of the change.</strong>
      </p>

      <h2>16. Governing Law</h2>
      <p>These Terms are governed by the laws of the <strong>State of Arizona</strong>, without regard to conflict of law principles.</p>

      <h2>17. Contact</h2>
      <p>Questions about these Terms can be sent via the contact form on the Site, or to [contact email — placeholder].</p>

      <p className="terms-page__effective-date"><strong>Effective date:</strong> [Placeholder — fill in once finalized]</p>
    </>
  );
}
