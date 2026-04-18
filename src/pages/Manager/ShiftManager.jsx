import { useEffect, useState } from 'react';
import { Table, Button, Container, Badge, Card, Form, Row, Col, Modal, Spinner } from 'react-bootstrap';
import api from '../../api/api';

function ShiftManager() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null); // Trạng thái: null là thêm mới, có ID là đang sửa

  const [formData, setFormData] = useState({ 
    name: '', 
    startTime: '', 
    endTime: '', 
    positionId: '' 
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [shiftRes, posRes] = await Promise.all([
        api.get('/Shift'),
        api.get('/Position')
      ]);
      setShifts(Array.isArray(shiftRes.data) ? shiftRes.data : []);
      setPositions(posRes.data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Hàm mở Modal để Sửa
  const handleEdit = (shift) => {
    setEditId(shift.id);
    setFormData({
      name: shift.name,
      startTime: shift.startTime?.substring(0, 5), // Lấy HH:mm
      endTime: shift.endTime?.substring(0, 5),
      positionId: shift.positionId
    });
    setShowModal(true);
  };

  // Hàm đóng Modal và reset form
  const handleClose = () => {
    setShowModal(false);
    setEditId(null);
    setFormData({ name: '', startTime: '', endTime: '', positionId: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
      name: formData.name,
      // Thêm giây :00 để chắc chắn Backend nhận được HH:mm:ss
      startTime: formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime,
      endTime: formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime,
      positionId: parseInt(formData.positionId),
      deptType: "All" 
    };
      
      if (editId) {
        // CALL API CẬP NHẬT (PUT)
        await api.put(`/Shift/${editId}`, dataToSend);
        alert("Cập nhật ca làm việc thành công!");
      } else {
        // CALL API THÊM MỚI (POST)
        await api.post('/Shift', dataToSend);
        alert("Tạo ca làm việc thành công!");
      }

      handleClose();
      loadData();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || "Không thể lưu ca"));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa ca làm này?")) {
      try {
        await api.delete(`/Shift/${id}`);
        alert("Xóa ca làm thành công!");
        loadData();
      } catch (err) {
        alert("Lỗi: " + (err.response?.data?.message || "Không thể xóa ca này!"));
      }
    }
  };

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" variant="primary" /></Container>;

  return (
    <Container className="mt-4 pb-5">
      <div className="bg-light p-3 rounded shadow-sm mb-4 border">
        <Row className="align-items-center">
          <Col md={6}>
            <h4 className="text-primary fw-bold mb-0">⏱️ Quản lý Ca làm việc</h4>
          </Col>
          <Col md={6} className="text-end">
            <Button 
              variant="primary" size="sm" className="fw-bold rounded-pill shadow-sm px-4" 
              onClick={() => { setEditId(null); setShowModal(true); }}
            >
              + Tạo Ca Mới
            </Button>
          </Col>
        </Row>
      </div>

      <Card className="shadow-sm border-0 overflow-hidden">
        <Table hover responsive className="align-middle mb-0">
          <thead className="table-dark text-center">
            <tr>
              <th>Tên Ca</th>
              <th>Vị trí áp dụng</th>
              <th>Giờ Bắt Đầu</th>
              <th>Giờ Kết Thúc</th>
              <th style={{ width: '150px' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {shifts.length > 0 ? (
              shifts.map((s) => (
                <tr key={s.id}>
                  <td className="fw-bold text-primary">{s.name}</td>
                  <td>
                    <Badge bg="info" text="dark" className="text-uppercase shadow-sm">
                      {s.position?.name || "N/A"} 
                    </Badge>
                  </td>
                  <td className="fw-bold text-success">{s.startTime?.substring(0, 5)}</td>
                  <td className="fw-bold text-danger">{s.endTime?.substring(0, 5)}</td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <Button 
                        variant="outline-warning" size="sm" className="border-0 rounded-circle" 
                        onClick={() => handleEdit(s)} title="Sửa ca làm"
                      >
                        ✏️
                      </Button>
                      <Button 
                        variant="outline-danger" size="sm" className="border-0 rounded-circle" 
                        onClick={() => handleDelete(s.id)} title="Xóa ca làm"
                      >
                        🗑️
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="py-4 text-muted">Chưa có ca làm việc nào.</td></tr>
            )}
          </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton className={editId ? "bg-warning text-dark" : "bg-primary text-white"}>
          <Modal.Title>{editId ? "Cập nhật Ca làm việc" : "Tạo Ca Làm Việc Mới"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Tên ca</Form.Label>
              <Form.Control 
                required type="text" placeholder="Ví dụ: Ca Sáng, Ca Gãy..."
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Vị trí áp dụng</Form.Label>
              <Form.Select 
                required 
                value={formData.positionId}
                onChange={e => setFormData({...formData, positionId: e.target.value})}
              >
                <option value="">-- Chọn vị trí --</option>
                {positions.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Giờ bắt đầu</Form.Label>
                  <Form.Control 
                    required type="time" 
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Giờ kết thúc</Form.Label>
                  <Form.Control 
                    required type="time" 
                    value={formData.endTime}
                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Hủy</Button>
            <Button variant={editId ? "warning" : "primary"} type="submit">
              {editId ? "Cập nhật ngay" : "Lưu ca làm"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default ShiftManager;