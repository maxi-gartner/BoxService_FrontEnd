const styles = {
  ok: "bg-[#3fb95019] border-[#3fb95050] text-success",
  error: "bg-[#f8514919] border-[#f8514950] text-danger",
};

export function Alert({ type, children }: { type: "ok" | "error"; children: React.ReactNode }) {
  if (!children) return null;

  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles[type]}`}>{children}</div>;
}
