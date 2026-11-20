import Container from "../components/Container";
import Card from "../components/Card";
import { advisors } from "../data/advisors";

export default function AdvisorsPage() {
  return (
    <div className="py-10 page-enter">
      <Container>
        <div>
          <div className="text-2xl font-extrabold">مشاوران</div>
          <div className="mt-2 text-sm text-muted">برای رزرو مشاوره، از صفحه اصلی اقدام کنید.</div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {advisors.map((a) => (
            <Card key={a.id} className="overflow-hidden" hover={false}>
              <div className="flex items-center gap-3">
                <img src={a.image} alt={a.name} className="h-250 w-140 rounded-2xl ring-1 ring-white/10" />
                <div>
                </div>
              </div>
              <ul className="mt-4 text-sm text-muted leading-7 space-y-1">
              </ul>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}
