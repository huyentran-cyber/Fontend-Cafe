import { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api'; 

function Attendance() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();
  
  const userRole = localStorage.getItem('role');

  useEffect(() => {
    if (userRole === 'Manager' || userRole === '0') {
      navigate('/admin/employees');
    }
  }, [userRole, navigate]);

  const handleAction = async (actionType) => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.post(`/Attendance/${actionType}`); 
      setMessage({ 
        type: 'success', 
        text: `${actionType === 'checkin' ? 'Vào ca' : 'Tan ca'} thành công!` 
      });
    } catch (err) {
      console.error(err);
      setMessage({ 
        type: 'danger', 
        text: err.response?.data?.message || 'Lỗi: Bạn chưa có ca làm hoặc đã chấm công rồi!' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Trả về null trong khi useEffect đang điều hướng để tránh nháy giao diện
  if (userRole === 'Manager' || userRole === '0') return null;

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow border-0 rounded-4 p-4 text-center">
            <div className="mb-4">
              <h2 className="fw-bold text-primary">📱 CHẤM CÔNG</h2>
              <p className="text-muted">Nhân viên vui lòng thực hiện vào/tan ca</p>
            </div>

            <div className="p-4 border rounded bg-light shadow-sm">
              <h5 className="mb-3 fw-bold">Trạm Chấm Công</h5>
              
              {message.text && (
                <Alert variant={message.type} className="py-2 mb-3">
                  {message.text}
                </Alert>
              )}
              
              <div className="d-flex gap-3 justify-content-center">
                <Button 
                  variant="success" 
                  size="lg"
                  className="px-4 fw-bold shadow-sm"
                  disabled={loading} 
                  onClick={() => handleAction('checkin')}
                >
                  {loading ? <Spinner size="sm" animation="border" /> : 'CHECK-IN'}
                </Button>

                <Button 
                  variant="danger" 
                  size="lg"
                  className="px-4 fw-bold shadow-sm"
                  disabled={loading} 
                  onClick={() => handleAction('checkout')}
                >
                  {loading ? <Spinner size="sm" animation="border" /> : 'CHECK-OUT'}
                </Button>
              </div>
            </div>

            <div className="mt-4 small text-muted italic">
              * Thời gian chấm công sẽ được dùng để đối soát bảng lương cuối tháng.
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Attendance;