import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import {
  listParticipants,
  addParticipant,
  removeParticipant,
  getLeaderboard,
  CompetitionParticipant,
  CompetitionDailyRecord,
} from '../../api/competition';

interface ParticipantWithRecords extends CompetitionParticipant {
  dailyRecords: CompetitionDailyRecord[];
}

const AdminCompetitionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const competitionId = id || "";

  const [participants, setParticipants] = useState<ParticipantWithRecords[]>([]);
  const [leaderboard, setLeaderboard] = useState<CompetitionParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentIdInput, setStudentIdInput] = useState('');

  const loadData = async () => {
    if (!competitionId) return;
    try {
      setLoading(true);
      setError(null);
      const parts = await listParticipants(competitionId);
      setParticipants(parts);
      const lb = await getLeaderboard(competitionId);
      setLeaderboard(lb.leaderboard || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [competitionId]);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitionId || !studentIdInput) return;
    try {
      setError(null);
      await addParticipant(competitionId, studentIdInput);
      setStudentIdInput('');
      await loadData();
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'خطا در افزودن دانش‌آموز';
      setError(msg);
    }
  };

  const onRemove = async (studentId: string) => {
    if (!competitionId || !window.confirm('این دانش‌آموز از رقابت حذف شود؟')) return;
    try {
      setError(null);
      await removeParticipant(competitionId, studentId);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'خطا در حذف دانش‌آموز');
    }
  };

  if (!competitionId) {
    return <div className="p-4">ID رقابت نامعتبر است.</div>;
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div><div className="text-xs text-muted">پنل مدیریت / رقابت‌ها</div><h1 className="mt-1 text-2xl font-extrabold">مدیریت شرکت‌کنندگان</h1><p className="mt-1 text-xs text-muted" dir="ltr">{competitionId}</p></div>
        <Badge variant="info">مدیریت رقابت</Badge>
      </div>

      <Card hover={false} className="mb-5">
        <h2 className="font-semibold mb-3">افزودن دانش‌آموز</h2>
        <form onSubmit={onAdd} className="flex items-end gap-2">
          <div className="flex flex-col text-sm">
            <label>کد کاربر (User ID)</label>
            <input
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              className="input"
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
          >
            افزودن
          </button>
        </form>
        {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
      </Card>

      <Card hover={false} className="mb-5">
        <h2 className="font-semibold mb-3">لیست شرکت‌کنندگان</h2>
        {loading ? (
          <p>در حال بارگذاری...</p>
        ) : participants.length === 0 ? (
          <p className="text-sm text-gray-600">شرکت‌کننده‌ای ثبت نشده است.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "rgb(var(--border))" }}><table className="w-full min-w-[720px] text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-2 py-1">ID</th>
                <th className="border px-2 py-1">User ID</th>
                <th className="border px-2 py-1">دقیقه مطالعه</th>
                <th className="border px-2 py-1">صحیح</th>
                <th className="border px-2 py-1">غلط</th>
                <th className="border px-2 py-1">نزده</th>
                <th className="border px-2 py-1">رتبه نهایی</th>
                <th className="border px-2 py-1">حذف</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id}>
                  <td className="border px-2 py-1 text-center">{p.id}</td>
                  <td className="border px-2 py-1 text-center">{p.studentId}</td>
                  <td className="border px-2 py-1 text-center">{p.totalStudyMinutes}</td>
                  <td className="border px-2 py-1 text-center">{p.totalCorrect}</td>
                  <td className="border px-2 py-1 text-center">{p.totalWrong}</td>
                  <td className="border px-2 py-1 text-center">{p.totalEmpty}</td>
                  <td className="border px-2 py-1 text-center">{p.finalRank ?? '-'}</td>
                  <td className="border px-2 py-1 text-center">
                    <button
                      className="text-red-600 underline"
                      onClick={() => onRemove(p.studentId)}
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </Card>

      <Card hover={false}>
        <h2 className="font-semibold mb-3">لیدربرد</h2>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-gray-600">هنوز رکوردی ثبت نشده است.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "rgb(var(--border))" }}><table className="w-full min-w-[620px] text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-2 py-1">ردیف</th>
                <th className="border px-2 py-1">User ID</th>
                <th className="border px-2 py-1">دقیقه مطالعه</th>
                <th className="border px-2 py-1">صحیح</th>
                <th className="border px-2 py-1">غلط</th>
                <th className="border px-2 py-1">نزده</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((p, idx) => (
                <tr key={p.id}>
                  <td className="border px-2 py-1 text-center">{idx + 1}</td>
                  <td className="border px-2 py-1 text-center">{p.studentId}</td>
                  <td className="border px-2 py-1 text-center">{p.totalStudyMinutes}</td>
                  <td className="border px-2 py-1 text-center">{p.totalCorrect}</td>
                  <td className="border px-2 py-1 text-center">{p.totalWrong}</td>
                  <td className="border px-2 py-1 text-center">{p.totalEmpty}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </Card>
    </div>
  );
};

export default AdminCompetitionDetail;
