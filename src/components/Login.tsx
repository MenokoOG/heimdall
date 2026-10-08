import { useState } from "react";

interface Props {
  notice: string;
  onSubmit: (token: string) => void;
}

export function Login({ notice, onSubmit }: Props) {
  const [draft, setDraft] = useState("");
  const [show, setShow] = useState(false);

  return (
    <main className="shell login">
      <h1>Heimdall</h1>
      <p className="muted">Enter the read token to watch the bridge.</p>
      {notice && <p role="status" className="notice">{notice}</p>}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(draft.trim());
        }}
      >
        <input
          type={show ? "text" : "password"}
          aria-label="Read token"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoComplete="off"
          autoFocus
        />
        <button type="button" className="ghost" onClick={() => setShow((s) => !s)} aria-pressed={show}>
          {show ? "Hide" : "Show"}
        </button>
        <button type="submit" className="primary" disabled={!draft.trim()}>Open</button>
      </form>
    </main>
  );
}
