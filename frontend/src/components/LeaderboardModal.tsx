import { useEffect, useState } from "react";
import Card from "./Card";
import { fetchTop10 } from "../lib/apiLeaderboard";

type Row = {
  rank: number;
  userName: string;
  correct: number;
  wrong: number;
  blank: number;
  percent: number;
};

export default function LeaderboardModal({
  examId,
  onClose,
}: {
  examId: string;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchTop10(examId);
        setRows(data);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">۱۰ نفر برتر آزمون</h3>
          <button onClick={onClose} className="chip">بستن</button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="text-sm text-muted">در حال بارگذاری...</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted">
              هنوز نتیجه‌ای ثبت نشده است
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => {
                const score = r.correct * 3 - r.wrong;

                return (
                  <div
                    key={r.rank}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">

                      {/* medal */}
                      {r.rank === 1 && (
                        <span className="text-xl">🥇</span>
                      )}
                      {r.rank === 2 && (
                        <span className="text-xl">🥈</span>
                      )}
                      {r.rank === 3 && (
                        <span className="text-xl">🥉</span>
                      )}
                      {r.rank > 3 && (
                        <span className="chip">{r.rank}</span>
                      )}

                      <div>
                        <div className="font-medium">{r.userName}</div>
                        <div className="text-xs text-muted">
                          صحیح {r.correct} | غلط {r.wrong} | نزده {r.blank}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                    <div className="text-xs text-muted">
                    {(() => {
  const total = r.correct + r.wrong + r.blank;
  const score = r.correct * 3 - r.wrong;
  const percent = total ? (score / (3 * total)) * 100 : 0;
  return Number(percent.toFixed(1)).toLocaleString("fa-IR");
})()}٪
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
