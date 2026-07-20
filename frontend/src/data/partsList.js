// PLACEHOLDER parts list -- Section 4e explicitly frames this as illustrative
// sample content until the real list is available, the same way milestones
// are placeholders (see milestones.js). Not admin-editable like FundsUpdate;
// swap this array once the real list exists.
const PARTS_LIST = [
  { part: "Chassis frame", status: "ready" },
  { part: "Engine block", status: "ordered" },
  { part: "Suspension kit", status: "lacking-funds" },
  { part: "Brake system", status: "lacking-funds" },
  { part: "Wiring harness", status: "ordered" },
  { part: "Roll cage tubing", status: "lacking-funds" },
];

export const STATUS_LABELS = {
  ready: "Ready for install",
  ordered: "Ordered",
  "lacking-funds": "Lacking funds",
};

export default PARTS_LIST;
