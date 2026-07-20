// PLACEHOLDER milestone data -- PRD Section 2c/14 explicitly flags the real
// amounts/descriptions as pending the actual build spec sheet. Each entry
// is a threshold (in cents) plus a short status line; swapping in real
// numbers later is just editing this array, nothing else changes.
const MILESTONES = [
  { thresholdCents: 200_000, icon: "\u{1F529}", label: "Chassis", status: "Frame welded" },
  { thresholdCents: 1_000_000, icon: "\u{1F527}", label: "Suspension & brakes", status: "Parts ordered" },
  { thresholdCents: 5_000_000, icon: "\u{1F6E0}️", label: "Engine", status: "In progress" },
  { thresholdCents: 10_000_000, icon: "\u{1F3CE}️", label: "Cosmetic & livery", status: "Not started" },
  { thresholdCents: 15_000_000, icon: "\u{1F3C1}", label: "Track-ready", status: "Not started" },
];

export default MILESTONES;
