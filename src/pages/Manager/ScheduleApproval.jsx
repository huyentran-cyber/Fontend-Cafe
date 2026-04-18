import { useEffect, useState } from 'react';
import { Table, Button, Container, Badge, Spinner, Stack, Form, Row, Col, Pagination, Card } from 'react-bootstrap';
import api from '../../api/api';

function ScheduleApproval() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. State cho bộ lọc
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterPosition, setFilterPosition] = useState('');
  const [positions, setPositions] = useState([]);

  // --- THÊM STATE ĐÓNG/MỞ CỔNG ---
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  // 2. STATE PHÂN TRANG
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Tải danh sách vị trí và trạng thái cổng
  useEffect(() => {
    api.get('/Position')
      .then(res => setPositions(res.data))
      .catch(err => console.error("Lỗi tải vị trí:", err));
    
    // Lấy trạng thái cổng đăng ký từ Backend
    api.get('/WorkSchedule/registration-status')
      .then(res => setIsRegistrationOpen(res.data.isOpen))
      .catch(err => console.error("Lỗi tải trạng thái cổng"));
  }, []);

  // Hàm load dữ liệu danh sách chờ duyệt
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/WorkSchedule/pending`, {
        params: {
          date: filterDate,
          positionId: filterPosition || null
        }
      });
      setList(res.data);
      setCurrentPage(1); 
    } catch (err) {
      console.error("Lỗi tải danh sách phê duyệt:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterDate, filterPosition]);

  // --- HÀM XỬ LÝ ĐÓNG/MỞ CỔNG ---
  const handleToggleRegistration = async () => {
    const newStatus = !isRegistrationOpen;
    const actionName = newStatus ? "MỞ CỔNG" : "ĐÓNG CỔNG";
    if (window.confirm(`Bạn có chắc muốn ${actionName} đăng ký ca làm cho nhân viên?`)) {
      try {
        await api.post(`/WorkSchedule/toggle-registration?status=${newStatus}`);
        setIsRegistrationOpen(newStatus);
        alert(`${actionName} thành công!`);
      } catch (err) {
        alert("Lỗi thao tác cổng đăng ký!");
      }
    }
  };

  // LOGIC TÍNH TOÁN PHÂN TRANG
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = list.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(list.length / itemsPerPage);

  const handleUpdateStatus = async (id, status) => {
    const actionName = status === "Confirmed" ? "duyệt" : "từ chối";
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} ca làm này?`)) return;
    
    try {
      const endpoint = status === "Confirmed" ? `confirm` : `reject`;
      await api.put(`/WorkSchedule/${id}/${endpoint}`);
      alert(`Đã ${actionName} thành công!`);
      load(); 
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi thao tác!");
    }
  };

  return (
    <Container className="mt-4 pb-5">
    <div className="bg-light p-3 rounded shadow-sm mb-4 border">
      <Row className="align-items-center g-2 text-nowrap">
        
        {/* 1. Tiêu đề */}
        <Col md={2} className="d-flex align-items-center">
          <h4 className="text-primary fw-bold mb-0" style={{ fontSize: '1.2rem' }}>
            📅 Duyệt lịch
          </h4>
        </Col>

        {/* 2. Nút Mở Đăng Ký */}
        <Col md={2} className="text-center">
          <Button 
            variant={isRegistrationOpen ? "danger" : "success"} 
            size="sm" 
            className="fw-bold rounded-pill shadow-sm border-2 w-100"
            onClick={handleToggleRegistration}
            style={{ height: '38px', maxWidth: '180px' }}
          >
            {isRegistrationOpen ? "🔒 Đóng Đăng Ký" : "🔓 Mở Đăng Ký"}
          </Button>
        </Col>

        {/* 3. Lọc Ngày */}
        <Col md={3}>
          <div className="d-flex align-items-center gap-2">
            <label className="fw-bold text-muted small mb-0">Ngày:</label>
            <Form.Control 
              type="date" 
              size="sm" 
              className="rounded-pill border-primary shadow-sm text-primary fw-bold w-100"
              style={{ height: '38px' }}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </Col>

        {/* 4. Lọc Vị trí */}
        <Col md={3}>
          <div className="d-flex align-items-center gap-2">
            <label className="fw-bold text-muted small mb-0">Vị trí:</label>
            <Form.Select 
              size="sm" 
              className="rounded-pill border-primary shadow-sm w-100"
              style={{ height: '38px' }}
              value={filterPosition} 
              onChange={(e) => setFilterPosition(e.target.value)}
            >
              <option value="">-- Vị trí --</option>
              {positions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Form.Select>
          </div>
        </Col>

        {/* 5. Nút Làm mới */}
        <Col md={2} className="text-end">
          <Button variant="outline-primary" size="sm" onClick={load} className="rounded-pill px-3 shadow-sm">
            🔄 Làm mới
          </Button>
        </Col>
      </Row>
    </div>

      {loading ? (
        <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>
      ) : (
        <Card className="shadow-sm border-0 overflow-hidden">
          <Table hover responsive className="align-middle mb-0">
            <thead className="table-dark text-center">
              <tr>
                <th>Nhân viên</th>
                <th>Vị trí</th>
                <th>Ngày làm</th>
                <th>Ca</th>
                <th>Khung giờ</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {currentItems.length > 0 ? (
                currentItems.map((s) => (
                  <tr key={s.id}>
                    <td className="fw-bold text-dark">{s.employeeName}</td>
                    <td><Badge bg="info" className="text-uppercase small">{s.positionName}</Badge></td>
                    <td>{new Date(s.workDate).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <Badge pill bg="secondary" className="px-3">{s.shiftName}</Badge>
                    </td>
                    <td className="text-primary fw-bold">
                      {s.startTime?.slice(0, 5)} - {s.endTime?.slice(0, 5)}
                    </td>
                    <td>
                      <Stack direction="horizontal" gap={2} className="justify-content-center">
                        <Button variant="success" size="sm" className="px-3 rounded-pill" onClick={() => handleUpdateStatus(s.id, "Confirmed")}>Duyệt</Button>
                        <Button variant="outline-danger" size="sm" className="rounded-pill" onClick={() => handleUpdateStatus(s.id, "Rejected")}>Từ chối</Button>
                      </Stack>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-5 italic">
                     Không tìm thấy yêu cầu chờ duyệt.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center py-3 bg-light border-top">
              <Pagination size="sm" className="mb-0 shadow-sm">
                <Pagination.Prev 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1} 
                />
                {[...Array(totalPages)].map((_, i) => (
                    <Pagination.Item 
                        key={i + 1} 
                        active={i + 1 === currentPage} 
                        onClick={() => setCurrentPage(i + 1)}
                    >
                        {i + 1}
                    </Pagination.Item>
                ))}
                <Pagination.Next 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages} 
                />
              </Pagination>
            </div>
          )}
        </Card>
      )}
    </Container>
  );
}

export default ScheduleApproval;