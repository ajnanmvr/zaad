import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { QueryProvider } from "@/lib/query-provider";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Unauthorized from "@/pages/Unauthorized";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";

// App Pages
import Dashboard from "@/pages/Dashboard";
import CompanyList from "@/pages/companies/List";
import CompanyForm from "@/pages/companies/Form";
import CompanyDetail from "@/pages/companies/Detail";
import EmployeeList from "@/pages/employees/List";
import EmployeeForm from "@/pages/employees/Form";
import EmployeeDetail from "@/pages/employees/Detail";
import TaskList from "@/pages/tasks/List";
import TaskForm from "@/pages/tasks/Form";
import InvoiceList from "@/pages/invoices/List";
import InvoiceForm from "@/pages/invoices/Form";
import LiabilityList from "@/pages/liabilities/List";
import LiabilityForm from "@/pages/liabilities/Form";
import RecordList from "@/pages/records/List";
import RecordForm from "@/pages/records/Form";
import ExpiringDocuments from "@/pages/documents/Expiring";
import DocumentForm from "@/pages/documents/Form";
import FinancialDashboard from "./pages/Financials";
import CalendarPage from "@/pages/Calendar";
import ZaadExpenseForm from "@/pages/zaad-expenses/Form";
import UserForm from "@/pages/users/Form";
import ZaadExpensesList from "@/pages/zaad-expenses/List";
import UserList from "@/pages/users/List";
import IndividualList from "@/pages/individuals/List";
import IndividualForm from "@/pages/individuals/Form";
import IndividualDetail from "@/pages/individuals/Detail";
import InvoiceDetail from "@/pages/invoices/Detail";
import RecordDetail from "@/pages/records/Detail";
import TaskDetail from "@/pages/tasks/Detail";
import UserDetail from "@/pages/users/Detail";
import LiabilityDetail from "@/pages/liabilities/Detail";
import ZaadExpenseDetail from "@/pages/zaad-expenses/Detail";

function App() {
  return (
    <QueryProvider>
      <Routes>
        {/* Auth Routes - No Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* App Routes - With Layout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  
                  {/* Companies */}
                  <Route path="/companies" element={<CompanyList />} />
                  <Route path="/companies/new" element={<CompanyForm />} />
                  <Route path="/companies/:id" element={<CompanyDetail />} />
                  <Route path="/companies/:id/edit" element={<CompanyForm />} />

                  {/* Individuals */}
                  <Route path="/individuals" element={<IndividualList />} />
                  <Route path="/individuals/new" element={<IndividualForm />} />
                  <Route path="/individuals/:id" element={<IndividualDetail />} />
                  <Route path="/individuals/:id/edit" element={<IndividualForm />} />

                  {/* Records */}
                  <Route path="/records" element={<RecordList />} />
                  <Route path="/records/new" element={<RecordForm />} />
                  <Route path="/records/:id" element={<RecordDetail />} />
                  <Route path="/records/:id/edit" element={<RecordForm />} />

                  {/* Invoices */}
                  <Route path="/invoices" element={<InvoiceList />} />
                  <Route path="/invoices/new" element={<InvoiceForm />} />
                  <Route path="/invoices/:id" element={<InvoiceDetail />} />
                  <Route path="/invoices/:id/edit" element={<InvoiceForm />} />

                  {/* Liabilities */}
                  <Route path="/liabilities" element={<LiabilityList />} />
                  <Route path="/liabilities/new" element={<LiabilityForm />} />
                  <Route path="/liabilities/:id" element={<LiabilityDetail />} />
                  <Route path="/liabilities/:id/edit" element={<LiabilityForm />} />

                  {/* Documents */}
                  <Route path="/documents/expiring" element={<ExpiringDocuments />} />
                  <Route path="/documents/new" element={<DocumentForm />} />

                  {/* Zaad Expenses */}
                  <Route path="/zaad-expenses" element={<ZaadExpensesList />} />
                  <Route path="/zaad-expenses/new" element={<ZaadExpenseForm />} />
                  <Route path="/zaad-expenses/:id" element={<ZaadExpenseDetail />} />
                  <Route path="/zaad-expenses/:id/edit" element={<ZaadExpenseForm />} />

                  {/* Tasks */}
                  <Route path="/tasks" element={<TaskList />} />
                  <Route path="/tasks/new" element={<TaskForm />} />
                  <Route path="/tasks/:id" element={<TaskDetail />} />
                  <Route path="/tasks/:id/edit" element={<TaskForm />} />

                  {/* Employees */}
                  <Route path="/employees" element={<EmployeeList />} />
                  <Route path="/employees/new" element={<EmployeeForm />} />
                  <Route path="/employees/:id" element={<EmployeeDetail />} />
                  <Route path="/employees/:id/edit" element={<EmployeeForm />} />

                  {/* Users */}
                  <Route path="/users" element={<UserList />} />
                  <Route path="/users/new" element={<UserForm />} />
                  <Route path="/users/:id" element={<UserDetail />} />
                  <Route path="/users/:id/edit" element={<UserForm />} />

                  {/* Other */}
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/financials" element={<FinancialDashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />

                  {/* 404 */}
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </QueryProvider>
  );
}

export default App;
