import Header from "../components/Header";
import Footer from "../components/Footer";
import ProjectPlanStepper from "../components/ProjectPlanStepper";
import VideoCarousel from "../components/VideoCarousel";
import PartsListTable from "../components/PartsListTable";
import FundsUpdatesLog from "../components/FundsUpdatesLog";
import "./AboutUsPage.css";

const SOCIAL_LINKS = [
  { label: "TikTok", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "YouTube", href: "#" },
];

export default function AboutUsPage() {
  return (
    <div className="app-shell">
      <Header />

      {/* Section 4a: the logo->name transform animation is explicitly
          deferred to the brand book pass -- this is a static stand-in. */}
      <div className="about-branding">
        <span>Formula Zany</span>
        <span className="about-branding__by">by Zane Little</span>
      </div>

      <section className="about-section about-bio">
        <div className="about-bio__photo" aria-hidden="true">
          Photo
        </div>
        <div className="about-bio__text">
          <p>
            I'm Zane Little. I'm 15, going into my sophomore year. I know that's not very
            inspiring, but what it doesn't show is that I'm also already taking college courses,
            and I built this entire website myself. Formula 1 hasn't just been an interest of
            mine — it's been an obsession for as long as I can remember.
          </p>
          <p>
            I might be young. I might be underqualified on paper. But I have what most people my
            age don't: the drive to learn, the social network of real engineers, welders, and
            mechanics who are willing to teach, and a straight road into automotive trade school
            ahead of me.
          </p>
          <p>
            The one thing standing in my way isn't skill. It's funding. I come from a
            middle-class family — we don't have the money to support a project of this
            magnitude, and even my own parents aren't sure it's possible.
          </p>
          <p>
            This build is my proof. Proof to the world, and proof to the people closest to me,
            that dedication and ambition allow us humans to create things that weren't thought to
            be possible.
          </p>
          <p className="about-bio__signature">— Zane Little</p>
        </div>
      </section>

      <section className="about-section about-car">
        <div className="about-car__image" aria-hidden="true">
          Car photo
        </div>
        <div className="about-car__text">
          <h2>Street-legal 2026 F1 car</h2>
          <p>
            This build starts from a real Formula 1-style chassis and pairs it with a
            transplanted Nissan GT-R engine, chosen after months of research into performance,
            transplantability, and fuel economy. Target numbers (subject to change as the build
            progresses): placeholder horsepower, placeholder top speed. Paddle shifters, carbon
            fiber covers, adjustable ride height, and a full brake system round out the spec.
          </p>
          <p>
            Most people assume something like this takes a professional team and a professional
            budget. This build is proof that a determined teenager, real volunteer mentors, and a
            community of donors can create a genuine world first.
          </p>
        </div>
      </section>

      <section className="about-section">
        <h2>Project plan</h2>
        <ProjectPlanStepper />
      </section>

      <section className="about-section about-video-section">
        <h2>Latest updates</h2>
        <div className="about-video-section__row">
          <VideoCarousel />
          <div className="about-video-section__socials">
            <h3>Follow along</h3>
            {SOCIAL_LINKS.map((s) => (
              <a key={s.label} href={s.href}>
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Parts list</h2>
        <PartsListTable />
      </section>

      <section className="about-section">
        <h2>Funds &amp; updates log</h2>
        <FundsUpdatesLog />
      </section>

      <Footer />
    </div>
  );
}
