import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Table, Badge, Spinner } from 'react-bootstrap';
import api from '../../api/api';

function LeaveRequest() {
  const [formData, setFormData] = useState({
    offDate: '', // Fix: Đổi leaveDate thành offDate để khớp với LeaveRequestDTO trong C#
    reason: '',
  });
  const [status, setStatus] = useState({ msg: '', type: '' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem('userId');

  // Load lịch sử nghỉ phép
  const loadHistory = async () => {
    try {
      // Fix: Khớp đường dẫn api/LeaveRequest/my-history/{id}
      const res = await api.get(`/LeaveRequest/my-history/${userId}`);
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi tải lịch sử nghỉ:", err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Fix: Gửi đúng cấu trúc DTO: { employeeId, offDate, reason }
      const dataToSend = {
        employeeId: parseInt(userId),
        offDate: formData.offDate,
        reason: formData.reason
      };

      // Fix: Khớp đường dẫn api/LeaveRequest/submit
      await api.post('/LeaveRequest/submit', dataToSend);
      
      setStatus({ msg: 'Gửi yêu cầu thành công!', type: 'success' });
      setFormData({ offDate: '', reason: '' });
      loadHistory(); 
    } catch (err) {
      setStatus({ msg: 'Gửi yêu cầu thất bại. Kiểm tra lại ngày nghỉ.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  // Hàm helper hiển thị Badge trạng thái (Khớp với Enum LeaveStatus: 0, 1, 2)
  const renderStatusBadge = (statusValue) => {
    // Backend trả về Enum: 0 = Pending, 1 = Approved, 2 = Rejected
    if (statusValue === 0 || statusValue === "Pending") 
      return <Badge bg="warning-subtle" text="dark" className="border border-warning px-3 rounded-pill">Chờ duyệt</Badge>;
    if (statusValue === 1 || statusValue === "Approved") 
      return <Badge bg="success-subtle" text="success" className="border border-success px-3 rounded-pill">Đồng ý</Badge>;
    if (statusValue === 2 || statusValue === "Rejected") 
      return <Badge bg="danger-subtle" text="danger" className="border border-danger px-3 rounded-pill">Từ chối</Badge>;
  };

  return (
    <Container className="mt-4 pb-5">
      <div className="bg-light p-3 rounded shadow-sm mb-4 border text-danger fw-bold">
        🏖️ Quản Lý Đơn Xin Nghỉ Phép
      </div>

      <Row>
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm border-0 p-4 rounded-4">
            <h5 className="fw-bold mb-4">Tạo đơn nghỉ</h5>
            {status.msg && <Alert variant={status.type} className="small">{status.msg}</Alert>}
            
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Ngày xin nghỉ</Form.Label>
                <Form.Control 
                  type="date" 
                  value={formData.offDate}
                  required 
                  onChange={e => setFormData({...formData, offDate: e.target.value})}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold">Lý do nghỉ</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={4} 
                  placeholder="Vui lòng nhập lý do cụ thể..."
                  value={formData.reason}
                  required
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                />
              </Form.Group>

              <Button variant="danger" type="submit" className="w-100 fw-bold py-2 shadow-sm" disabled={loading}>
                {loading ? <Spinner size="sm" animation="border" /> : "GỬI ĐƠN XIN NGHỈ"}
              </Button>
            </Form>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow-sm border-0 overflow-hidden">
            <Table hover responsive className="align-middle mb-0 text-center">
              <thead className="table-dark">
                <tr>
                  <th>Ngày Nghỉ</th>
                  <th>Lý Do</th>
                  <th>Đột xuất</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  history.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-bold">{new Date(item.offDate).toLocaleDateString('vi-VN')}</td>
                      <td className="small text-muted text-start text-center">{item.reason}</td>
                      <td>
                        {item.isEmergency ? 
                          <Badge bg="danger">Đột xuất</Badge> : 
                          <Badge bg="secondary-subtle" text="dark">Bình thường</Badge>
                        }
                      </td>
                      <td>{renderStatusBadge(item.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="py-5 text-muted italic">Bạn chưa có đơn nghỉ phép nào.</td></tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default LeaveRequest;