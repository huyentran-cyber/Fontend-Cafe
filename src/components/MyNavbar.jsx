import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

function MyNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(localStorage.getItem('role'));
  const [name, setName] = useState(localStorage.getItem('userName'));

  // Xác định quyền
  const isManager = role === '0' || role === 'Manager';
  const isStaff = role === '1' || role === 'Staff';

  useEffect(() => {
    setRole(localStorage.getItem('role'));
    setName(localStorage.getItem('userName'));
  }, [location]);

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4 shadow sticky-top">
      <Container>
        <Navbar.Brand as={Link} to={isManager ? "/admin/employees" : "/attendance"} className="fw-bold text-warning">
          ☕ COFFEE ERP
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav className="me-auto">
            {isStaff && (
              <>
                <Nav.Link as={Link} to="/attendance">Chấm công</Nav.Link>
                <Nav.Link as={Link} to="/register-schedule">Đăng ký ca</Nav.Link>
                <Nav.Link as={Link} to="/my-schedule">Lịch làm việc</Nav.Link>
                <Nav.Link as={Link} to="/leave-request">Xin nghỉ</Nav.Link>
                <Nav.Link as={Link} to="/my-salary">Xem lương</Nav.Link>
              </>
            )}
            {isManager && (
              <>
                <Nav.Link as={Link} to="/admin/position">Vị trí</Nav.Link>
                <Nav.Link as={Link} to="/admin/shift">Ca làm</Nav.Link>
                <Nav.Link as={Link} to="/admin/employees">Nhân sự</Nav.Link>
                <Nav.Link as={Link} to="/admin/schedules">Chốt lịch làm</Nav.Link>
                <Nav.Link as={Link} to="/admin/attendance">Quản lý chấm công</Nav.Link>
                <Nav.Link as={Link} to="/admin/leave">Duyệt nghỉ</Nav.Link>
                <Nav.Link as={Link} to="/admin/reports">Báo cáo lương</Nav.Link>
              </>
            )}
          </Nav>
          <Navbar.Text className="me-3 text-light">Chào, <b>{name}</b></Navbar.Text>
          <Button variant="outline-danger" size="sm" onClick={logout}>Đăng xuất</Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
export default MyNavbar;