import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import CounselorDashboard from './components/CounselorDashboard';
import LibrarianDashboard from './components/LibrarianDashboard';
import PeonDashboard from './components/PeonDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/counselor" element={<CounselorDashboard />} />
        <Route path="/librarian" element={<LibrarianDashboard />} />
        <Route path="/peon" element={<PeonDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;