import { Navigate, Route, Routes } from "react-router-dom";
import SiteLayout from "./components/SiteLayout";
import Landing from "./pages/Landing";
import Courses from "./pages/Courses";
import AdvisorsPage from "./pages/AdvisorsPage";
import About from "./pages/About";
import Help from "./pages/Help";
import Shop from "./pages/Shop";
import NoteDetail from "./pages/NoteDetail";
import CartPage from "./pages/Cart";
import CheckoutPage from "./pages/Checkout";
import Exams from "./pages/Exams";
import ExamStart from "./pages/ExamStart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

// Admin
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminExamBuilder from "./pages/Admin/ExamBuilder";
import AdminExams from "./pages/Admin/Exams";
import AdminStudents from "./pages/Admin/Students";
import AdminOrders from "./pages/Admin/Orders";
import AdminWorkReports from "./pages/Admin/WorkReports";
import AdminNotes from "./pages/Admin/Notes";
import AdminAttempts from "./pages/Admin/Attempts";
import AdminAttemptDetail from "./pages/Admin/AttemptDetail";
import AdminBookings from "./pages/Admin/Bookings";
import AdminCompetitions from "./pages/Admin/AdminCompetitions";
import AdminCompetitionDetail from "./pages/Admin/AdminCompetitionDetail";
import AdminPrivateStudents from "./pages/Admin/AdminPrivateStudents";
import AdminPrivateStudentPlan from "./pages/Admin/AdminPrivateStudentPlan";



// Student
import StudentLayout from "./pages/Student/StudentLayout";
import StudentDashboard from "./pages/Student/Dashboard";
import StudentResults from "./pages/Student/Results";
import StudentAnalysis from "./pages/Student/Analysis";
import StudentOrders from "./pages/Student/Orders";
import StudentWorkReports from "./pages/Student/WorkReports";
import StudentCompetition from "./pages/Student/StudentCompetition";
import StudentPlan from "./pages/Student/StudentPlan";
import AdvisorLayout from "./pages/Advisor/AdvisorLayout";
import AdvisorStudents from "./pages/Advisor/AdvisorStudents";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Landing />} />
        <Route path="courses" element={<Courses />} />
        <Route path="advisors" element={<AdvisorsPage />} />
        <Route path="about" element={<About />} />
        <Route path="help" element={<Help />} />
        <Route path="shop" element={<Shop />} />
        <Route path="shop/:id" element={<NoteDetail />} />
        <Route path="cart" element={<CartPage />} />
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <RoleRoute allow={["student"]}>
                <CheckoutPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route path="exams" element={<Exams />} />
        <Route
          path="exams/:id/start"
          element={
            <ProtectedRoute>
              <ExamStart />
            </ProtectedRoute>
          }
        />

        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Admin area */}
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <RoleRoute allow={["admin"]}>
                <AdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="exams" element={<AdminExams />} />
          <Route path="exams/new" element={<AdminExamBuilder />} />
          <Route path="notes" element={<AdminNotes />} />
          <Route path="attempts" element={<AdminAttempts />} />
          <Route path="attempts/:attemptId" element={<AdminAttemptDetail />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="work-reports" element={<AdminWorkReports />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="competitions" element={<AdminCompetitions />} />
          <Route path="competitions/:id" element={<AdminCompetitionDetail />} />
          <Route path="private-students" element={<AdminPrivateStudents />} />
          <Route path="private-students/:userId" element={<AdminPrivateStudentPlan />} />

        </Route>

       {/* Student area */}
<Route
  path="student"
  element={
    <ProtectedRoute>
      <RoleRoute allow={["student"]}>
        <StudentLayout />
      </RoleRoute>
    </ProtectedRoute>
  }
>
  <Route index element={<StudentDashboard />} />
  <Route path="results" element={<StudentResults />} />
  <Route path="analysis/:attemptId" element={<StudentAnalysis />} />
  <Route path="orders" element={<StudentOrders />} />
  <Route path="work-reports" element={<StudentWorkReports />} />
  <Route path="competition" element={<StudentCompetition />} />
  <Route path="plan" element={<StudentPlan />} />
</Route>


{/* Advisor area */}
<Route
  path="advisor"
  element={
    <ProtectedRoute>
      <RoleRoute allow={["advisor"]}>
        <AdvisorLayout />
      </RoleRoute>
    </ProtectedRoute>
  }
>
  <Route index element={<AdvisorStudents />} />
  <Route path="private-students/:userId" element={<AdminPrivateStudentPlan />} />
</Route>

        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
