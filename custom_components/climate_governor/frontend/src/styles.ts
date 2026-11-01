import { css } from "lit";

// Theme-aware via HA's CSS custom properties so dark mode works for free.
export const sharedStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    color: var(--primary-text-color);
  }

  * {
    box-sizing: border-box;
  }

  header.app-header {
    background-color: var(--app-header-background-color);
    color: var(--app-header-text-color, var(--primary-text-color));
    border-bottom: 1px solid var(--divider-color);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    position: sticky;
    top: 0;
    z-index: 5;
  }

  header.app-header ha-icon,
  header.app-header .menu {
    color: inherit;
  }

  header.app-header .title {
    font-size: 1.1rem;
    font-weight: 500;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  nav.tabs {
    display: flex;
    gap: 4px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--divider-color);
    overflow-x: auto;
    background: var(--card-background-color);
  }

  nav.tabs a {
    color: var(--primary-text-color);
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 999px;
    white-space: nowrap;
    font-size: 0.9rem;
  }

  nav.tabs a.active {
    background: rgba(var(--accent-color), 0.14);
    background: var(--secondary-background-color);
    color: var(--primary-color);
    font-weight: 600;
  }

  main {
    padding: 16px;
    max-width: 1100px;
    margin: 0 auto;
  }

  h2 {
    font-size: 1.15rem;
    font-weight: 500;
    margin: 4px 0 12px;
  }

  .grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  .card {
    background: var(--card-background-color);
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    padding: 16px;
    display: block;
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    transition: box-shadow 0.15s ease;
  }

  .card:hover {
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  }

  .card .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 1.05rem;
    margin-bottom: 4px;
  }

  .card .subtitle {
    color: var(--secondary-text-color);
    font-size: 0.85rem;
    margin-bottom: 12px;
  }

  .stat-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .stat {
    display: flex;
    flex-direction: column;
  }

  .stat .value {
    font-size: 1.3rem;
    font-weight: 600;
  }

  .stat .label {
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .chip {
    font-size: 0.75rem;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--secondary-background-color);
    color: var(--primary-text-color);
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .chip.on {
    background: var(--success-color, #4caf50);
    color: #fff;
  }

  .chip.warn {
    background: var(--warning-color, #ff9800);
    color: #fff;
  }

  .chip.off {
    background: var(--error-color, #f44336);
    color: #fff;
  }

  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 12px 0;
  }

  button,
  .btn {
    font: inherit;
    border: none;
    border-radius: 8px;
    padding: 8px 14px;
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
  }

  button.secondary,
  .btn.secondary {
    background: var(--secondary-background-color);
    color: var(--primary-text-color);
  }

  button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .empty {
    text-align: center;
    color: var(--secondary-text-color);
    padding: 40px 16px;
  }

  .muted {
    color: var(--secondary-text-color);
  }

  table.week {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  table.week th,
  table.week td {
    border: 1px solid var(--divider-color);
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }

  table.week th {
    background: var(--secondary-background-color);
    font-weight: 600;
  }

  .kv {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 6px 16px;
    font-size: 0.9rem;
  }

  .kv dt {
    color: var(--secondary-text-color);
  }

  .kv dd {
    margin: 0;
  }

  .back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--primary-color);
    text-decoration: none;
    cursor: pointer;
    margin-bottom: 12px;
    background: none;
    border: none;
    padding: 0;
    font-size: 0.9rem;
  }

  .section {
    margin-top: 20px;
  }

  .bar {
    height: 8px;
    border-radius: 4px;
    background: var(--secondary-background-color);
    overflow: hidden;
    margin-top: 4px;
  }

  .bar > span {
    display: block;
    height: 100%;
    background: var(--primary-color);
  }
`;
