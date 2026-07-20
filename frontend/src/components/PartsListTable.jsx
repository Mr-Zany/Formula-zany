import PARTS_LIST, { STATUS_LABELS } from "../data/partsList";
import "./PartsListTable.css";

// Section 4e: scrollable table, three status colors (green/blue/red).
export default function PartsListTable() {
  return (
    <div className="parts-list">
      <table>
        <thead>
          <tr>
            <th>Part</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {PARTS_LIST.map((p) => (
            <tr key={p.part}>
              <td>{p.part}</td>
              <td>
                <span className={`parts-list__status parts-list__status--${p.status}`}>
                  {STATUS_LABELS[p.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
