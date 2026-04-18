import { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Alert, Spinner } from 'react-bootstrap';
import api from '../../api/api';

function RegisterSchedule() {
  const [data, setData] = useState({ workDate: '', shiftId: '' });
  const [availableShifts, setAvailableShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', content: '' });

  // State quản lý việc đóng/mở cổng từ Admin
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    
    const fetchData = async () => {
      setFetchLoading(true);
      try {
        // Gọi đồng thời lấy danh sách ca và trạng thái cổng
        const [shiftRes, statusRes] = await Promise.all([
          api.get(`/WorkSchedule/available-shifts/${userId}`),
          api.get('/WorkSchedule/registration-status')
        ]);

        setAvailableShifts(shiftRes.data);
        if (shiftRes.data.length > 0) {
          setData(prev => ({ ...prev, shiftId: shiftRes.data[0].id }));
        }

        // Cập nhật trạng thái cổng
        setIsRegistrationOpen(statusRes.data.isOpen);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        setMessage({ type: 'danger', content: 'Lỗi kết nối máy chủ!' });
      } finally {
        setFetchLoading(false);
      }
    };

    if (userId) fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isRegistrationOpen) return;

    setLoading(true);
    const userId = localStorage.getItem('userId');
    const payload = {
      employeeId: parseInt(userId),
      shiftId: parseInt(data.shiftId),
      workDate: data.workDate
    };

    try {
      const response = await api.post('/WorkSchedule/register', payload);
      setMessage({ 
        type: 'success', 
        content: response.data.message || 'Gửi yêu cầu thành công!' 
      });
      setData({ ...data, workDate: '' });
    } catch (err) {
      setMessage({ 
        type: 'danger', 
        content: err.response?.data?.message || 'Lỗi đăng ký ca làm!' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <Container className="mt-5 text-center"><Spinner animation="border" variant="primary" /></Container>;

  return (
    <Container className="mt-5">
      <Card 
        className={`p-4 shadow border-0 mx-auto ${!isRegistrationOpen ? 'bg-light' : ''}`} 
        style={{ maxWidth: '450px', borderRadius: '20px', transition: '0.3s' }}
      >
        {/* PHẦN ĐẦU CARD: HIỂN THỊ TRẠNG THÁI KHÓA/MỞ */}
        <div className="text-center mb-4">
          <div className="display-4 mb-2">
            {isRegistrationOpen ? '🔓' : '🔒'}
          </div>
          <h4 className={`fw-bold m-0 ${isRegistrationOpen ? 'text-primary' : 'text-danger'}`}>
            {isRegistrationOpen ? 'Đăng ký ca làm mới' : 'Cổng đăng ký đang đóng'}
          </h4>
          <p className="text-muted small mt-2">
            {isRegistrationOpen 
              ? "Chọn ngày và ca làm việc bạn muốn đăng ký" 
              : "Quản lý hiện đã khóa chức năng đăng ký ca"}
          </p>
        </div>

        {/* THÔNG BÁO ĐỎ KHI CỔNG ĐÓNG */}
        {!isRegistrationOpen && (
          <Alert variant="danger" className="border-0 shadow-sm text-center mb-4 py-3">
            <h6 className="fw-bold mb-1">📢 Thông báo hệ thống</h6>
            <div className="small">
              Hiện tại không trong thời gian đăng ký lịch làm việc. 
              Vui lòng liên hệ Quản lý để biết thêm chi tiết!
            </div>
          </Alert>
        )}

        {/* THÔNG BÁO KẾT QUẢ (THÀNH CÔNG/LỖI) */}
        {message.content && (isRegistrationOpen || message.type === 'danger') && (
          <Alert variant={message.type} className="py-2 small text-center rounded-pill mb-3">
            {message.content}
          </Alert>
        )}

        {/* FORM ĐĂNG KÝ: MỜ ĐI (OPACITY) KHI ĐÓNG CỔNG */}
        <Form onSubmit={handleSubmit} style={{ opacity: isRegistrationOpen ? 1 : 0.5 }}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold small ms-2 text-muted">📅 Chọn ngày làm việc</Form.Label>
            <Form.Control 
              type="date" 
              required 
              disabled={!isRegistrationOpen} 
              value={data.workDate}
              className="rounded-pill border-primary-subtle shadow-sm"
              onChange={e => setData({...data, workDate: e.target.value})} 
              min={new Date().toISOString().split('T')[0]}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-bold small ms-2 text-muted">🕒 Chọn ca làm việc</Form.Label>
            <Form.Select 
              className="rounded-pill border-primary-subtle shadow-sm"
              value={data.shiftId}
              disabled={!isRegistrationOpen || availableShifts.length === 0}
              onChange={e => setData({...data, shiftId: e.target.value})}
            >
              {availableShifts.length > 0 ? (
                availableShifts.map(shift => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} ({shift.startTime.slice(0, 5)} - {shift.endTime.slice(0, 5)})
                  </option>
                ))
              ) : (
                <option value="">Không có ca phù hợp</option>
              )}
            </Form.Select>
          </Form.Group>

          <Button 
            variant={isRegistrationOpen ? "primary" : "secondary"} 
            type="submit" 
            className="w-100 rounded-pill fw-bold shadow-sm py-2"
            disabled={loading || !isRegistrationOpen || availableShifts.length === 0}
          >
            {loading ? <Spinner size="sm" animation="border" className="me-2"/> : null}
            {isRegistrationOpen ? 'Gửi yêu cầu đăng ký' : 'Đang khóa đăng ký'}
          </Button>
        </Form>
      </Card>
    </Container>
  );
}

export default RegisterSchedule;