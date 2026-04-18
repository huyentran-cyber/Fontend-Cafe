import { useEffect, useState } from 'react';
import { Table, Button, Container, Card, Form, Row, Col, Modal, Spinner } from 'react-bootstrap';
import api from '../../api/api';

function PositionManager() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form dữ liệu cho Vị trí công việc
  const [formData, setFormData] = useState({ 
    id: 0,
    name: '', 
    hourlyRate: 0,
    minStaff: 1,
    maxShiftPerDay: 3
  });

  // Tải dữ liệu từ API
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/Position');
      setPositions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu vị trí:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Xử lý mở Modal
  const handleOpenAdd = () => {
    setEditMode(false);
    setFormData({ id: 0, name: '', hourlyRate: 0, minStaff: 1, maxShiftPerDay: 3 });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditMode(true);
    setFormData({ ...p });
    setShowModal(true);
  };

  // Xử lý gửi dữ liệu (Thêm hoặc Sửa)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        hourlyRate: parseFloat(formData.hourlyRate),
        minStaff: parseInt(formData.minStaff),
        maxShiftPerDay: parseInt(formData.maxShiftPerDay)
      };

      if (editMode) {
        await api.put(`/Position/${formData.id}`, dataToSend);
        alert("Cập nhật vị trí thành công!");
      } else {
        await api.post('/Position', dataToSend);
        alert("Tạo vị trí mới thành công!");
      }
      
      setShowModal(false);
      loadData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || "Thao tác thất bại";
      alert("Lỗi: " + errorMsg);
    }
  };

  // Xử lý xóa
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vị trí này?")) {
      try {
        await api.delete(`/Position/${id}`);
        alert("Xóa vị trí thành công!");
        loadData();
      } catch (err) {
        alert("Lỗi: Vị trí này đang được sử dụng, không thể xóa!");
      }
    }
  };

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" variant="primary" /></Container>;

  return (
    <Container className="mt-4 pb-5">
      {/* HEADER DÀN HÀNG NGANG */}
      <div className="bg-light p-3 rounded shadow-sm mb-4 border">
        <Row className="align-items-center">
          <Col md={6}>
            <h4 className="text-primary fw-bold mb-0">💼 Quản lý Vị trí công việc</h4>
          </Col>
          <Col md={6} className="text-end">
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleOpenAdd} 
              className="rounded-pill px-4 shadow-sm fw-bold"
            >
              + Thêm Vị Trí Mới
            </Button>
          </Col>
        </Row>
      </div>

      <Card className="shadow-sm border-0 overflow-hidden">
        <Table hover responsive className="align-middle mb-0">
          <thead className="table-dark text-center">
            <tr>
              <th>Tên Vị Trí</th>
              <th>Lương / Giờ</th>
              <th>NV tối thiểu</th>
              <th>Ca tối đa/ngày</th>
              <th style={{ width: '120px' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {positions.length > 0 ? (
              positions.map((p) => (
                <tr key={p.id}>
                  <td className="fw-bold text-primary">{p.name}</td>
                  <td className="text-success fw-bold">
                    {p.hourlyRate?.toLocaleString()}đ
                  </td>
                  <td>{p.minStaff} người</td>
                  <td>{p.maxShiftPerDay} ca</td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="border-0 rounded-circle" 
                        onClick={() => handleOpenEdit(p)}
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="border-0 rounded-circle" 
                        onClick={() => handleDelete(p.id)}
                        title="Xóa vị trí"
                      >
                        🗑️
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-4 text-muted italic">
                  Chưa có dữ liệu vị trí nào.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* MODAL THÊM / SỬA */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>{editMode ? "📝 Chỉnh sửa vị trí" : "➕ Thêm vị trí mới"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Tên vị trí</Form.Label>
              <Form.Control 
                required 
                type="text" 
                placeholder="Ví dụ: Pha chế, Phục vụ..."
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Lương theo giờ (VNĐ)</Form.Label>
              <Form.Control 
                required 
                type="number" 
                placeholder="Ví dụ: 25000"
                value={formData.hourlyRate}
                onChange={e => setFormData({...formData, hourlyRate: e.target.value})}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small">NV tối thiểu/ca</Form.Label>
                  <Form.Control 
                    type="number"
                    placeholder="Gợi ý: 1"
                    value={formData.minStaff}
                    onChange={e => setFormData({...formData, minStaff: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small">Ca tối đa/ngày/NV</Form.Label>
                  <Form.Control 
                    type="number"
                    placeholder="Gợi ý: 3"
                    value={formData.maxShiftPerDay}
                    onChange={e => setFormData({...formData, maxShiftPerDay: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button variant="primary" type="submit">
              {editMode ? "Cập nhật" : "Lưu vị trí"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default PositionManager;