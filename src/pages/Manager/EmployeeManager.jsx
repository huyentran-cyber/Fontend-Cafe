import { useEffect, useState } from 'react';
import { Table, Button, Container, Card, Spinner, Badge, Form, Row, Col, Pagination, Modal } from 'react-bootstrap'; 
import api from '../../api/api';

function EmployeeManager() {
  const [emps, setEmps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [positions, setPositions] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: 0, name: '', email: '', phone: '', positionId: '', isActive: true, password: ''
  });


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // GIỮ NGUYÊN LOGIC LOAD DATA CŨ
  const loadData = () => {
    setLoading(true);
    Promise.all([api.get('/Employee'), api.get('/Position')])
      .then(([empRes, posRes]) => {
        setEmps(empRes.data);
        setPositions(posRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy dữ liệu:", err);
        setLoading(false);
      });
  };

  useEffect(() => { loadData(); }, []);

  // LOGIC MỞ MODAL
  const handleOpenAdd = () => {
    setEditMode(false);
    setFormData({ id: 0, name: '', email: '', phone: '', positionId: '', isActive: true, password: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    setEditMode(true);
    setFormData({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      positionId: emp.positionId,
      isActive: emp.isActive,
      password: "" 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/Employee/${formData.id}`, formData);
        alert("Cập nhật thông tin thành công!");
      } else {
        await api.post('/Employee', formData);
        alert("Thêm nhân viên mới thành công!");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || "Thao tác thất bại"));
    }
  };

  // GIỮ NGUYÊN LOGIC FILTER CỦA TRÂN
  const filteredEmps = emps.filter(e => {
    if (filterStatus === 'active') return e.isActive === true;
    if (filterStatus === 'inactive') return e.isActive === false;
    return true; 
  });

  // --- PHẦN THÊM MỚI: LOGIC CHIA TRANG DỰA TRÊN DANH SÁCH ĐÃ LỌC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmps.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmps.length / itemsPerPage);

  const handleFilterChange = (val) => {
    setFilterStatus(val);
    setCurrentPage(1); // Reset về trang 1 khi đổi bộ lọc
  };

  const formatDate = (isoString) => {
    if (!isoString || isoString.startsWith("0001")) return "---";
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? "---" : date.toLocaleDateString('vi-VN');
  };

  const handleStatusChange = async (id, newStatusValue) => {
    const isNowActive = newStatusValue === "true"; 
    const emp = emps.find(x => x.id === id);
    if (window.confirm(`Xác nhận đổi trạng thái cho ${emp.name}?`)) {
      try {
        await api.put(`/Employee/${id}`, { ...emp, isActive: isNowActive, password: "" });
        loadData();
      } catch (err) {
        alert("Cập nhật thất bại!");
      }
    }
  };

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" variant="primary" /></Container>;

  return (
    <Container className="mt-4 pb-5">
      <div className="bg-light p-3 rounded shadow-sm mb-4 border">
        <Row className="align-items-center g-3">
          {/* Cột 1: Tiêu đề (Bên trái) */}
          <Col md={4} xs={12}>
            <h4 className="text-primary fw-bold mb-0 text-center text-md-start">
              👥 Quản lý Nhân sự
            </h4>
          </Col>

          {/* Cột 2: Nút Thêm nhân viên (Chính giữa) */}
          <Col md={4} xs={12} className="text-center">
            <Button 
              variant="success" 
              className="fw-bold rounded-pill shadow-sm px-4"
              onClick={handleOpenAdd}
            >
              ➕ Thêm Nhân Viên
            </Button>
          </Col>

          {/* Cột 3: Bộ lọc (Bên phải) */}
          <Col md={4} xs={12}>
            <Form.Group className="d-flex align-items-center justify-content-center justify-content-md-end">
              <Form.Label className="me-2 mb-0 fw-bold text-muted small">Lọc trạng thái:</Form.Label>
              <Form.Select 
                size="sm" 
                className="rounded-pill border-primary shadow-sm text-primary fw-bold"
                style={{ width: '150px' }}
                value={filterStatus}
                onChange={(e) => { handleFilterChange(e.target.value); }}
              >
                <option value="all">Toàn bộ</option>
                <option value="active">Đang làm</option>
                <option value="inactive">Đã nghỉ</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </div>

      <Card className="shadow-sm border-0 overflow-hidden">
        <Table hover responsive className="align-middle mb-0">
          <thead className="table-dark text-center">
            <tr>
              <th>Thời gian làm việc</th>
              <th>Họ tên</th>
              <th>Vị trí</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Lương/Giờ</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody className='text-center'>
            {currentItems.map(e => ( // Sử dụng currentItems thay vì filteredEmps
              <tr key={e.id}>
                <td className="small text-nowrap">
                  <div className="text-muted fw-bold text-start">Vào: {formatDate(e.attendances?.[0]?.checkIn)}</div>
                  {e.resignationDate && <div className="text-danger mt-1 fw-bold text-start">Nghỉ: {formatDate(e.resignationDate)}</div>}
                </td>
                <td className="text-primary px-3 fw-bold">{e.name}</td>
                <td><Badge bg="info" text="dark">{e.position?.name || "Staff"}</Badge></td>
                <td className="small">{e.email || "---"}</td>
                <td className="small">{e.phone || "---"}</td>
                <td>
                  {e.position?.hourlyRate > 0 
                    ? `${e.position.hourlyRate.toLocaleString()}đ` 
                    : "---"} 
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={e.isActive ? "true" : "false"}
                    onChange={(opt) => handleStatusChange(e.id, opt.target.value)}
                    className={`rounded-pill fw-bold text-center shadow-sm ${e.isActive ? "text-success border-success bg-success-subtle" : "text-danger border-danger bg-danger-subtle"}`}
                    style={{ fontSize: '11px', width: '115px', margin: '0 auto' }}
                  >
                    <option value="true">Đang làm</option>
                    <option value="false">Đã nghỉ</option>
                  </Form.Select>
                </td>
                <td>
                  <div className="d-flex justify-content-center gap-2">
                    <Button variant="outline-primary" size="sm" className="border-0 rounded-circle" onClick={() => handleOpenEdit(e)} title="Sửa thông tin">
                      ✏️
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* --- PHẦN THÊM MỚI: UI PHÂN TRANG --- */}
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

      {/* --- MODAL THÊM / SỬA NHÂN VIÊN --- */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>{editMode ? "📝 Cập nhật nhân viên" : "➕ Thêm nhân viên mới"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Họ và tên</Form.Label>
              <Form.Control 
                required 
                type="text" 
                placeholder="Nhập đầy đủ họ tên..." 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Email</Form.Label>
                  <Form.Control 
                    required 
                    type="email" 
                    placeholder="example@gmail.com" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Số điện thoại</Form.Label>
                  <Form.Control 
                    required 
                    type="text" 
                    placeholder="09xx xxx xxx" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Vị trí</Form.Label>
              <Form.Select 
                required 
                value={formData.positionId} 
                onChange={e => setFormData({...formData, positionId: e.target.value})}
              >
                <option value="">-- Chọn vị trí công việc --</option>
                {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{editMode ? "Đổi mật khẩu" : "Mật khẩu"}</Form.Label>
              <Form.Control 
                required={!editMode} 
                type="text" 
                placeholder={editMode ? "Để trống nếu không muốn đổi..." : "Nhập mật khẩu đăng nhập..."} 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button variant="primary" type="submit">{editMode ? "Lưu thay đổi" : "Tạo nhân viên"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default EmployeeManager;